
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MapComponent, { MapMarkerData } from '@/components/map-component';
import { mockEmployees, Employee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const randomizeCoordinates = (lat: number, lng: number) => {
  return {
    lat: lat + (Math.random() - 0.5) * 0.002, 
    lng: lng + (Math.random() - 0.5) * 0.002,
  };
};


export default function LocationsPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees.filter(e => e.latitude && e.longitude));
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isSimulating, setIsSimulating] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 34.0522, lng: -118.2437 }); 
  const [mapZoom, setMapZoom] = useState(12);


  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSimulating) {
      intervalId = setInterval(() => {
        setEmployees(prevEmployees =>
          prevEmployees.map(emp => {
            if (emp.status === 'Active' && emp.latitude && emp.longitude) {
              const { lat, lng } = randomizeCoordinates(emp.latitude, emp.longitude);
              return { ...emp, latitude: lat, longitude: lng, lastSeen: `${Math.floor(Math.random()*59) + 1}s ago` };
            }
            return emp;
          })
        );
      }, 5000); 
    }
    return () => clearInterval(intervalId);
  }, [isSimulating]);

  const filteredEmployees = useMemo(() => {
    if (filter === 'all') return employees;
    return employees.filter(emp => emp.status.toLowerCase() === filter);
  }, [employees, filter]);

  const markers: MapMarkerData[] = useMemo(() => filteredEmployees.map(employee => ({
    id: employee.id,
    latitude: employee.latitude!,
    longitude: employee.longitude!,
    title: employee.name,
    description: `${employee.jobTitle} - ${employee.status} (Last seen: ${employee.lastSeen || 'N/A'})`,
    icon: (
        <div className="relative cursor-pointer transform hover:scale-110 transition-transform">
            <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person map" />
                <AvatarFallback>{employee.name.substring(0,1)}</AvatarFallback>
            </Avatar>
            {employee.status === 'Active' && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />}
        </div>
    )
  })), [filteredEmployees]);

  useEffect(() => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(markers.length === 1 ? 13 : 11); 
    } else {
      setMapCenter({ lat: 34.0522, lng: -118.2437 }); 
      setMapZoom(12);
    }
  }, [markers]);


  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4"> 
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle>Employee Live Locations</CardTitle>
          <div className="flex items-center gap-4">
            <RadioGroup defaultValue="active" onValueChange={(value: 'all' | 'active' | 'inactive') => setFilter(value)} className="flex items-center">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="r-all" />
                <Label htmlFor="r-all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="r-active" />
                <Label htmlFor="r-active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="r-inactive" />
                <Label htmlFor="r-inactive">Inactive</Label>
              </div>
            </RadioGroup>
            <Button variant="outline" size="sm" onClick={() => setIsSimulating(!isSimulating)}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </Button>
          </div>
        </CardHeader>
      </Card>
      <div className="flex-grow rounded-lg overflow-hidden shadow-xl border">
        <MapComponent markers={markers} center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}
