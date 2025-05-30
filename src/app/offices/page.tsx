
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import type { Office } from '@/lib/data'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { fetchOffices, addOffice, updateOffice, deleteOffice } from '@/services/organization-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';

export default function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); 
  const [mapZoom, setMapZoom] = useState(3);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadOffices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Attempting to fetch offices from service...");
        const data = await fetchOffices();
        console.log("Offices fetched:", data);
        setOffices(data || []); 
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
          });
          await signOut();
          router.push('/');
        } else {
          console.error("Failed to fetch offices:", err);
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching offices.';
          setError(errorMessage);
          setOffices([]); 
          toast({
            variant: "destructive",
            title: "Failed to load offices",
            description: errorMessage,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadOffices();
  }, [toast, router]);

  const markers: MapMarkerData[] = useMemo(() => {
    if (!offices) return [];
    return offices.map(office => ({
        id: office.id,
        latitude: office.latitude,
        longitude: office.longitude,
        title: office.name,
        description: `${office.address} (Headcount: ${office.headcount})`,
        icon: <Building2 className="text-primary h-8 w-8 cursor-pointer transform hover:scale-110 transition-transform" />
    }));
  }, [offices]);

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
    } else if (!isLoading) {
        setMapCenter({ lat: 39.8283, lng: -98.5795 });
        setMapZoom(3);
    }
  }, [markers, isLoading]);

  const handleAddOffice = async () => {
    const newOfficeData: Omit<Office, 'id'> = { 
        name: "New Branch " + Math.floor(Math.random() * 100), 
        address: "123 Placeholder St, City, ST", 
        latitude: 40.7128 + (Math.random() - 0.5) * 5, 
        longitude: -74.0060 + (Math.random() - 0.5) * 5, 
        headcount: Math.floor(Math.random() * 50) + 10 
    };
    try {
      const addedOffice = await addOffice(newOfficeData);
      setOffices(prev => [...prev, addedOffice]);
      toast({ title: "Office Added", description: `${addedOffice.name} was successfully added.` });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again."});
        await signOut();
        router.push('/');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Could not add office.';
      toast({ variant: "destructive", title: "Failed to add office", description: errorMessage });
      console.error("Add office failed:", err);
    }
  };

  const handleEditOffice = async (officeId: string) => {
    console.log(`Placeholder: Open edit office dialog for ${officeId}`);
    alert(`Edit office ${officeId} - functionality to be fully implemented with a form/dialog.`);
    // Example of API call if you had a form:
    // try {
    //   const updatedData = { name: "Updated Name" }; // Get from form
    //   const updated = await updateOffice(officeId, updatedData);
    //   setOffices(prev => prev.map(o => o.id === officeId ? updated : o));
    //   toast({ title: "Office Updated" });
    // } catch (err) {
    //   if (err instanceof UnauthorizedError) { /* ... */ }
    //   // ... error handling ...
    // }
  };

  const handleDeleteOffice = async (officeId: string, officeName: string) => {
    if (confirm(`Are you sure you want to delete ${officeName}?`)) {
      try {
        await deleteOffice(officeId);
        setOffices(prev => prev.filter(off => off.id !== officeId));
        toast({ title: "Office Deleted", description: `${officeName} was successfully deleted.` });
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast({ variant: "destructive", title: "Session Expired", description: "Please log in again."});
          await signOut();
          router.push('/');
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Could not delete office.';
        toast({ variant: "destructive", title: "Failed to delete office", description: errorMessage });
        console.error("Delete office failed:", err);
      }
    }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:w-1/3 space-y-4 overflow-y-auto pr-2 pb-4">
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

        {!isLoading && error && ! (error.includes("Unauthorized")) && (
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
                    No offices found. Click "Add Office" to create one.
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditOffice(office.id)} disabled={!office.id}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteOffice(office.id, office.name)} disabled={!office.id}>
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
