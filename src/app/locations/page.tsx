
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
import { getCurrentEmployeeLocation, type EmployeeLocation } from '@/services/employee-service'; 
import { fetchEmployees } from '@/services/employee-service';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';
import { useRouter } from 'next/navigation';

const GOMEL_COORDS = { lat: 52.4345, lng: 30.9754 };
const DEFAULT_CITY_ZOOM = 11;

export default function LocationsPage() {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [locationsData, setLocationsData] = useState<Record<string, EmployeeLocation | null>>({}); 
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);
  const [errorLocations, setErrorLocations] = useState<string | null>(null); 

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
            return currentStatusLower && !['offline', 'onleave'].includes(currentStatusLower);
        }
        if (filter === 'inactive') {
             return currentStatusLower === 'offline' || currentStatusLower === 'onleave';
        }
        return false; 
    });
  }, [allEmployees, filter, isLoadingEmployees]);
  
  useEffect(() => {
    const fetchLocationsForList = async () => {
        if (employeesToFetchLocationsFor.length === 0) {
            setLocationsData({}); // Clear locations if list is empty
            return;
        }

        setIsLoadingLocations(true);
        setErrorLocations(null);
        
        const locationPromises = employeesToFetchLocationsFor.map(emp => {
            if (!emp.id) {
                console.warn("[LocationsPage] Employee found in filter list with no ID:", emp);
                return Promise.resolve({ id: null, loc: null });
            }
            return getCurrentEmployeeLocation(emp.id)
                .then(loc => ({ id: emp.id, loc }))
                .catch(error => {
                    console.error(`[LocationsPage] Failed to fetch location for employee ${emp.name || 'Unknown'} (ID: ${emp.id}):`, error);
                    // Handle specific errors if needed, for now just fail silently for this employee
                    return { id: emp.id, loc: null };
                });
        });

        const results = await Promise.all(locationPromises);
        
        const newLocations: Record<string, EmployeeLocation | null> = {};
        results.forEach(result => {
            if (result.id) {
                newLocations[result.id] = result.loc;
            }
        });
        
        setLocationsData(newLocations);
        setIsLoadingLocations(false);
    };

    fetchLocationsForList();
}, [employeesToFetchLocationsFor]);


  const displayableEmployeeLocations: MapMarkerData[] = useMemo(() => {
    const validLocations: { emp: Employee; loc: EmployeeLocation }[] = employeesToFetchLocationsFor
      .map(emp => {
        const locationInfo = emp.id ? locationsData[emp.id] : null;
        if (emp && locationInfo && typeof locationInfo.latitude === 'number' && typeof locationInfo.longitude === 'number') {
          return { emp, loc: locationInfo };
        }
        return null;
      })
      .filter((item): item is { emp: Employee; loc: EmployeeLocation } => !!item);

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const nameParts = name.split(' ').filter(part => part.length > 0);
        if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
        return nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };
    
    const coordinateGroups = new Map<string, { emp: Employee; loc: EmployeeLocation }[]>();

    validLocations.forEach(item => {
      const key = `${item.loc.latitude.toFixed(5)}_${item.loc.longitude.toFixed(5)}`;
      if (!coordinateGroups.has(key)) {
        coordinateGroups.set(key, []);
      }
      coordinateGroups.get(key)!.push(item);
    });

    const markers: MapMarkerData[] = [];
    coordinateGroups.forEach((group) => {
      const groupSize = group.length;
      group.forEach(({ emp, loc }, index) => {
        let displayLatitude = loc.latitude;
        let displayLongitude = loc.longitude;

        if (groupSize > 1) {
          const angle = (index / groupSize) * 2 * Math.PI;
          const offset = 0.0001 * Math.sqrt(groupSize); // Increase offset slightly for larger groups
          displayLatitude += offset * Math.cos(angle);
          displayLongitude += offset * Math.sin(angle);
        }
        
        const empName = emp.name || 'Unknown Employee';
        const empJobTitle = emp.jobTitle || 'N/A';
        const empActivityStatus = emp.currentStatus || 'N/A';
        const locationType = loc.locationType || 'Unknown location type';
        const lastSeen = loc.timestamp ? new Date(loc.timestamp).toLocaleString() : 'Timestamp N/A';

        markers.push({
            id: emp.id!,
            latitude: displayLatitude,
            longitude: displayLongitude,
            title: empName,
            description: `${empJobTitle} - Status: ${empActivityStatus}. At: ${locationType}. Last seen: ${lastSeen}`,
            icon: (
              <div className="relative cursor-pointer transform hover:scale-110 transition-transform">
                <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                  <AvatarImage src={emp.avatarUrl} alt={empName} data-ai-hint="person map" />
                  <AvatarFallback>{getInitials(empName)}</AvatarFallback>
                </Avatar>
                {emp.currentStatus && !['offline', 'onleave'].includes(emp.currentStatus.toLowerCase()) && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                )}
              </div>
            )
        });
      });
    });

    return markers;

  }, [employeesToFetchLocationsFor, locationsData]);

  useEffect(() => {
    if (displayableEmployeeLocations.length > 0) {
      const avgLat = displayableEmployeeLocations.reduce((sum, m) => sum + m.latitude, 0) / displayableEmployeeLocations.length;
      const avgLng = displayableEmployeeLocations.reduce((sum, m) => sum + m.longitude, 0) / displayableEmployeeLocations.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(displayableEmployeeLocations.length === 1 ? 13 : 3); 
    } else if (!isLoadingEmployees && !isLoadingLocations) {
      setMapCenter(GOMEL_COORDS); 
      setMapZoom(DEFAULT_CITY_ZOOM); 
    }
  }, [displayableEmployeeLocations, isLoadingEmployees, isLoadingLocations]);

  useEffect(() => {
    if (!isLoadingLocations && !isLoadingEmployees && employeesToFetchLocationsFor.length > 0) {
        const displayedCount = displayableEmployeeLocations.length;
        const totalInFilter = employeesToFetchLocationsFor.length;
        
        if (displayedCount < totalInFilter) {
             setFetchSummaryMessage(`${totalInFilter - displayedCount} of ${totalInFilter} employees in the current filter could not be displayed due to missing or invalid location data.`);
        } else {
            setFetchSummaryMessage(`${displayedCount} of ${totalInFilter} employees in filter displayed.`);
        }
    } else {
        setFetchSummaryMessage(null); 
    }
  }, [displayableEmployeeLocations, employeesToFetchLocationsFor, isLoadingLocations, isLoadingEmployees, filter]);


  const activeCount = useMemo(() => {
    return allEmployees.filter(e => e.currentStatus && !['offline', 'onleave'].includes(e.currentStatus.toLowerCase())).length;
  }, [allEmployees]);

  const inactiveCount = useMemo(() => {
    return allEmployees.filter(e => e.currentStatus && ['offline', 'onleave'].includes(e.currentStatus.toLowerCase())).length;
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
                onClick={loadAllEmployees} 
                disabled={isLoadingEmployees || isLoadingLocations}
                className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingEmployees || isLoadingLocations ? 'animate-spin' : ''}`} />
              {isLoadingEmployees || isLoadingLocations ? 'Refreshing...' : 'Refresh Data'}
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
        { (isLoadingEmployees || isLoadingLocations) && (
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

        { !isLoadingEmployees && !errorEmployees && employeesToFetchLocationsFor.length === 0 && filter !== 'all' && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <Users className="h-12 w-12 mb-2 opacity-50"/>
                <p className="font-semibold text-lg">No Employees to Display</p>
                <p className="text-sm">There are no employees matching the filter '{filter}'.</p>
            </div>
        )}
        
        { !isLoadingEmployees && !errorEmployees && allEmployees.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <Users className="h-12 w-12 mb-2 opacity-50"/>
                <p className="font-semibold text-lg">No Employees Found</p>
                <p className="text-sm">There are no employees in the system to display locations for.</p>
            </div>
        )}

        <MapComponent markers={displayableEmployeeLocations} center={mapCenter} zoom={mapZoom} />

        { errorLocations && ( 
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-destructive/90 text-destructive-foreground p-3 rounded-md shadow-lg text-xs max-w-md text-center">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                {errorLocations}
            </div>
        )}
      </div>
    </div>
  );
}
