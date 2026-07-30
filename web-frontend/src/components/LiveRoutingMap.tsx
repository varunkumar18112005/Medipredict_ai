"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

interface Location {
  lat: number;
  lon: number;
  name: string;
}

interface Center {
  id: string;
  name: string;
  specialization?: string;
  rating?: number;
  distance?: string;
  lat?: number;
  lon?: number;
  address: string;
}

interface LiveRoutingMapProps {
  userLocation?: Location;
  targetCenter?: Center | null;
  centers: Center[];
  onSelectCenter?: (center: Center) => void;
  centerLat?: number;
  centerLon?: number;
  cityName?: string;
  selectedCenter?: Center | null;
}

// Custom Leaflet DivIcon Generators for visual distinction
const createUserIcon = () => {
  return L.divIcon({
    className: "custom-user-marker",
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        background: #1E88E5;
        border: 3px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(30, 136, 229, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 16px;
      ">
        📍
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 2px solid #1E88E5;
          animation: pulseBeacon 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createHospitalIcon = (specialization?: string) => {
  const isClinic = specialization?.toLowerCase().includes("clinic");
  const isDiagnostic = specialization?.toLowerCase().includes("diagnostic");
  
  const bgGradient = isClinic 
    ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" 
    : isDiagnostic 
    ? "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
    : "linear-gradient(135deg, #EF5350 0%, #E11D48 100%)";

  const emoji = isClinic ? "🩺" : isDiagnostic ? "🔬" : "🏥";

  return L.divIcon({
    className: "custom-hospital-marker",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background: ${bgGradient};
        border: 2.5px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 16px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const RoutingControl = ({ source, target }: { source: Location, target: Center | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !source || !target || !target.lat || !target.lon) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(source.lat, source.lon),
        L.latLng(target.lat, target.lon)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      show: true,
      lineOptions: {
        styles: [{ color: "#1E88E5", weight: 6, opacity: 0.9 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      // @ts-ignore
      createMarker: (i: any, wp: any, n: any) => {
        return L.marker(wp.latLng, {
          icon: L.divIcon({ className: 'hidden-icon', html: '', iconSize: [0, 0] })
        });
      }
    } as any).addTo(map);

    return () => {
      if (map && routingControl) {
        try {
          routingControl.setWaypoints([]);
          map.removeControl(routingControl);
        } catch {}
      }
    };
  }, [map, source, target]);

  return null;
};

const MapRecenter = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    if (map && lat && lon) {
      console.log(`[Map Center] Map center updated to: Lat ${lat}, Lon ${lon}`);
      map.setView([lat, lon], 12, { animate: true });
    }
  }, [map, lat, lon]);
  return null;
};

export default function LiveRoutingMap({
  userLocation,
  targetCenter,
  centers,
  onSelectCenter,
  centerLat,
  centerLon,
  cityName,
  selectedCenter
}: LiveRoutingMapProps) {
  const activeUserLoc = userLocation || {
    lat: centerLat || 13.0827,
    lon: centerLon || 80.2707,
    name: cityName || "Live Center"
  };
  const activeTarget = targetCenter || selectedCenter || null;
  const userIcon = createUserIcon();

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseBeacon {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-routing-container {
          background-color: #FFFFFF !important;
          color: #263238 !important;
          border: 1px solid #CBD5E1 !important;
          border-radius: 12px !important;
          max-height: 220px !important;
          overflow-y: auto !important;
          margin-right: 10px !important;
          box-shadow: 0 10px 28px rgba(0,0,0,0.12) !important;
          font-family: inherit !important;
        }
        .leaflet-routing-alt h2, .leaflet-routing-alt h3 {
          color: #1E88E5 !important;
        }
        .leaflet-routing-alt tr:hover {
          background-color: #F8FAFC !important;
        }
      `}} />

      <MapContainer 
        center={[activeUserLoc.lat, activeUserLoc.lon]} 
        zoom={12} 
        style={{ height: "100%", width: "100%", borderRadius: "14px", zIndex: 1 }}
      >
        <MapRecenter lat={activeUserLoc.lat} lon={activeUserLoc.lon} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Live User Location Pin */}
        <Marker position={[activeUserLoc.lat, activeUserLoc.lon]} icon={userIcon}>
          <Popup>
            <div style={{ padding: "4px" }}>
              <span style={{ fontSize: "0.7rem", color: "#1E88E5", fontWeight: 800, textTransform: "uppercase" }}>YOUR LIVE GPS PERIMETER</span>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#263238", marginTop: "2px" }}>📍 {activeUserLoc.name}</strong>
            </div>
          </Popup>
        </Marker>

        {/* Hospital Markers */}
        {activeTarget ? (
          <Marker 
            position={[activeTarget.lat!, activeTarget.lon!]} 
            icon={createHospitalIcon(activeTarget.specialization)}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <span style={{ fontSize: "0.68rem", color: "#EF5350", fontWeight: 800, textTransform: "uppercase" }}>SELECTED ROUTE TARGET</span>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#263238", marginTop: "2px" }}>🏥 {activeTarget.name}</strong>
                <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "4px" }}>{activeTarget.address}</span>
              </div>
            </Popup>
          </Marker>
        ) : (
          centers.map((center) => {
            if (center.lat && center.lon) {
              return (
                <Marker 
                  key={center.id} 
                  position={[center.lat, center.lon]}
                  icon={createHospitalIcon(center.specialization)}
                  eventHandlers={{
                    click: () => onSelectCenter && onSelectCenter(center)
                  }}
                >
                  <Popup>
                    <div style={{ padding: "4px", minWidth: "160px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#1E88E5", fontWeight: 800, textTransform: "uppercase" }}>
                        {center.specialization || "Healthcare Facility"}
                      </span>
                      <strong style={{ display: "block", fontSize: "0.92rem", color: "#263238", marginTop: "2px" }}>
                        {center.name}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "4px" }}>
                        📍 {center.address}
                      </span>
                      {center.distance && (
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1E88E5", marginTop: "6px" }}>
                          Distance: {center.distance}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })
        )}

        {activeTarget && (
          <RoutingControl source={activeUserLoc} target={activeTarget} />
        )}
      </MapContainer>
    </div>
  );
}
