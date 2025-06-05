
"use client";

import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl';

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
    // Token provided by the user
    const userProvidedToken = 'pk.eyJ1Ijoiam4wMDciLCJhIjoiY21haW9yeXFxMGNuODJrcjQzamlyenF6aCJ9.nfHTNAMGgwwbawLTNJrLLg';

    if (mapboxAccessToken) { // Prop takes precedence
      setCurrentAccessToken(mapboxAccessToken);
    } else if (envAccessToken) { // Then env var
      setCurrentAccessToken(envAccessToken);
    } else { // Fallback to the user-provided token
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
    // This block should ideally not be reached if userProvidedToken is valid
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
          >
            {marker.icon ? marker.icon : <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-md" />}
          </Marker>
        ))}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.longitude}
            latitude={selectedMarker.latitude}
            onClose={() => setSelectedMarker(null)}
            closeOnClick={false}
            anchor="bottom"
            offset={selectedMarker.icon ? 30 : 15} 
          >
            <div className="p-1 max-w-xs">
              <h4 className="font-semibold text-sm text-popover-foreground">{selectedMarker.title}</h4>
              {selectedMarker.description && (
                <p className="text-xs text-muted-foreground">{selectedMarker.description}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;
