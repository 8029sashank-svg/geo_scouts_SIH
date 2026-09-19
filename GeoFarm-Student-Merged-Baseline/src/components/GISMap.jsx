import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Map as MapIcon, Layers, Radio, Bug, Satellite } from 'lucide-react';
import { Card, CardHeader } from './ui/Card.jsx';
import { RiskBadge, Badge } from './ui/Badge.jsx';
import { Toggle } from './ui/Toggle.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useTelemetryStream } from '../hooks/useTelemetryStream.js';
import { usePestForecast } from '../hooks/usePestForecast.js';

/**
 * Geo-Farm — Interactive GIS Satellite Canopy Map
 * SIH26131: Early detection & management of crop diseases and pest infestations
 */

const MAP_CENTER = [19.7, 74.2]; // midpoint between Nashik and Rahuri belts
const MAP_ZOOM = 6.5; // zoomed out slightly to see more of Maharashtra

const RISK_HEX = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  SEVERE: '#dc2626',
  CRITICAL: '#7f1d1d',
};

const MAHAPOCRA_COLORS = {
  Low: '#dc2626',      // Red
  Average: '#f97316',  // Orange
  Good: '#eab308',     // Yellow
  VeryGood: '#84cc16', // Light Green
  Excellent: '#22c55e',// Dark Green
};

function MapLegend() {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'bg-white p-3 rounded shadow-sm border border-gray-200 text-xs text-gray-700 min-w-[120px]');
      div.innerHTML = `
        <div class="font-bold mb-2 pb-1 border-b border-gray-200 flex justify-between items-center">
          <span>Legend</span>
          <span class="text-gray-400 cursor-pointer hover:text-gray-600">—</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#dc2626] border border-gray-400"></div> Low</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#f97316] border border-gray-400"></div> Average</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#eab308] border border-gray-400"></div> Good</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#84cc16] border border-gray-400"></div> Very Good</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#22c55e] border border-gray-400"></div> Excellent</div>
          <div class="flex items-center gap-2 mt-1"><div class="w-3 h-3 bg-[#e5e7eb] border border-gray-400"></div> No data</div>
        </div>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map]);
  return null;
}

export default function GISMap({ compact = false }) {
  const { t } = useLanguage();
  const { readingsByNode, nodes } = useTelemetryStream('*');
  const { readingsByTrap, traps } = usePestForecast('*');

  const [showDistricts, setShowDistricts] = useState(true);
  const [showRadii, setShowRadii] = useState(false);
  const [showTraps, setShowTraps] = useState(false);
  const [geoData, setGeoData] = useState(null);

  const nodeReadings = useMemo(() => Object.values(readingsByNode), [readingsByNode]);
  const trapReadings = useMemo(() => Object.values(readingsByTrap), [readingsByTrap]);

  useEffect(() => {
    fetch('/maharashtra_districts.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(console.error);
  }, []);

  const getDistrictStyle = (feature) => {
    // Generate deterministic pseudo-random status based on district name to mimic mock registration data
    const name = feature.properties.NAME_2 || 'Unknown';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash) % 5;
    let color;
    switch(val) {
      case 0: color = MAHAPOCRA_COLORS.Low; break;
      case 1: color = MAHAPOCRA_COLORS.Average; break;
      case 2: color = MAHAPOCRA_COLORS.Good; break;
      case 3: color = MAHAPOCRA_COLORS.VeryGood; break;
      case 4: color = MAHAPOCRA_COLORS.Excellent; break;
      default: color = '#e5e7eb';
    }

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#444444',
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.NAME_2 || 'Unknown District';
    layer.bindTooltip(`<strong>${name}</strong>`, { direction: 'center', className: 'bg-white px-2 py-1 border shadow-sm rounded text-xs text-gray-800' });
  };

  return (
    <Card padded={!compact}>
      {!compact && (
        <CardHeader
          icon={MapIcon}
          title={t('gisMap')}
          subtitle={t('gisSubtitle')}
        />
      )}

      {!compact && (
        <div className="flex flex-wrap items-center gap-5 mb-3 px-1">
          <Toggle size="sm" checked={showDistricts} onChange={setShowDistricts} label="District Overlay" />
          <Toggle size="sm" checked={showRadii} onChange={setShowRadii} label={t('sensorRadius')} />
          <Toggle size="sm" checked={showTraps} onChange={setShowTraps} label={t('pestTraps')} />
        </div>
      )}

      <div className={`rounded-xl overflow-hidden border border-gray-300 shadow-sm ${compact ? 'h-64' : 'h-[32rem]'}`}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          scrollWheelZoom={!compact}
          dragging={!compact}
          style={{ height: '100%', width: '100%', background: '#E8EEF5' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={16}
          />

          {showDistricts && geoData && (
            <GeoJSON 
              data={geoData} 
              style={getDistrictStyle}
              onEachFeature={onEachFeature}
            />
          )}

          <MapLegend />

          {showRadii &&
            nodes.map((node) => (
              <Circle
                key={`radius-${node.nodeId}`}
                center={[node.lat, node.lng]}
                radius={node.radiusKm * 1000}
                pathOptions={{
                  color: '#16a34a',
                  weight: 1,
                  fillColor: '#16a34a',
                  fillOpacity: 0.1,
                  dashArray: '4 4',
                }}
              />
            ))}

          {showRadii && nodeReadings.map((reading) => (
            <CircleMarker
              key={reading.nodeId}
              center={[reading.lat, reading.lng]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: RISK_HEX[reading.risk.dominantRiskLevel] ?? RISK_HEX.LOW,
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="min-w-[190px]">
                  <div className="flex items-center gap-1.5 font-bold text-gov-navy text-sm mb-1">
                    <Radio size={13} /> {reading.label}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {reading.crop} · {reading.farmsServed} {t('farmsLabel')}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {reading.temperature.toFixed(1)}°C · {reading.humidity}% RH
                  </p>
                  <RiskBadge level={reading.risk.dominantRiskLevel} size="sm" />
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {showTraps &&
            trapReadings.map((trap) => (
              <CircleMarker
                key={trap.trapId}
                center={[trap.lat, trap.lng]}
                radius={6}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: trap.swarmImminent ? '#dc2626' : '#0284c7',
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-1.5 font-bold text-gov-navy text-sm mb-1">
                      <Bug size={13} /> {trap.label}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{trap.pestLabel}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      {trap.nightlyCatch} {t('catchPerNight')}
                    </p>
                    {trap.swarmImminent ? (
                      <Badge color="amber" size="sm">
                        {t('swarmImminentTag')}
                      </Badge>
                    ) : (
                      <Badge color="blue" size="sm">
                        {t('monitoringTag')}
                      </Badge>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      {!compact && (
        <div className="flex items-center gap-4 mt-3 px-1 text-[11px] text-gov-textSec">
          <span className="flex items-center gap-1.5">
            <Layers size={12} /> {nodeReadings.length} {t('sensorNodesCount')} · {trapReadings.length} {t('trapsCountLabel')}
          </span>
        </div>
      )}
    </Card>
  );
}
