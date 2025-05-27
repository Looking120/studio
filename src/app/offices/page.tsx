
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import { mockOffices } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';

export default function OfficesPage() {
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Default to US center
  const [mapZoom, setMapZoom] = useState(3);


  const markers: MapMarkerData[] = useMemo(() => mockOffices.map(office => ({
    id: office.id,
    latitude: office.latitude,
    longitude: office.longitude,
    title: office.name,
    description: `${office.address} (Headcount: ${office.headcount})`,
    icon: <Building2 className="text-primary h-8 w-8 cursor-pointer transform hover:scale-110 transition-transform" />
  })), []);

  useEffect(() => {
    if (markers.length > 0) {
      if (markers.length === 1) {
        setMapCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
        setMapZoom(10);
      } else {
         // Calculate the average coordinates to center the map for multiple offices
        const avgLat = markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
        const avgLng = markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
        setMapZoom(3); // Broader view for multiple offices
      }
    }
  }, [markers]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]"> {/* Adjusted height slightly */}
      <div className="lg:w-1/3 space-y-4 overflow-y-auto pr-2"> {/* Added padding for scrollbar */}
        <Card className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
            <CardHeader className="py-4">
                <CardTitle>Our Offices</CardTitle>
            </CardHeader>
        </Card>
        {mockOffices.map(office => (
          <Card key={office.id} className="shadow-md hover:shadow-lg transition-shadow">
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
      <div className="flex-grow lg:w-2/3 rounded-lg overflow-hidden shadow-xl border">
        <MapComponent markers={markers} center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}
