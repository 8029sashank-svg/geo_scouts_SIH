import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { MISSION_STATUS } from '../mockData.js';

const RISK_COLOR = {
  HIGH: '#e65100',
  MEDIUM: '#f9a825',
  LOW: '#2e7d32',
};

const ASSIGNED_COLOR = '#0284c7';

// Marker color reflects shared assignment state so the dashboard hero
// legend stays honest: completed green, assigned/in-progress blue,
// otherwise the priority risk color.
function markerColor(m) {
  if (
    m.status === MISSION_STATUS.COMPLETED ||
    m.status === MISSION_STATUS.UNDER_REVIEW ||
    m.status === MISSION_STATUS.VERIFIED
  ) {
    return RISK_COLOR.LOW;
  }
  if (
    m.status === MISSION_STATUS.ACCEPTED ||
    m.status === MISSION_STATUS.EN_ROUTE ||
    m.status === MISSION_STATUS.IN_PROGRESS
  ) {
    return ASSIGNED_COLOR;
  }
  return RISK_COLOR[m.priority] || RISK_COLOR.LOW;
}

const CENTER = [19.98, 74.0];

export default function FieldMapMini({ missions, className = 'h-48' }) {
  return (
    <div className={className}>
      <MapContainer
        center={CENTER}
        zoom={9}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {missions.map((m) => (
          <CircleMarker
            key={m.id}
            center={m.coords}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: markerColor(m),
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top">{m.title}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
