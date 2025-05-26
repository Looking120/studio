"use client";

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import React, { useState, useEffect } from 'react';

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  icon?: React.ReactNode; // Optional custom icon
}

interface MapComponentProps {
  markers: MapMarkerData[];
  center: { lat: number; lng: number };
  zoom?: number;
  mapId?: string; // For different map styles if needed
  apiKey?: string; // Allow passing API key as prop
}

const MapComponent: React.FC<MapComponentProps> = ({ markers, center, zoom = 12, mapId, apiKey }) => {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Try to get API key from prop, then environment variable
    const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      setCurrentApiKey(apiKey);
    } else if (envApiKey) {
      setCurrentApiKey(envApiKey);
    }
  }, [apiKey]);

  if (!currentApiKey) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg shadow-md">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold text-destructive mb-2">Google Maps API Key Missing</h3>
          <p className="text-muted-foreground">
            Please provide a Google Maps API key either through the 'apiKey' prop or by setting the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Refer to <code className="bg-card px-1 py-0.5 rounded">.env.local.example</code> for setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={currentApiKey}>
      <div style={{ height: "100%", width: "100%", borderRadius: "0.5rem", overflow: "hidden" }}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId={mapId || 'employtrack-map'} // Default map ID
          className="rounded-lg shadow-md"
        >
          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.latitude, lng: marker.longitude }}
              onClick={() => setSelectedMarkerId(marker.id)}
            >
              {marker.icon ? marker.icon : <Pin /* Optional: Add custom Pin props for color, etc. */ />}
            </AdvancedMarker>
          ))}

          {selectedMarkerId && markers.find(m => m.id === selectedMarkerId) && (
            <InfoWindow
              position={{ 
                lat: markers.find(m => m.id === selectedMarkerId)!.latitude, 
                lng: markers.find(m => m.id === selectedMarkerId)!.longitude 
              }}
              onCloseClick={() => setSelectedMarkerId(null)}
              pixelOffset={[0,-30]}
            >
              <div className="p-2">
                <h4 className="font-semibold text-sm text-popover-foreground">{markers.find(m => m.id === selectedMarkerId)!.title}</h4>
                {markers.find(m => m.id === selectedMarkerId)!.description && (
                  <p className="text-xs text-muted-foreground">{markers.find(m => m.id === selectedMarkerId)!.description}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
};

export default MapComponent;
