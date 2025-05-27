
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import { mockOffices, Office } from '@/lib/data'; // Keep Office type
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { fetchOffices, addOffice, updateOffice, deleteOffice } from '@/services/organization-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
// TODO: Create a Dialog component for Add/Edit Office

export default function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Default to US center
  const [mapZoom, setMapZoom] = useState(3);
  const { toast } = useToast();

  useEffect(() => {
    const loadOffices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Attempting to fetch offices from service...");
        const data = await fetchOffices();
        console.log("Offices fetched:", data);
        // If API returns empty or placeholder, use mock data for now.
        // Remove this fallback once API is live.
        setOffices(data && data.length > 0 ? data : mockOffices); 
      } catch (err) {
        console.error("Failed to fetch offices:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setOffices(mockOffices); // Fallback to mock data on error for UI stability
        toast({
          variant: "destructive",
          title: "Failed to load offices",
          description: "Displaying mock data. " + (err instanceof Error ? err.message : ''),
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadOffices();
  }, [toast]);

  const markers: MapMarkerData[] = useMemo(() => offices.map(office => ({
    id: office.id,
    latitude: office.latitude,
    longitude: office.longitude,
    title: office.name,
    description: `${office.address} (Headcount: ${office.headcount})`,
    icon: <Building2 className="text-primary h-8 w-8 cursor-pointer transform hover:scale-110 transition-transform" />
  })), [offices]);

  useEffect(() => {
    if (markers.length > 0) {
      if (markers.length === 1) {
        setMapCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
        setMapZoom(10);
      } else {
        const avgLat = markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
        const avgLng = markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
        setMapZoom(3);
      }
    } else if (!isLoading) { // Only default if not loading and no markers
        setMapCenter({ lat: 39.8283, lng: -98.5795 }); // Default US center
        setMapZoom(3);
    }
  }, [markers, isLoading]);

  const handleAddOffice = async () => {
    // Placeholder: Open a dialog to get office details
    console.log("Placeholder: Open add office dialog");
    // const newOfficeData = { name: "New Office", address: "123 New St", latitude: 40, longitude: -70, headcount: 10 };
    // try {
    //   const addedOffice = await addOffice(newOfficeData);
    //   setOffices(prev => [...prev, addedOffice]);
    //   toast({ title: "Office Added", description: `${addedOffice.name} was successfully added.` });
    // } catch (err) {
    //   toast({ variant: "destructive", title: "Failed to add office", description: err.message });
    // }
    alert("Add office functionality not fully implemented. This would open a form.");
  };

  const handleEditOffice = (officeId: string) => {
    console.log(`Placeholder: Open edit office dialog for ${officeId}`);
    alert(`Edit office ${officeId} - functionality not fully implemented.`);
    // Similar to add, but would call updateOffice(officeId, updatedData)
  };

  const handleDeleteOffice = async (officeId: string, officeName: string) => {
    if (confirm(`Are you sure you want to delete ${officeName}?`)) {
      console.log(`Attempting to delete office: ${officeId}`);
      // try {
      //   await deleteOffice(officeId);
      //   setOffices(prev => prev.filter(off => off.id !== officeId));
      //   toast({ title: "Office Deleted", description: `${officeName} was successfully deleted.` });
      // } catch (err) {
      //   toast({ variant: "destructive", title: "Failed to delete office", description: err.message });
      // }
      alert(`Delete office ${officeId} - functionality not fully implemented.`);
    }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:w-1/3 space-y-4 overflow-y-auto pr-2 pb-4"> {/* Added pb-4 for scroll room */}
        <Card className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
                <CardTitle>Our Offices</CardTitle>
                <Button size="sm" onClick={handleAddOffice} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Office
                </Button>
            </CardHeader>
        </Card>

        {isLoading && Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-office-${index}`} className="shadow-md">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        ))}

        {!isLoading && error && (
          <Card className="shadow-md">
            <CardContent className="py-6 flex flex-col items-center text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <CardTitle className="text-lg mb-1">Error Loading Offices</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && offices.length === 0 && (
             <Card className="shadow-md">
                <CardContent className="py-6 text-center text-muted-foreground">
                    No offices found.
                </CardContent>
            </Card>
        )}

        {!isLoading && !error && offices.map(office => (
          <Card key={office.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> 
                  {office.name}
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditOffice(office.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteOffice(office.id, office.name)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{office.address}</p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{office.headcount} Employees</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex-grow lg:w-2/3 rounded-lg overflow-hidden shadow-xl border">
        <MapComponent markers={markers} center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}
