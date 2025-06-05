
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import type { Office, AddOfficePayload } from '@/services/organization-service'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Users, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { fetchOffices, addOffice, updateOffice, deleteOffice } from '@/services/organization-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); 
  const [mapZoom, setMapZoom] = useState(3);
  const { toast } = useToast();
  const router = useRouter();

  const [showAddOfficeDialog, setShowAddOfficeDialog] = useState(false);
  const [newOfficeData, setNewOfficeData] = useState<Partial<AddOfficePayload>>({
    name: "",
    address: "",
    latitude: undefined, // Use undefined for easier check
    longitude: undefined,
    headcount: undefined,
  });

  const loadOffices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[OfficesPage] Attempting to fetch offices from service...");
      const paginatedData = await fetchOffices();
      console.log("[OfficesPage] Offices fetched:", paginatedData);
      setOffices(paginatedData.items || []); 
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
        console.error("[OfficesPage] Failed to fetch offices:", err);
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

  useEffect(() => {
    loadOffices();
  }, []); 

  const markers: MapMarkerData[] = useMemo(() => {
    if (!Array.isArray(offices)) return [];
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
    } else if (!isLoading && offices.length === 0) {
        setMapCenter({ lat: 39.8283, lng: -98.5795 });
        setMapZoom(3);
    }
  }, [markers, isLoading, offices]);

  const handleNewOfficeDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOfficeData(prev => ({
        ...prev,
        [name]: name === 'latitude' || name === 'longitude' || name === 'headcount' ? parseFloat(value) || undefined : value,
    }));
  };

  const handleSaveNewOffice = async () => {
    console.log("[OfficesPage] Validating new office data:", newOfficeData);
    if (!newOfficeData.name?.trim() || !newOfficeData.address?.trim() ||
        newOfficeData.latitude === undefined || isNaN(newOfficeData.latitude) ||
        newOfficeData.longitude === undefined || isNaN(newOfficeData.longitude) ||
        newOfficeData.headcount === undefined || isNaN(newOfficeData.headcount) || newOfficeData.headcount <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill all fields correctly. Latitude, Longitude, and Headcount must be valid numbers (Headcount > 0)." });
      return;
    }

    const payload: AddOfficePayload = {
        name: newOfficeData.name,
        address: newOfficeData.address,
        latitude: newOfficeData.latitude,
        longitude: newOfficeData.longitude,
        headcount: newOfficeData.headcount,
    };

    console.log("[OfficesPage] Attempting to add office with data:", JSON.stringify(payload, null, 2));
    try {
      const addedOffice = await addOffice(payload);
      console.log("[OfficesPage] Office added successfully via service:", addedOffice);
      setOffices(prev => [...prev, addedOffice]); 
      toast({ title: "Office Added", description: `${addedOffice.name} was successfully added.` });
      setShowAddOfficeDialog(false);
      setNewOfficeData({ name: "", address: "", latitude: undefined, longitude: undefined, headcount: undefined }); // Reset form
    } catch (err) {
      console.error("[OfficesPage] Add office failed:", err);
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again."});
        await signOut();
        router.push('/');
        return;
      }
      let errorMessage = 'Could not add office.';
      if (err instanceof HttpError) {
        errorMessage = `API Error (${err.status}): ${err.message}.`;
        if (err.responseData) {
          console.error("[OfficesPage] Add office API error response data:", err.responseData);
          // Try to parse and display specific validation errors if backend provides them
          if (typeof err.responseData.errors === 'object') {
            const validationErrors = Object.entries(err.responseData.errors)
              .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
              .join('; ');
            errorMessage += ` Details: ${validationErrors}`;
          } else {
            errorMessage += ` Details: ${JSON.stringify(err.responseData)}`;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({ variant: "destructive", title: "Failed to add office", description: errorMessage, duration: 7000 });
    }
  };

  const handleEditOffice = async (officeId: string) => {
    console.log(`[OfficesPage] Placeholder: Open edit office dialog for ${officeId}`);
    alert(`Edit office ${officeId} - functionality to be fully implemented with a form/dialog.`);
  };

  const handleDeleteOffice = async (officeId: string) => {
      console.log(`[OfficesPage] Attempting to delete office with ID: ${officeId}`);
      try {
        await deleteOffice(officeId);
        console.log(`[OfficesPage] Office ${officeId} deleted successfully via service.`);
        setOffices(prev => prev.filter(off => off.id !== officeId)); 
        toast({ title: "Office Deleted", description: `Office was successfully deleted.` });
      } catch (err) {
        console.error(`[OfficesPage] Delete office ${officeId} failed:`, err);
        if (err instanceof UnauthorizedError) {
          toast({ variant: "destructive", title: "Session Expired", description: "Please log in again."});
          await signOut();
          router.push('/');
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Could not delete office.';
        toast({ variant: "destructive", title: "Failed to delete office", description: errorMessage });
      }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:w-1/3 space-y-4 overflow-y-auto pr-0 lg:pr-2 pb-4">
        <Card className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
            <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle>Our Offices</CardTitle>
                <AlertDialog open={showAddOfficeDialog} onOpenChange={setShowAddOfficeDialog}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" onClick={() => setShowAddOfficeDialog(true)} disabled={isLoading} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Office
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Add New Office</AlertDialogTitle>
                      <AlertDialogDescription>
                        Fill in the details for the new office. All fields are required.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-1">
                        <Label htmlFor="name">Office Name</Label>
                        <Input id="name" name="name" value={newOfficeData.name || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., Downtown Branch" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" value={newOfficeData.address || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., 123 Main St, Anytown" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input id="latitude" name="latitude" type="number" value={newOfficeData.latitude || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., 34.0522" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input id="longitude" name="longitude" type="number" value={newOfficeData.longitude || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., -118.2437" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="headcount">Headcount</Label>
                        <Input id="headcount" name="headcount" type="number" value={newOfficeData.headcount || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., 50" min="1"/>
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setNewOfficeData({})}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSaveNewOffice}>Save Office</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                    No offices found. Click "Add Office" to create one.
                </CardContent>
            </Card>
        )}

        {!isLoading && !error && offices.map(office => (
          <Card key={office.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> 
                  {office.name}
                </CardTitle>
                <div className="flex gap-1 self-end xs:self-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditOffice(office.id)} title="Edit Office">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete Office">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the office "{office.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteOffice(office.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

    