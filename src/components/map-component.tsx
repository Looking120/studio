
"use client";

import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl';
import { Building2 } from 'lucide-react'; // Import Building2 icon

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface MapComponentProps {
  markers: MapMarkerData[];
  center: { lat: number; lng: number };
  zoom?: number;
  mapStyleUrl?: string;
  mapboxAccessToken?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  markers,
  center,
  zoom = 12,
  mapStyleUrl,
  mapboxAccessToken, 
}) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(null);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: zoom,
  });

  useEffect(() => {
    const envAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const userProvidedToken = 'pk.eyJ1Ijoiam4wMDciLCJhIjoiY21haW9yeXFxMGNuODJrcjQzamlyenF6aCJ9.nfHTNAMGgwwbawLTNJrLLg';

    if (mapboxAccessToken) {
      setCurrentAccessToken(mapboxAccessToken);
    } else if (envAccessToken) {
      setCurrentAccessToken(envAccessToken);
    } else {
      setCurrentAccessToken(userProvidedToken);
    }
  }, [mapboxAccessToken]);

  useEffect(() => {
    setViewState(prev => ({
        ...prev,
        longitude: center.lng,
        latitude: center.lat,
        zoom: zoom
    }));
  }, [center, zoom])


  if (!currentAccessToken) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg shadow-md">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold text-destructive mb-2">Mapbox Access Token Configuration Issue</h3>
          <p className="text-muted-foreground">
            A Mapbox Access Token is required but could not be determined.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Please ensure a valid token is provided via the 'mapboxAccessToken' prop, the NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable, or that the fallback token is correctly set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "0.5rem", overflow: "hidden" }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={currentAccessToken}
        mapStyle={mapStyleUrl || "mapbox://styles/mapbox/streets-v12"} 
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
            // The default anchor is 'center'. If your custom icon's visual center is not its actual center, 
            // you might need to adjust anchor or use offset prop on Marker.
            // For a typical bottom-pointed pin, anchor="bottom" is common.
            // For a circular icon like we're making, "center" should be fine.
          >
            {marker.icon ? marker.icon : (
              // Default fallback icon (simple circle)
              <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow" />
            )}
          </Marker>
        ))}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.longitude}
            latitude={selectedMarker.latitude}
            onClose={() => setSelectedMarker(null)}
            closeOnClick={false} // Keep popup open until explicitly closed
            anchor="bottom" // Anchor point of the popup relative to marker coordinates
            // Adjust offset based on your marker icon's size and shape.
            // If icon is a circle centered on coords, offset might be [0, -markerHeight/2]
            // Current circular icon with padding will be ~32px (h-4 icon + p-2). So offset of ~ -16px upwards
            offset={[0, -20]} 
            className="z-10" // Ensure popup is above markers if needed
          >
            <div className="p-2.5 rounded-md shadow-xl bg-popover text-popover-foreground max-w-xs w-auto min-w-[200px]">
              <div className="flex items-center mb-1.5">
                <Building2 className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <h4 className="font-semibold text-sm leading-tight">{selectedMarker.title}</h4>
              </div>
              {selectedMarker.description && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                  {selectedMarker.description}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;

