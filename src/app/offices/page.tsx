"use client";

import React from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import { mockOffices } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';

export default function OfficesPage() {
  const markers: MapMarkerData[] = mockOffices.map(office => ({
    id: office.id,
    latitude: office.latitude,
    longitude: office.longitude,
    title: office.name,
    description: `${office.address} (Headcount: ${office.headcount})`,
    icon: <Building2 className="text-primary h-6 w-6" />
  }));

  const mapCenter = markers.length > 0 
    ? { lat: markers[0].latitude, lng: markers[0].longitude } 
    : { lat: 39.8283, lng: -98.5795 }; // Default to US center if no offices

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-10rem)]">
      <div className="lg:w-1/3 space-y-4 overflow-y-auto">
        <Card>
            <CardHeader>
                <CardTitle>Our Offices</CardTitle>
            </CardHeader>
        </Card>
        {mockOffices.map(office => (
          <Card key={office.id} className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> 
                {office.name}
              </CardTitle>
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
      <div className="flex-grow lg:w-2/3 rounded-lg overflow-hidden shadow-xl">
        <MapComponent markers={markers} center={mapCenter} zoom={markers.length > 1 ? 4 : 10} />
      </div>
    </div>
  );
}
