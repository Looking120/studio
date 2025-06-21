
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import type { Office as FrontendOfficeType } from '@/lib/data';
import { type AddOfficePayload } from '@/services/organization-service'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, PlusCircle, Edit, Trash2, AlertTriangle, ShieldAlert, Info, Map } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";

const GOMEL_COORDS = { lat: 52.4345, lng: 30.9754 };
const DEFAULT_CITY_ZOOM_OFFICES = 6;
const FOCUSED_OFFICE_ZOOM = 14;


export default function OfficesPage() {
  const [offices, setOffices] = useState<FrontendOfficeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(GOMEL_COORDS); 
  const [mapZoom, setMapZoom] = useState(DEFAULT_CITY_ZOOM_OFFICES);
  const { toast } = useToast();
  const router = useRouter();

  const [showAddOfficeDialog, setShowAddOfficeDialog] = useState(false);
  const [newOfficeData, setNewOfficeData] = useState<Partial<AddOfficePayload>>({
    name: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
    radius: undefined,
    description: "",
  });

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [selectedOfficeIdForHighlight, setSelectedOfficeIdForHighlight] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    setCurrentUserRole(role);
    setCurrentUserEmail(email);
    setIsRoleLoading(false);
  }, []);

  const isAdmin = useMemo(() => {
    if (!isClient || isRoleLoading) return false;
    // HACK: Temporarily treat a specific email as admin.
    // TODO: Remove this hack when backend sends the correct "Admin" role.
    const isSuperAdmin = currentUserEmail === 'joshuandayiadm@gmail.com';
    return isSuperAdmin || (currentUserRole?.toLowerCase().includes('admin') ?? false);
  }, [isClient, isRoleLoading, currentUserRole, currentUserEmail]);


  const loadOffices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[OfficesPage] Attempting to fetch offices from service (requesting page 1, size 50)...");
      const officeDataArray = await fetchOffices(1, 50); // Request up to 50 offices
      console.log("[OfficesPage] Offices fetched:", officeDataArray);
      setOffices(officeDataArray || []); 
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
  }, [toast, router]);

  useEffect(() => {
    if (isClient && !isRoleLoading) { 
        loadOffices();
    }
  }, [isClient, isRoleLoading, loadOffices]); 

  const markers: MapMarkerData[] = useMemo(() => {
    if (!Array.isArray(offices)) return [];
    return offices.map(office => ({
        id: office.id,
        latitude: office.latitude,
        longitude: office.longitude,
        title: office.name,
        description: `${office.address}${office.radius ? ` (Radius: ${office.radius}m)` : ''}${office.description ? ` - ${office.description}` : ''}`,
        icon: (
          <div className="p-2 bg-primary rounded-full shadow-md cursor-pointer transform hover:scale-110 transition-transform">
            <Building2 className="text-primary-foreground h-4 w-4" />
          </div>
        )
    }));
  }, [offices]);

  useEffect(() => {
    if (markers.length > 0 && !selectedOfficeIdForHighlight) {
      if (markers.length === 1) {
        setMapCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
        setMapZoom(10);
      } else {
        const avgLat = markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
        const avgLng = markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
        setMapZoom(3); 
      }
    } else if (!isLoading && offices.length === 0 && !selectedOfficeIdForHighlight) {
        setMapCenter(GOMEL_COORDS);
        setMapZoom(DEFAULT_CITY_ZOOM_OFFICES);
    }
  }, [markers, isLoading, offices, selectedOfficeIdForHighlight]);

  const handleOfficeCardClick = (office: FrontendOfficeType) => {
    setMapCenter({ lat: office.latitude, lng: office.longitude });
    setMapZoom(FOCUSED_OFFICE_ZOOM);
    setSelectedOfficeIdForHighlight(office.id);
  };

  const handleNewOfficeDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOfficeData(prev => ({
        ...prev,
        [name]: name === 'latitude' || name === 'longitude' || name === 'radius' ? parseFloat(value) || undefined : value,
    }));
  };

  const handleSaveNewOffice = async () => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to add offices." });
      return;
    }
    console.log("[OfficesPage] Validating new office data:", newOfficeData);
    if (!newOfficeData.name?.trim() || !newOfficeData.address?.trim() ||
        newOfficeData.latitude === undefined || isNaN(newOfficeData.latitude) ||
        newOfficeData.longitude === undefined || isNaN(newOfficeData.longitude) ||
        newOfficeData.radius === undefined || isNaN(newOfficeData.radius) || newOfficeData.radius <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill all required fields correctly. Name, Address, Latitude, Longitude, and Radius (must be > 0) are required." });
      return;
    }

    const payload: AddOfficePayload = {
        name: newOfficeData.name,
        address: newOfficeData.address,
        latitude: newOfficeData.latitude,
        longitude: newOfficeData.longitude,
        radius: newOfficeData.radius,
        description: newOfficeData.description?.trim() || undefined,
    };

    console.log("[OfficesPage] Attempting to add office with data:", JSON.stringify(payload, null, 2));
    try {
      const addedOffice = await addOffice(payload);
      console.log("[OfficesPage] Office added successfully via service:", addedOffice);
      setOffices(prev => [...prev, addedOffice]); 
      toast({ title: "Office Added", description: `${addedOffice.name} was successfully added.` });
      setShowAddOfficeDialog(false);
      setNewOfficeData({ name: "", address: "", latitude: undefined, longitude: undefined, radius: undefined, description: "" });
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
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to edit offices." });
      return;
    }
    console.log(`[OfficesPage] Placeholder: Open edit office dialog for ${officeId}`);
    alert(`Edit office ${officeId} - functionality to be fully implemented with a form/dialog.`);
  };

  const handleDeleteOffice = async (officeId: string) => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to delete offices." });
      return;
    }
    console.log(`[OfficesPage] Attempting to delete office with ID: ${officeId}`);
    try {
      await deleteOffice(officeId);
      console.log(`[OfficesPage] Office ${officeId} deleted successfully via service.`);
      setOffices(prev => prev.filter(off => off.id !== officeId)); 
      toast({ title: "Office Deleted", description: `Office was successfully deleted.` });
      if (selectedOfficeIdForHighlight === officeId) {
        setSelectedOfficeIdForHighlight(null); // Clear highlight if deleted office was selected
      }
    } catch (err) {
      console.error(`[OfficesPage] Delete office ${officeId} failed:`, err);

      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again."});
        await signOut();
        router.push('/');
        return;
      }
      
      let toastUserMessage = 'Could not delete the office due to an unexpected issue.';
      if (err instanceof HttpError) {
        if (err.status === 500) {
          toastUserMessage = "The server encountered an internal error and could not complete your request. Please try again later.";
        } else if (err.status === 404) {
          toastUserMessage = "The office could not be found. It may have already been deleted.";
        } else {
          toastUserMessage = err.message || `An error occurred (Status: ${err.status}).`;
        }
      } else if (err instanceof Error) {
        toastUserMessage = err.message;
      } else {
        toastUserMessage = String(err) || 'An unknown error prevented office deletion.';
      }

      toast({ 
        variant: "destructive", 
        title: "Failed to delete office", 
        description: toastUserMessage 
      });
    }
  };

  if (isRoleLoading || !isClient) {
    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] p-4">
            <div className="lg:w-1/3 space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
            <div className="flex-grow lg:w-2/3"><Skeleton className="h-full w-full rounded-lg" /></div>
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:w-1/3 space-y-4 overflow-y-auto pr-0 lg:pr-2 pb-4">
        <Card className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
            <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle>Our Offices</CardTitle>
                {isAdmin && (
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
                          Fill in the details for the new office. Fields marked * are required.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-1">
                          <Label htmlFor="name">Office Name *</Label>
                          <Input id="name" name="name" value={newOfficeData.name || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., Downtown Branch" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="address">Address *</Label>
                          <Input id="address" name="address" value={newOfficeData.address || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., 123 Main St, Anytown" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="latitude">Latitude *</Label>
                            <Input id="latitude" name="latitude" type="number" value={newOfficeData.latitude || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., 34.0522" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="longitude">Longitude *</Label>
                            <Input id="longitude" name="longitude" type="number" value={newOfficeData.longitude || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., -118.2437" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="radius">Radius (meters) *</Label>
                          <Input id="radius" name="radius" type="number" value={newOfficeData.radius || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., 100" min="1"/>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" value={newOfficeData.description || ""} onChange={handleNewOfficeDataChange} placeholder="E.g., Regional headquarters..." />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNewOfficeData({name: "", address: "", latitude: undefined, longitude: undefined, radius: undefined, description: ""})}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveNewOffice}>Save Office</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
            </CardHeader>
        </Card>

        {!isAdmin && !isRoleLoading && (
            <Card className="shadow-md">
                 <CardContent className="py-6 flex flex-col items-center text-destructive">
                    <ShieldAlert className="h-12 w-12 mb-4" />
                    <CardTitle className="text-xl mb-2">Access Denied</CardTitle>
                    <CardDescription>You do not have permission to manage offices.</CardDescription>
                </CardContent>
            </Card>
        )}

        {isAdmin && isLoading && Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-office-${index}`} className="shadow-md">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-2 py-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        ))}

        {isAdmin && !isLoading && error && (
          <Card className="shadow-md">
            <CardContent className="py-6 flex flex-col items-center text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <CardTitle className="text-lg mb-1">Error Loading Offices</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardContent>
          </Card>
        )}

        {isAdmin && !isLoading && !error && offices.length === 0 && (
             <Card className="shadow-md">
                <CardContent className="py-6 text-center text-muted-foreground">
                    No offices found. Click "Add Office" to create one.
                </CardContent>
            </Card>
        )}

        {isAdmin && !isLoading && !error && offices.map(office => (
          <Card 
            key={office.id} 
            className={cn(
                "shadow-md hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer",
                selectedOfficeIdForHighlight === office.id && "ring-2 ring-primary shadow-primary/30 scale-[1.01]"
            )}
            onClick={() => handleOfficeCardClick(office)}
            >
            <CardHeader className="pb-2">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> 
                  {office.name}
                </CardTitle>
                {isAdmin && (
                  <div className="flex gap-1 self-end xs:self-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleEditOffice(office.id);}} title="Edit Office">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()} title="Delete Office">
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
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="text-muted-foreground">{office.address}</p>
              {office.radius !== undefined && (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Map className="h-3.5 w-3.5" /> Radius: {office.radius}m
                </div>
              )}
              {office.description && (
                <div className="flex items-start gap-1 text-muted-foreground">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">{office.description}</p>
                </div>
              )}
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
