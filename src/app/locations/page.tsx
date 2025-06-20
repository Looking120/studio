
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MapComponent, { type MapMarkerData } from '@/components/map-component';
import type { Employee } from '@/lib/data'; // Frontend Employee type
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Added CardContent
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RefreshCw, AlertTriangle, Users, MapPinned, Info as InfoIcon } from 'lucide-react'; // Added InfoIcon
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetchEmployees, getCurrentEmployeeLocation, type EmployeeLocation } from '@/services/employee-service'; // Changed import
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';
import { useRouter } from 'next/navigation';

const GOMEL_COORDS = { lat: 52.4345, lng: 30.9754 };
const DEFAULT_CITY_ZOOM = 11;

export default function LocationsPage() {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [locationsData, setLocationsData] = useState<Record<string, EmployeeLocation | null>>({}); // Changed type to EmployeeLocation
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);
  const [errorLocations, setErrorLocations] = useState<string | null>(null); // To store general location fetching errors

  const [mapCenter, setMapCenter] = useState(GOMEL_COORDS); 
  const [mapZoom, setMapZoom] = useState(DEFAULT_CITY_ZOOM);
  const [fetchSummaryMessage, setFetchSummaryMessage] = useState<string | null>(null);


  const { toast } = useToast();
  const router = useRouter();

  const loadAllEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    setErrorEmployees(null);
    try {
      const fetchedEmployees = await fetchEmployees(); 
      setAllEmployees(fetchedEmployees || []);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      const msg = err instanceof Error ? err.message : "Could not fetch employees.";
      setErrorEmployees(msg);
      toast({ variant: "destructive", title: "Error Loading Employees", description: msg });
      setAllEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [toast, router]);

  useEffect(() => {
    loadAllEmployees();
  }, [loadAllEmployees]);

  const employeesToFetchLocationsFor = useMemo(() => {
    if (isLoadingEmployees) return [];
    if (filter === 'all') return allEmployees;
    return allEmployees.filter(emp => {
        const currentStatusLower = emp.currentStatus?.toLowerCase();
        if (filter === 'active') {
            return currentStatusLower !== 'offline';
        }
        if (filter === 'inactive') {
            return currentStatusLower === 'offline';
        }
        return false; 
    });
  }, [allEmployees, filter, isLoadingEmployees]);

  const fetchAllLocations = useCallback(async () => {
    if (employeesToFetchLocationsFor.length === 0 && !isLoadingEmployees) {
        setLocationsData({});
        setErrorLocations(null); // Clear general location errors
        setFetchSummaryMessage(null);
        return;
    }
    if (employeesToFetchLocationsFor.length === 0) return;

    setIsLoadingLocations(true);
    setErrorLocations(null); // Clear general location errors at start of fetch
    setFetchSummaryMessage(null);
    const newLocations: Record<string, EmployeeLocation | null> = {};
    let individualFetchErrors = 0;
    let unauthorizedEncountered = false;

    for (const emp of employeesToFetchLocationsFor) {
      if (emp.id) {
        try {
          // Use getCurrentEmployeeLocation from employee-service
          const loc = await getCurrentEmployeeLocation(emp.id); 
          if (loc && loc.latitude != null && loc.longitude != null) {
            newLocations[emp.id] = loc;
          } else {
            console.warn(`[LocationsPage] No valid location data (lat/lng) returned for employee ${emp.name || 'Unknown'} (ID: ${emp.id}) from getCurrentEmployeeLocation. API response for location:`, loc);
            newLocations[emp.id] = null; 
          }
        } catch (error) {
          individualFetchErrors++;
          console.error(`[LocationsPage] Failed to fetch location for employee ${emp.name || 'Unknown'} (ID: ${emp.id}) using getCurrentEmployeeLocation:`, error);
          newLocations[emp.id] = null; 
          if (error instanceof UnauthorizedError) {
            unauthorizedEncountered = true; 
          } else if (error instanceof HttpError && error.status !== 404) {
            // Collect general errors if not 404 (which is handled by null location)
            setErrorLocations(prev => prev ? `${prev}; ${error.message}` : error.message);
          }
        }
      }
    }

    if (unauthorizedEncountered) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again."});
        await signOut();
        router.push('/');
        setIsLoadingLocations(false);
        return; 
    }
    
    setLocationsData(newLocations);
    setIsLoadingLocations(false);

    // setErrorLocations is now set for general non-404 errors during loop
    // fetchSummaryMessage will handle the count of missing ones
    if (individualFetchErrors > 0 && !errorLocations) { // If individual errors happened but no general error was set
        const errorMsg = `Could not fetch locations for ${individualFetchErrors} employee(s). Some map markers may be missing or outdated. Check console for details.`;
        // setErrorLocations(errorMsg); // This might be too noisy if some are expected to be 404. Let fetchSummaryMessage handle counts.
        // toast({ variant: "warning", title: "Location Fetch Issues", description: errorMsg, duration: 7000 });
    }
  }, [employeesToFetchLocationsFor, toast, router, isLoadingEmployees]);

  useEffect(() => {
    fetchAllLocations();
  }, [fetchAllLocations]);


  const displayableEmployeeLocations: MapMarkerData[] = useMemo(() => {
    return employeesToFetchLocationsFor
      .map(emp => {
        const locationInfo = locationsData[emp.id]; 
        // Ensure locationInfo is not null and has valid coordinates
        if (locationInfo && typeof locationInfo.latitude === 'number' && typeof locationInfo.longitude === 'number') {
          const empName = emp.name || 'Unknown Employee'; // Removed locationInfo.employeeName
          const empJobTitle = emp.jobTitle || 'N/A';
          const empActivityStatus = emp.currentStatus || 'N/A';
          const locationType = locationInfo.locationType || 'Unknown location type';
          const lastSeen = locationInfo.timestamp ? new Date(locationInfo.timestamp).toLocaleString() : 'Timestamp N/A';
          
          return {
            id: emp.id,
            latitude: locationInfo.latitude,
            longitude: locationInfo.longitude,
            title: empName,
            description: `${empJobTitle} - Status: ${empActivityStatus}. At: ${locationType}. Last seen: ${lastSeen}`,
            icon: (
                <div className="relative cursor-pointer transform hover:scale-110 transition-transform">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                        <AvatarImage src={emp.avatarUrl} alt={empName} data-ai-hint="person map" />
                        <AvatarFallback>{empName ? empName.substring(0,1).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    {emp.currentStatus && emp.currentStatus.toLowerCase() !== 'offline' && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                </div>
            )
          };
        }
        return null;
      })
      .filter(Boolean) as MapMarkerData[];
  }, [employeesToFetchLocationsFor, locationsData]);

  useEffect(() => {
    if (displayableEmployeeLocations.length > 0) {
      const avgLat = displayableEmployeeLocations.reduce((sum, m) => sum + m.latitude, 0) / displayableEmployeeLocations.length;
      const avgLng = displayableEmployeeLocations.reduce((sum, m) => sum + m.longitude, 0) / displayableEmployeeLocations.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(displayableEmployeeLocations.length === 1 ? 13 : 10); 
    } else if (!isLoadingEmployees && !isLoadingLocations) {
      setMapCenter(GOMEL_COORDS); 
      setMapZoom(DEFAULT_CITY_ZOOM); 
    }
  }, [displayableEmployeeLocations, isLoadingEmployees, isLoadingLocations]);

  useEffect(() => {
    if (!isLoadingLocations && !isLoadingEmployees && employeesToFetchLocationsFor.length > 0) {
        const displayedIds = new Set(displayableEmployeeLocations.map(m => m.id));
        const missingCount = employeesToFetchLocationsFor.filter(emp => emp.id && !displayedIds.has(emp.id)).length;

        if (missingCount > 0) {
            setFetchSummaryMessage(`${missingCount} employee(s) in the current filter could not be displayed on the map due to missing or invalid location data.`);
        } else if (employeesToFetchLocationsFor.length > 0 && displayableEmployeeLocations.length === 0 && !errorLocations) {
             setFetchSummaryMessage(`No employees in the current filter have valid location data to display. Ensure their locations are being reported to the '/employees/{id}/location/current' endpoint.`);
        } else {
            setFetchSummaryMessage(null); 
        }
    } else if (!isLoadingEmployees && employeesToFetchLocationsFor.length === 0 && filter !== 'all') {
        setFetchSummaryMessage(null); 
    } else {
        setFetchSummaryMessage(null); 
    }
  }, [displayableEmployeeLocations, employeesToFetchLocationsFor, isLoadingLocations, isLoadingEmployees, errorLocations, filter]);


  const activeCount = useMemo(() => {
    return allEmployees.filter(e => e.currentStatus && e.currentStatus.toLowerCase() !== 'offline').length;
  }, [allEmployees]);

  const inactiveCount = useMemo(() => {
    return allEmployees.filter(e => e.currentStatus && e.currentStatus.toLowerCase() === 'offline').length;
  }, [allEmployees]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4"> 
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          <CardTitle className="flex items-center gap-2"><MapPinned className="h-6 w-6 text-primary" />Employee Live Locations</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <RadioGroup 
                value={filter} 
                onValueChange={(value: 'all' | 'active' | 'inactive') => setFilter(value)} 
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
                disabled={isLoadingEmployees || isLoadingLocations}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="r-all" />
                <Label htmlFor="r-all">All ({allEmployees.length})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="r-active" />
                <Label htmlFor="r-active">Active ({activeCount})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="r-inactive" />
                <Label htmlFor="r-inactive">Inactive ({inactiveCount})</Label>
              </div>
            </RadioGroup>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAllLocations} 
                disabled={isLoadingEmployees || isLoadingLocations || employeesToFetchLocationsFor.length === 0}
                className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLocations ? 'animate-spin' : ''}`} />
              {isLoadingLocations ? 'Refreshing...' : 'Refresh Locations'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {fetchSummaryMessage && !isLoadingEmployees && !isLoadingLocations && (
        <Card className="mb-0">
            <CardContent className="p-3 text-sm text-muted-foreground flex items-center">
                <InfoIcon className="h-5 w-5 mr-2 flex-shrink-0 text-primary" />
                {fetchSummaryMessage}
            </CardContent>
        </Card>
      )}

      <div className="flex-grow rounded-lg overflow-hidden shadow-xl border relative">
        { (isLoadingEmployees || (employeesToFetchLocationsFor.length > 0 && isLoadingLocations && displayableEmployeeLocations.length === 0)) && (
             <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center space-y-2 p-4 bg-card rounded-lg shadow-lg">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">{isLoadingEmployees ? "Loading employees..." : "Fetching locations..."}</p>
                </div>
            </div>
        )}
        
        { !isLoadingEmployees && errorEmployees && (
            <div className="h-full flex flex-col items-center justify-center text-destructive p-4">
                <AlertTriangle className="h-12 w-12 mb-2"/>
                <p className="font-semibold text-lg">Error Loading Employees</p>
                <p className="text-sm">{errorEmployees}</p>
            </div>
        )}

        { !isLoadingEmployees && !errorEmployees && employeesToFetchLocationsFor.length === 0 && filter !== 'all' && !fetchSummaryMessage && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <Users className="h-12 w-12 mb-2 opacity-50"/>
                <p className="font-semibold text-lg">No Employees to Display</p>
                <p className="text-sm">There are no employees matching the filter '{filter}'. (Active means current status is not 'Offline'; Inactive means current status is 'Offline'.)</p>
            </div>
        )}
        
        { !isLoadingEmployees && !errorEmployees && allEmployees.length === 0 && !fetchSummaryMessage && (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <Users className="h-12 w-12 mb-2 opacity-50"/>
                <p className="font-semibold text-lg">No Employees Found</p>
                <p className="text-sm">There are no employees in the system to display locations for.</p>
            </div>
        )}

        <MapComponent markers={displayableEmployeeLocations} center={mapCenter} zoom={mapZoom} />

        { errorLocations && !fetchSummaryMessage && ( 
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-destructive/90 text-destructive-foreground p-3 rounded-md shadow-lg text-xs max-w-md text-center">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                {errorLocations}
            </div>
        )}
      </div>
    </div>
  );
}
