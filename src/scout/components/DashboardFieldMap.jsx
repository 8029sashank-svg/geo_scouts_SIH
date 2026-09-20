/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import { MISSION_STATUS, NEARBY_CASES } from '../mockData.js';

const RISK_COLOR = { HIGH: '#e65100', MEDIUM: '#f9a825', LOW: '#2e7d32' };
const ASSIGNED_COLOR = '#0284c7';

const CASE_COORDS = {
  'GF-1042': [20.0571, 73.834],
  'GF-1038': [20.0844, 74.111],
  'GF-RHR-201': [19.38, 74.65],
};

const DEMO_LOCATION = [20.03, 73.79];

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 11);
  }, [center, map]);
  return null;
}

export default function DashboardFieldMap({ missions, onOpenCase, onOpenAssignment, onOpenFullMap }) {
  const [userPos, setUserPos] = useState(null); // {lat, lng, accuracy, isReal}
  const [mapCenter, setMapCenter] = useState(null);

  const assigned = useMemo(() => missions.filter((m) => m.status === MISSION_STATUS.ACCEPTED || m.status === MISSION_STATUS.EN_ROUTE || m.status === MISSION_STATUS.IN_PROGRESS), [missions]);
  const nearbyCount = NEARBY_CASES.length;
  const assignedCount = assigned.length;

  // Try to get real location once (not continuous)
  const locate = () => {
    if (!('geolocation' in navigator)) {
      setUserPos({ lat: DEMO_LOCATION[0], lng: DEMO_LOCATION[1], accuracy: null, isReal: false });
      setMapCenter(DEMO_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude, accuracy, isReal: true });
        setMapCenter([latitude, longitude]);
      },
      () => {
        setUserPos({ lat: DEMO_LOCATION[0], lng: DEMO_LOCATION[1], accuracy: null, isReal: false });
        setMapCenter(DEMO_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Auto-center: try user location, fallback to cases
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, isReal: true });
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // fallback to assigned or nearby
          if (assigned.length) setMapCenter(assigned[0].coords);
          else setMapCenter(CASE_COORDS['GF-1042']);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
      );
    } else if (assigned.length) setMapCenter(assigned[0].coords);
    else setMapCenter(CASE_COORDS['GF-1042']);
  }, []);

  const resetView = () => {
    if (userPos) setMapCenter([userPos.lat, userPos.lng]);
    else if (assigned.length) setMapCenter(assigned[0].coords);
    else setMapCenter(CASE_COORDS['GF-1042']);
  };

  const initialCenter = mapCenter || CASE_COORDS['GF-1042'];

  return (
    <div className="space-y-2">
      <div className="h-[280px] sm:h-[320px] rounded-xl overflow-hidden border border-[#e4eae4] relative">
        <MapContainer center={initialCenter} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={true} dragging={true} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController center={mapCenter} />

          {/* User location */}
          {userPos && (
            <>
              {userPos.accuracy && <Circle center={[userPos.lat, userPos.lng]} radius={userPos.accuracy} pathOptions={{ color: '#0C3B2E', fillColor: '#0C3B2E', fillOpacity: 0.12, weight: 1 }} />}
              <CircleMarker center={[userPos.lat, userPos.lng]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0C3B2E', fillOpacity: 1 }}>
                <Popup>
                  <div className="text-xs min-w-[160px]">
                    <p className="font-bold text-gray-900">Your Location</p>
                    <p className="text-gray-600">{userPos.isReal ? 'Nashik, Maharashtra' : 'Demo location'}</p>
                    {userPos.accuracy && <p className="text-gray-500">GPS accuracy: ±{Math.round(userPos.accuracy)} m</p>}
                    {!userPos.isReal && <p className="text-amber-700 text-[11px]">Demo location</p>}
                  </div>
                </Popup>
              </CircleMarker>
            </>
          )}

          {/* Case markers */}
          {NEARBY_CASES.map((c) => {
            const coords = CASE_COORDS[c.id] || [20.0, 74.0];
            const color = RISK_COLOR[c.priority === 'HIGH' ? 'HIGH' : c.priority === 'MEDIUM' ? 'MEDIUM' : 'LOW'];
            return (
              <CircleMarker key={c.id} center={coords} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }}>
                <Popup>
                  <div className="text-xs min-w-[180px]">
                    <p className="font-bold text-gray-900 uppercase text-[11px]">{c.issue}</p>
                    <p className="text-gray-600">{c.crop} • {c.village}</p>
                    <p className="mt-1"><span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${c.priority === 'HIGH' ? 'bg-red-100 text-red-700' : c.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{c.priority} RISK</span> <span className="text-gray-500">· {c.distanceKm} km away</span></p>
                    <button onClick={() => onOpenCase && onOpenCase(c)} className="mt-2 w-full bg-[#0C3B2E] text-white text-xs font-bold py-1.5 rounded-lg">View Case →</button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Assignment markers */}
          {assigned.map((m) => (
            <CircleMarker key={`a-${m.id}`} center={m.coords} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: ASSIGNED_COLOR, fillOpacity: 1 }}>
              <Popup>
                <div className="text-xs min-w-[180px]">
                  <p className="font-bold text-[#0C3B2E]">Field Visit</p>
                  <p className="text-gray-700">{m.title}</p>
                  <p className="text-gray-500">{m.location} • {m.crop}</p>
                  <p className="text-[11px] font-bold text-[#0284c7] mt-1">{m.status}</p>
                  <button onClick={() => onOpenAssignment && onOpenAssignment(m)} className="mt-2 w-full bg-[#0C3B2E] text-white text-xs font-bold py-1.5 rounded-lg">Open Assignment</button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-[400]">
          <button onClick={locate} className="w-8 h-8 bg-white border border-[#e4eae4] rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50" title="Locate Me">📍</button>
          <button onClick={resetView} className="w-8 h-8 bg-white border border-[#e4eae4] rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 text-[10px] font-bold" title="Reset">⟲</button>
        </div>
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur border border-[#e4eae4] rounded-xl px-2.5 py-1.5 text-[10px] shadow flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#2e7d32' }} /> Healthy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#f9a825' }} /> Attention</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#e65100' }} /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#0284c7' }} /> Assigned</span>
          <span className="flex items-center gap-1">📍 You</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>{nearbyCount} nearby cases · {assignedCount} assigned visits</span>
        <button onClick={onOpenFullMap} className="text-[#0C3B2E] font-bold hover:underline">View Full Field Map →</button>
      </div>
    </div>
  );
}