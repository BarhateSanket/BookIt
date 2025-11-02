import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Experience {
  _id: string;
  title: string;
  price: number;
  latitude?: number;
  longitude?: number;
  images: string[];
}

interface MapViewProps {
  experiences: Experience[];
  onLocationSelect?: (lat: number, lng: number, radius: number) => void;
  selectedLocation?: { lat: number; lng: number; radius: number };
}

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ experiences, onLocationSelect, selectedLocation }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC

  useEffect(() => {
    if (experiences.length > 0) {
      const avgLat = experiences.reduce((sum, exp) => sum + (exp.latitude || 0), 0) / experiences.length;
      const avgLng = experiences.reduce((sum, exp) => sum + (exp.longitude || 0), 0) / experiences.length;
      if (avgLat && avgLng) {
        setMapCenter([avgLat, avgLng]);
      }
    }
  }, [experiences]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onLocationSelect) {
      const radius = selectedLocation?.radius || 10;
      onLocationSelect(e.latlng.lat, e.latlng.lng, radius);
    }
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => {
          // Map is ready, no additional setup needed here
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapController center={mapCenter} />

        {/* Experience markers */}
        {experiences
          .filter(exp => exp.latitude && exp.longitude)
          .map((exp) => (
            <Marker key={exp._id} position={[exp.latitude, exp.longitude]}>
              <Popup>
                <div className="text-center">
                  <img
                    src={exp.images?.[0] || 'https://via.placeholder.com/100x60'}
                    alt={exp.title}
                    className="w-full h-16 object-cover rounded mb-2"
                  />
                  <h3 className="font-semibold text-sm">{exp.title}</h3>
                  <p className="text-sm text-gray-600">₹{exp.price}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>
              <div className="text-center">
                <p className="text-sm font-semibold">Search Location</p>
                <p className="text-xs text-gray-600">
                  Radius: {selectedLocation.radius || 10}km
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
