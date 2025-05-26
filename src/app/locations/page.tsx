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

// Helper to generate a slightly different coordinate
const randomizeCoordinates = (lat: number, lng: number) => {
  return {
    lat: lat + (Math.random() - 0.5) * 0.002, // Approx +/- 200m
    lng: lng + (Math.random() - 0.5) * 0.002,
  };
};


export default function LocationsPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees.filter(e => e.latitude && e.longitude));
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isSimulating, setIsSimulating] = useState(true);

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
      }, 5000); // Update every 5 seconds
    }
    return () => clearInterval(intervalId);
  }, [isSimulating]);

  const filteredEmployees = useMemo(() => {
    if (filter === 'all') return employees;
    return employees.filter(emp => emp.status.toLowerCase() === filter);
  }, [employees, filter]);

  const markers: MapMarkerData[] = filteredEmployees.map(employee => ({
    id: employee.id,
    latitude: employee.latitude!,
    longitude: employee.longitude!,
    title: employee.name,
    description: `${employee.jobTitle} - ${employee.status} (Last seen: ${employee.lastSeen || 'N/A'})`,
    icon: (
        <div className="relative">
            <Avatar className="h-8 w-8 border-2 border-background shadow-md">
                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person map" />
                <AvatarFallback>{employee.name.substring(0,1)}</AvatarFallback>
            </Avatar>
            {employee.status === 'Active' && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />}
        </div>
    )
  }));

  const mapCenter = markers.length > 0 
    ? { lat: markers[0].latitude, lng: markers[0].longitude } 
    : { lat: 34.0522, lng: -118.2437 }; // Default to LA if no markers

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4"> {/* Adjust height as needed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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
      <div className="flex-grow rounded-lg overflow-hidden shadow-xl">
        <MapComponent markers={markers} center={mapCenter} zoom={13} />
      </div>
    </div>
  );
}
