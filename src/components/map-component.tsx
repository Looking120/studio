
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
    if (mapboxAccessToken) {
      setCurrentAccessToken(mapboxAccessToken);
    } else if (envAccessToken) {
      setCurrentAccessToken(envAccessToken);
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
          <h3 className="text-xl font-semibold text-destructive mb-2">Mapbox Access Token Missing</h3>
          <p className="text-muted-foreground">
            Please provide a Mapbox Access Token either through the 'mapboxAccessToken' prop or by setting the NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Refer to <code className="bg-card px-1 py-0.5 rounded">.env.local.example</code> for setup or visit Mapbox documentation to get an access token.
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
