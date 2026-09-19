/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { FlyToInterpolator } from '@deck.gl/core';
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core';
import { MapPin, Search, RotateCw, Droplets, Bug, Leaf, TrendingUp, ChevronRight, Plus, Minus, Home, Compass, Layers, ChevronDown, Crosshair } from 'lucide-react';
import { useScout } from '../ScoutContext.jsx';
import { NEARBY_CASES } from '../mockData.js';
// eslint-disable-next-line no-unused-vars
import { MOCK_DISTRICT_INTELLIGENCE, getDistrictIntelligence, riskColor } from '../data/districtIntelligence.js';
import { FARMER_ESTIMATES } from '../mockData.js';
import { useLiveLocationShared } from '../contexts/livelocationcontext.jsx';

// Maharashtra center, cinematic angled view
const INITIAL_VIEW_STATE = {
  longitude: 75.8,
  latitude: 19.35,
  zoom: 6.15,
  pitch: 48,
  bearing: -12,
  maxZoom: 9,
  minZoom: 5,
};

const RISK_LAYERS = [
  { key: 'overallRisk', label: 'Overall Risk' },
  { key: 'pestRisk', label: 'Pest Risk' },
  { key: 'diseaseRisk', label: 'Disease Risk' },
  { key: 'waterStress', label: 'Water Stress' },
  { key: 'yieldIndex', label: 'Yield Index' },
  { key: 'ndvi', label: 'NDVI' },
  { key: 'ndwi', label: 'NDWI' },
  { key: 'cropHealth', label: 'Crop Health' },
];

// Premium lighting — subtle ambient + directional for soft side shading
const ambientLight = new AmbientLight({ color: [255, 255, 255], intensity: 0.6 });
const directionalLight = new DirectionalLight({ color: [255, 255, 255], intensity: 0.8, direction: [-1, -3, -1] });
const lightingEffect = new LightingEffect({ ambientLight, directionalLight });

function getLayerScore(intel, layerKey, sat) {
  if (layerKey === 'ndvi') return sat ? sat.ndviMean ?? 0.5 : 0.5;
  if (layerKey === 'ndwi') return sat ? sat.ndwiMean ?? 0 : 0;
  if (layerKey === 'cropHealth') {
    const ndvi = sat ? sat.ndviMean : null;
    if (ndvi == null) return 50;
    return Math.round(((ndvi + 1) / 2) * 100);
  }
  if (!intel) return 0;
  if (layerKey === 'yieldIndex') return intel.yieldIndex ?? 50;
  return intel[layerKey] ?? intel.overallRisk ?? 0;
}

// Continuous NDVI gradient: brown -> amber -> green
function ndviContinuousColor(ndvi) {
  // ndvi -1..1
  const t = Math.max(0, Math.min(1, (ndvi + 1) / 2)); // 0..1
  // 0 = brown/red, 0.5 = yellow, 1 = green
  if (t < 0.5) {
    // brown/red (180,60,30) -> amber (245,158,11)
    const p = t / 0.5;
    return [Math.round(180 + (245 - 180) * p), Math.round(60 + (158 - 60) * p), Math.round(30 + (11 - 30) * p)];
  } else {
    // amber -> green (6,122,80)
    const p = (t - 0.5) / 0.5;
    return [Math.round(245 + (6 - 245) * p), Math.round(158 + (122 - 158) * p), Math.round(11 + (80 - 11) * p)];
  }
}

function scoreToColor(score, layerKey) {
  if (layerKey === 'ndvi') {
    const rgb = ndviContinuousColor(score);
    return [...rgb, 255];
  }
  if (layerKey === 'cropHealth') {
    const norm = score; // 0..100
    if (norm >= 65) return [6, 122, 80, 255];
    if (norm >= 40) return [245, 158, 11, 255];
    return [220, 60, 30, 255];
  }
  if (layerKey === 'ndwi') {
    if (score > 0.1) return [6, 122, 80, 255];
    if (score > -0.05) return [245, 158, 11, 255];
    return [220, 60, 30, 255];
  }
  if (layerKey === 'yieldIndex') {
    if (score >= 75) return [6, 122, 80, 255];
    if (score >= 55) return [245, 158, 11, 255];
    return [220, 38, 38, 255];
  }
  if (score >= 70) return [220, 38, 38, 255];
  if (score >= 40) return [245, 158, 11, 255];
  return [6, 122, 80, 255];
}

function centroidOfFeature(feature) {
  const coords = feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates[0]
    : feature.geometry.coordinates[0][0];
  let lon = 0, lat = 0;
  for (const [x, y] of coords) { lon += x; lat += y; }
  return [lon / coords.length, lat / coords.length];
}

export default function Maharashtra3DMap({ onNavigate }) {
  const { missions, reports } = useScout();
  const [geoJson, setGeoJson] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selected, setSelected] = useState(null);
  const hoveredRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [layerKey, setLayerKey] = useState('overallRisk');
  const [search, setSearch] = useState('');
  const [webGLError, setWebGLError] = useState(null);
  const [intelligence, setIntelligence] = useState(MOCK_DISTRICT_INTELLIGENCE);
  const [dataSource, setDataSource] = useState('DEMO_MOCK_FALLBACK');
  const [sourceYear, setSourceYear] = useState(null);
  const [satellite, setSatellite] = useState({});
  const [basemapFailed, setBasemapFailed] = useState(false);
  const [openSections, setOpenSections] = useState({ indicators: true, risk: true, cases: false, activity: false, sources: false, trend: false, moreLayers: false });
  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [mapStatus, setMapStatus] = useState('loading'); // loading, ready, error, unsupported
  const deckRef = useRef(null);
  const mapRef = useRef(null);
  const hasRetried = useRef(false);
  const liveLoc = useLiveLocationShared();

  // Robust initialization: wait for container with non-zero dimensions, check WebGL
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const checkWebGL = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setMapStatus('unsupported');
        setWebGLError('WebGL not supported on this device');
        console.error('[GeoFarm 3D Map] WebGL unsupported');
        return false;
      }
      return true;
    };
    if (!checkWebGL()) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && mapStatus === 'loading') {
          setIsContainerReady(true);
        }
      }
    });
    ro.observe(el);
    // Initial check
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) setIsContainerReady(true);

    const handleContextLost = (e) => {
      e.preventDefault();
      console.error('[GeoFarm 3D Map] WebGL context lost', e);
      setMapStatus('error');
      setWebGLError('WebGL context lost');
      if (!hasRetried.current) {
        hasRetried.current = true;
        setTimeout(() => {
          console.log('[GeoFarm 3D Map] Retrying after context loss');
          setMapStatus('loading');
          setIsContainerReady(false);
          setTimeout(() => setIsContainerReady(true), 100);
        }, 800);
      }
    };
    const canvas = el.querySelector('canvas');
    if (canvas) canvas.addEventListener('webglcontextlost', handleContextLost);

    return () => {
      ro.disconnect();
      if (canvas) canvas.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, [mapStatus]);

  useEffect(() => {
    if (isContainerReady && geoJson && mapStatus === 'loading') {
      // Small RAF to ensure container is painted
      const id = requestAnimationFrame(() => setMapStatus('ready'));
      return () => cancelAnimationFrame(id);
    }
  }, [isContainerReady, geoJson, mapStatus]);

  useEffect(() => {
    fetch('/maharashtra_districts.json')
      .then((r) => r.json())
      .then((data) => setGeoJson(data))
      .catch((e) => {
        console.error('[GeoFarm 3D Map] GeoJSON load failed', e);
        setWebGLError(e.message);
        setMapStatus('error');
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDistrictIntelligence().then((map) => {
      if (cancelled) return;
      setIntelligence(map);
      const sample = map['Nashik'];
      if (sample && sample.dataSource) setDataSource(sample.dataSource);
      else setDataSource('DEMO_MOCK_FALLBACK');
      if (sample && sample.sourceYear) setSourceYear(sample.sourceYear);
      else setSourceYear(null);
    }).catch(() => {
      if (!cancelled) {
        setDataSource('DEMO_MOCK_FALLBACK');
        setSourceYear(null);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:8000/satellite/districts', { signal: AbortSignal.timeout(2500) })
      .then((r) => {
        if (!r.ok) throw new Error('satellite districts failed');
        return r.json();
      })
      .then((arr) => {
        if (cancelled) return;
        const map = {};
        for (const d of arr) {
          if (!d.district) continue;
          map[d.district] = d;
        }
        setSatellite(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const districtList = useMemo(() => Object.keys(intelligence).sort(), [intelligence]);

  const filteredSearch = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return districtList.filter((d) => d.toLowerCase().includes(q)).slice(0, 6);
  }, [search, districtList]);

  const stats = useMemo(() => {
    const vals = Object.values(intelligence);
    return {
      total: vals.length,
      high: vals.filter((v) => v.riskLevel === 'HIGH').length,
      medium: vals.filter((v) => v.riskLevel === 'MEDIUM').length,
      low: vals.filter((v) => v.riskLevel === 'LOW').length,
    };
  }, [intelligence]);

  const selectedIntel = selected ? intelligence[selected] : null;

  const activeCases = useMemo(() => {
    if (!selected) return [];
    const alias = selected === 'Ahmednagar' ? ['Ahmednagar', 'Ahilyanagar'] : [selected];
    return NEARBY_CASES.filter((c) => alias.some((a) => c.village.toLowerCase().includes(a.toLowerCase())));
  }, [selected]);

  const studentCounts = useMemo(() => {
    if (!selected) return null;
    const inDistrictMissions = missions.filter((m) => {
      if (selected === 'Nashik') return true;
      if (selected === 'Ahmednagar' && m.location.includes('Rahuri')) return true;
      return false;
    });
    const active = inDistrictMissions.filter((m) => m.status === 'Accepted' || m.status === 'En Route' || m.status === 'In Progress').length;
    const completed = inDistrictMissions.filter((m) => m.status === 'Completed' || m.status === 'Under Review' || m.status === 'Verified').length;
    const districtReports = reports.filter((r) => inDistrictMissions.some((m) => m.id === r.missionId)).length;
    return { active, completed, reports: districtReports };
  }, [selected, missions, reports]);

  const handleSelect = useCallback((name, coords) => {
    setSelected(name);
    setShowDetails(false);
    if (coords) {
      setViewState((v) => ({
        ...v,
        longitude: coords[0],
        latitude: coords[1],
        zoom: 6.85,
        pitch: 48,
        bearing: -8,
        transitionDuration: 950,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.05 }),
        transitionEasing: (t) => 1 - Math.pow(1 - t, 2.5),
      }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelected(null);
    hoveredRef.current = null;
    setHovered(null);
    setSearch('');
    setViewState({
      ...INITIAL_VIEW_STATE,
      transitionDuration: 900,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.1 }),
      transitionEasing: (t) => 1 - Math.pow(1 - t, 3),
    });
  }, []);

  const zoomIn = useCallback(() => {
    setViewState((v) => ({
      ...v,
      zoom: Math.min(v.zoom + 0.7, 9),
      transitionDuration: 300,
      transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
    }));
  }, []);
  const zoomOut = useCallback(() => {
    setViewState((v) => ({
      ...v,
      zoom: Math.max(v.zoom - 0.7, 5),
      transitionDuration: 300,
      transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
    }));
  }, []);

  // Debounced hover to avoid flicker — use ref + throttled state
  const handleHover = useCallback((info) => {
    const name = info.object ? info.object.properties.NAME_2 : null;
    if (hoveredRef.current !== name) {
      hoveredRef.current = name;
      // throttle to next frame
      requestAnimationFrame(() => setHovered(hoveredRef.current));
    }
  }, []);

  // Helper: point in polygon (ray casting) for district detection
  const pointInDistrict = useCallback((lng, lat) => {
    if (!geoJson) return null;
    for (const feat of geoJson.features) {
      const geom = feat.geometry;
      const polys = geom.type === 'Polygon' ? [geom.coordinates[0]] : geom.coordinates.map((c) => c[0]);
      for (const coords of polys) {
        let inside = false;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          const xi = coords[i][0], yi = coords[i][1];
          const xj = coords[j][0], yj = coords[j][1];
          const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) return feat.properties.NAME_2;
      }
    }
    return null;
  }, [geoJson]);

  const layers = useMemo(() => {
    if (!geoJson) return [];
    const tileLayer = !basemapFailed ? new TileLayer({
      id: 'satellite-basemap',
      data: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props) => {
        const { bbox: { west, south, east, north } } = props.tile;
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north],
          desaturate: 0.2,
          transparentColor: [0, 0, 0, 0],
          tintColor: [255, 255, 255],
        });
      },
      onTileError: () => setBasemapFailed(true),
    }) : null;

    const districtLayer = new GeoJsonLayer({
      id: 'maharashtra-districts',
      data: geoJson,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: true,
      wireframe: false,
      // Subtle extrusion — LOW smaller, HIGH slightly higher, not floating blocks
      getElevation: (f) => {
        const name = f.properties.NAME_2;
        const intel = intelligence[name];
        const sat = satellite[name];
        const raw = getLayerScore(intel, layerKey, sat, name);
        let norm = raw;
        if (layerKey === 'farmers') {
          const count = FARMER_ESTIMATES[name] || 0;
          norm = ((count - 45000) / (218000 - 45000)) * 100;
        } else if (layerKey === 'crops') {
          norm = 50;
        } else if (layerKey === 'fieldCases') {
          const hasCases = NEARBY_CASES.some((c) => c.village.toLowerCase().includes(name.toLowerCase()) || (name === 'Ahmednagar' && c.village.toLowerCase().includes('ahilyanagar')));
          norm = hasCases ? 80 : 20;
        }
        return 400 + Math.max(0, Math.min(100, norm)) * 14;
      },
      getFillColor: (f) => {
        const name = f.properties.NAME_2;
        const isSelected = name === selected;
        const isHovered = name === hovered;
        const intel = intelligence[name];
        const sat = satellite[name];
        const raw = getLayerScore(intel, layerKey, sat);
        const base = scoreToColor(raw, layerKey);
        if (isSelected) return [6, 182, 212, 255];
        if (isHovered) return [Math.min(255, base[0] + 22), Math.min(255, base[1] + 22), Math.min(255, base[2] + 22), 240];
        return [...base.slice(0, 3), 218];
      },
      getLineColor: (f) => {
        const name = f.properties.NAME_2;
        if (name === selected) return [255, 255, 255, 220];
        if (name === hovered) return [255, 255, 255, 140];
        return [255, 255, 255, 42];
      },
      getLineWidth: (f) => (f.properties.NAME_2 === selected ? 2 : 1),
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 2,
      transitions: {
        getFillColor: { duration: 300, easing: (t) => t * (2 - t) },
        getElevation: { duration: 400, easing: (t) => 1 - Math.pow(1 - t, 3) },
      },
      updateTriggers: {
        getFillColor: [selected, hovered, layerKey, satellite],
        getElevation: [layerKey, satellite],
      },
      onHover: handleHover,
      onClick: (info) => {
        if (info.object) {
          const name = info.object.properties.NAME_2;
          const c = centroidOfFeature(info.object);
          handleSelect(name, c);
        } else {
          setSelected(null);
        }
      },
    });

    return tileLayer ? [tileLayer, districtLayer] : [districtLayer];
  }, [geoJson, selected, hovered, layerKey, handleSelect, intelligence, satellite, basemapFailed, handleHover]);

  const getTooltip = useCallback(({ object }) => {
    if (!object) return null;
    const name = object.properties.NAME_2;
    const intel = intelligence[name];
    const sat = satellite[name];
    if (!intel && !sat) return { text: name };
    const raw = getLayerScore(intel, layerKey, sat);
    const label = RISK_LAYERS.find((l) => l.key === layerKey)?.label || layerKey;
    let display = raw;
    if (layerKey === 'ndvi' || layerKey === 'ndwi') display = Number(raw).toFixed(2);
    else if (typeof raw === 'number') display = `${Math.round(raw)}/100`;
    const crop = intel?.crop || '';
    const cases = NEARBY_CASES.filter((c) => c.village.toLowerCase().includes(name.toLowerCase())).length;
    const ndvi = sat?.ndvi?.mean ?? sat?.ndviMean;
    const ndwi = sat?.ndwi?.mean ?? sat?.ndwiMean;
    return {
      html: `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.35;min-width:160px">
        <div style="font-weight:800;font-size:13px;margin-bottom:4px">${name}</div>
        <div style="display:flex;justify-content:space-between;opacity:0.95"><span>${label}</span><b>${display}</b></div>
        ${crop ? `<div style="opacity:0.75;font-size:11px">Primary Crop · ${crop}</div>` : ''}
        ${sat ? `<div style="opacity:0.75;font-size:11px;margin-top:3px">NDVI ${ndvi != null ? Number(ndvi).toFixed(2) : '—'} · NDWI ${ndwi != null ? Number(ndwi).toFixed(2) : '—'}</div>` : ''}
        ${cases ? `<div style="opacity:0.75;font-size:11px">Cases · ${cases}</div>` : ''}
        <div style="margin-top:6px;font-size:11px;opacity:0.6">Click to view intelligence →</div>
      </div>`,
      style: {
        backgroundColor: 'rgba(12, 20, 18, 0.92)',
        color: 'white',
        borderRadius: '12px',
        padding: '10px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      },
    };
  }, [layerKey, intelligence, satellite]);

  if (webGLError) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-sm font-bold text-red-700">3D map unavailable on this device</p>
        <p className="text-xs text-gray-500 mt-1">{webGLError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar — simplified primary + More Layers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-[#e4eae4] rounded-full p-1 shadow-sm">
          <button
            onClick={() => setLayerKey('overallRisk')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${layerKey === 'overallRisk' ? 'bg-[#0C3B2E] text-white shadow-sm' : 'text-gray-500 hover:bg-[#f5f7f5]'}`}
          >
            Overall Risk
          </button>
          <div className="relative">
            <button
              onClick={() => setOpenSections((s) => ({ ...s, moreLayers: !s.moreLayers }))}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1 ${openSections.moreLayers || !['overallRisk'].includes(layerKey) ? 'bg-[#0C3B2E] text-white' : 'text-gray-500 hover:bg-[#f5f7f5]'}`}
            >
              More Layers <ChevronDown size={12} className={`${openSections.moreLayers ? 'rotate-180' : ''} transition-transform`} />
            </button>
            {openSections.moreLayers && (
              <div className="absolute left-0 mt-1 bg-white border border-[#e4eae4] rounded-2xl shadow-lg p-1 z-20 w-48">
                {RISK_LAYERS.filter((l) => l.key !== 'overallRisk').map((l) => (
                  <button
                    key={l.key}
                    onClick={() => { setLayerKey(l.key); setOpenSections((s) => ({ ...s, moreLayers: false })); }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold ${layerKey === l.key ? 'bg-[#0C3B2E] text-white' : 'text-gray-700 hover:bg-[#f5f7f5]'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search district…"
              className="pl-7 pr-3 py-1.5 text-xs border border-[#e4eae4] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#0C3B2E]/20 w-36 sm:w-40"
            />
            {filteredSearch.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-[#e4eae4] rounded-xl shadow-lg overflow-hidden z-10">
                {filteredSearch.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      const feat = geoJson?.features.find((f) => f.properties.NAME_2 === name);
                      const c = feat ? centroidOfFeature(feat) : null;
                      handleSelect(name, c);
                      setSearch('');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#f5f7f5] text-gray-700"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleReset} className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white border border-[#e4eae4] rounded-full px-3 py-1.5 hover:bg-[#f5f7f5] shadow-sm">
            <RotateCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Data source honesty */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {dataSource === 'REAL_OFFICIAL' ? (
          <span className="bg-green-700 text-white rounded-full px-2.5 py-1 font-bold">Official agricultural dataset · {sourceYear || '2024-25'}</span>
        ) : dataSource === 'DEMO_SYNTHETIC' ? (
          <span className="bg-[#0C3B2E] text-white rounded-full px-2.5 py-1 font-bold">Prototype ML Intelligence · Demo synthetic data{sourceYear ? ` · ${sourceYear}` : ''}</span>
        ) : (
          <span className="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-2.5 py-1 font-bold">ML service unavailable — showing demo fallback</span>
        )}
        <span className="text-gray-400 hidden sm:inline">Model: Random Forest · Satellite: Sentinel-2 NDVI/NDWI</span>
      </div>

      {/* Map + Panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden border border-[#0B1220] shadow-[0_8px_32px_rgba(0,0,0,0.18)] bg-[#0B1220] relative" style={{ height: '520px' }}>
            {!geoJson ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-[#9DBEAC]">Loading Maharashtra districts…</div>
            ) : (
              <DeckGL
                viewState={viewState}
                onViewStateChange={({ viewState: v }) => setViewState(v)}
                controller={{ dragPan: true, dragRotate: true, scrollZoom: { speed: 0.01, smooth: true }, doubleClickZoom: true, touchRotate: true }}
                layers={layers}
                getTooltip={getTooltip}
                style={{ background: basemapFailed ? '#0B1220' : '#0e1a14' }}
                onError={(err) => setWebGLError(err?.message || 'WebGL error')}
                effects={[lightingEffect]}
              />
            )}
            {/* Map controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              <button onClick={zoomIn} className="w-8 h-8 bg-white/95 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center hover:bg-white shadow-md transition-colors" title="Zoom in">
                <Plus size={14} className="text-gray-800" />
              </button>
              <button onClick={zoomOut} className="w-8 h-8 bg-white/95 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center hover:bg-white shadow-md transition-colors" title="Zoom out">
                <Minus size={14} className="text-gray-800" />
              </button>
              <button onClick={handleReset} className="w-8 h-8 bg-white/95 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center hover:bg-white shadow-md transition-colors" title="Home">
                <Home size={14} className="text-gray-800" />
              </button>
              <div className="w-8 h-8 bg-white/90 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center shadow-md">
                <Compass size={14} className="text-[#0C3B2E] animate-[spin_8s_linear_infinite]" style={{ animation: hovered ? 'none' : undefined }} />
              </div>
            </div>
            <div className="absolute top-3 left-3 bg-[#0B1220]/80 backdrop-blur border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 text-[11px] font-bold text-white shadow">
              <Layers size={12} className="text-[#7ad3b5]" /> Maharashtra 3D
            </div>
            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur border border-white/20 rounded-2xl px-3 py-2.5 text-[11px] shadow-lg max-w-[92%] sm:max-w-none">
              <p className="font-bold text-gray-800 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#0C3B2E]" /> Layer: {RISK_LAYERS.find((l) => l.key === layerKey)?.label}</p>
              {layerKey === 'ndvi' ? (
                <div className="mt-2">
                  <div className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(to right, #7a3a1a, #a05a2c, #d4a017, #7ab55c, #0a6b3a)' }} />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                    <span>0.0</span><span>0.25</span><span>0.5</span><span>0.75</span><span>1.0</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Vegetation vigor — higher = healthier</p>
                </div>
              ) : layerKey === 'ndwi' ? (
                <div className="mt-2">
                  <div className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(to right, #8b1a1a, #c46a1a, #e7c65a, #5ab5a0, #0a6b8a)' }} />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>-0.5</span><span>0.0</span><span>0.5</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Water indicator — not drought truth</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: '#065f46', border: '1px solid rgba(255,255,255,0.6)' }} /> <span className="font-semibold text-gray-700">LOW</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: '#d97706', border: '1px solid rgba(255,255,255,0.6)' }} /> <span className="font-semibold text-gray-700">MEDIUM</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: '#dc2626', border: '1px solid rgba(255,255,255,0.6)' }} /> <span className="font-semibold text-gray-700">HIGH</span></span>
                </div>
              )}
              {/* Floating district pop-out — simple, appears near center when district selected */}
              {selected && !showDetails && selectedIntel && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.22)] border border-[#e4eae4] p-4 w-[300px] max-w-[90%] animate-[fadeIn_0.2s_ease]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{selected}</h3>
                      <p className="text-[11px] text-gray-500">{selectedIntel.crop} · Primary Crop</p>
                    </div>
                    <span className={`text-[11px] font-bold rounded-full px-2 py-1 ${selectedIntel.riskLevel === 'HIGH' ? 'bg-red-600 text-white' : selectedIntel.riskLevel === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
                      {selectedIntel.riskLevel}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-gray-900">{FARMER_ESTIMATES[selected] ? `${(FARMER_ESTIMATES[selected]/1000).toFixed(0)}K` : '—'}</p>
                    <p className="text-[11px] text-gray-500">Farmers · <span className="text-amber-700 font-semibold">Prototype estimate</span></p>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <p className="font-bold text-gray-900">Key Insights</p>
                    <ul className="space-y-1 text-gray-600 list-disc pl-4">
                      {selectedIntel.pestRisk >= 60 && <li>High pest activity in recent reports</li>}
                      {selectedIntel.waterStress >= 50 && <li>Moderate water-stress indicator</li>}
                      {selectedIntel.diseaseRisk >= 60 && <li>Elevated disease risk — monitor leaves</li>}
                      <li>Important {selectedIntel.crop.toLowerCase()}-growing region</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => onNavigate?.('nearby')} className="text-xs font-bold bg-[#0C3B2E] text-white rounded-xl py-2 hover:bg-[#12503d]">View Field Cases</button>
                    <button onClick={() => onNavigate?.('assignments')} className="text-xs font-bold bg-white border border-[#0C3B2E]/30 text-[#0C3B2E] rounded-xl py-2 hover:bg-[#0C3B2E]/5">Plan Field Visit</button>
                  </div>
                  <button onClick={() => setShowDetails(true)} className="mt-2 w-full text-xs font-bold text-[#0C3B2E] hover:underline flex items-center justify-center gap-1">
                    View Details <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center hidden sm:block">Drag to rotate · Scroll to zoom (map only) · Click a district · Pinch to zoom on mobile</p>
        </div>

        {/* District panel — scrolls independently, map stays fixed */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#e4eae4] rounded-2xl shadow-[0_1px_3px_rgba(12,59,46,0.06)] p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto">
            {!selected ? (
              <>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Maharashtra Agricultural Overview</h3>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-[10px] font-semibold text-gray-500">Districts monitored</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-red-700">{stats.high}</p>
                    <p className="text-[10px] font-semibold text-red-700">High-risk</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-amber-700">{stats.medium}</p>
                    <p className="text-[10px] font-semibold text-amber-700">Medium-risk</p>
                  </div>
                  <div className="bg-[#eef3ee] border border-[#e4eae4] rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-[#0C3B2E]">{stats.low}</p>
                    <p className="text-[10px] font-semibold text-gray-500">Low-risk</p>
                  </div>
                </div>
                <div className="mt-3 bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Model</p>
                  <p className="text-xs font-bold text-gray-900 mt-1">Random Forest · Prototype</p>
                  <p className="text-[11px] text-gray-500 mt-1">Inputs: weather, soil moisture, NDVI/NDWI, pest/disease reports, historical yield</p>
                  <p className="text-[11px] text-gray-500">Output: pest/disease/water/yield → overall risk (0.4/0.3/0.3)</p>
                  <p className="text-[11px] text-amber-700 mt-1">Data: prototype synthetic dataset — not official</p>
                </div>
                <p className="text-[11px] text-gray-400 mt-3">Select a district on the map or search above to see intelligence.</p>
              </>
            ) : !showDetails ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">{selected}</h3>
                  <button onClick={() => setSelected(null)} className="text-[11px] font-bold text-gray-500 hover:text-[#0C3B2E]">Clear</button>
                </div>
                <div className="mt-3 bg-white border border-[#e4eae4] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold rounded-full px-2 py-1 ${selectedIntel?.riskLevel === 'HIGH' ? 'bg-red-600 text-white' : selectedIntel?.riskLevel === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>{selectedIntel?.riskLevel}</span>
                    <span className="text-[11px] text-gray-500">{selectedIntel?.crop} · Primary Crop</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-2">{FARMER_ESTIMATES[selected] ? `${(FARMER_ESTIMATES[selected]/1000).toFixed(0)}K` : '—'} <span className="text-xs font-normal text-gray-500">Farmers · <span className="text-amber-700">Prototype estimate</span></span></p>
                  <div className="mt-2">
                    <p className="text-[11px] font-bold text-gray-500">Key Insights</p>
                    <ul className="mt-1 space-y-1 text-xs text-gray-600 list-disc pl-4">
                      {selectedIntel?.pestRisk >= 60 && <li>High pest activity in recent reports</li>}
                      {selectedIntel?.waterStress >= 50 && <li>Moderate water-stress indicator</li>}
                      <li>Important {(selectedIntel?.crop || 'mixed').toLowerCase()}-growing region</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => onNavigate?.('nearby')} className="text-xs font-bold bg-[#0C3B2E] text-white rounded-xl py-2">View Field Cases</button>
                    <button onClick={() => onNavigate?.('assignments')} className="text-xs font-bold bg-white border border-[#0C3B2E]/30 text-[#0C3B2E] rounded-xl py-2">Plan Field Visit</button>
                  </div>
                  <button onClick={() => setShowDetails(true)} className="mt-2 w-full text-xs font-bold text-[#0C3B2E] hover:underline">View Details →</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">{selected}</h3>
                    <p className="text-[11px] text-gray-500">Agricultural Intelligence — detailed</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowDetails(false)} className="text-[11px] font-bold text-gray-500 hover:text-[#0C3B2E] border border-[#e4eae4] rounded-full px-2 py-1">Back</button>
                    <button onClick={() => setSelected(null)} className="text-[11px] font-bold text-gray-500 hover:text-[#0C3B2E] border border-[#e4eae4] rounded-full px-2.5 py-1 bg-white">Clear</button>
                  </div>
                </div>

                <div className="mt-3 space-y-3 animate-[fadeIn_0.2s_ease]">
                  {/* District header — crop + risk + provenance */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-500">Primary crop</span>
                    <span className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-900">
                      <Leaf size={12} className="text-[#0C3B2E]" /> {selectedIntel?.crop ?? 'Not available'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-gray-500">Overall risk</span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${selectedIntel?.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : selectedIntel?.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : selectedIntel?.riskLevel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {selectedIntel?.riskLevel ?? 'Not available'}
                    </span>
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${dataSource === 'REAL_OFFICIAL' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {dataSource === 'REAL_OFFICIAL' ? 'Official' : 'Prototype / Demo'}
                    </span>
                  </div>

                  {/* Key metric cards — Overall, NDVI, NDWI, Yield */}
                  {(() => {
                    const sat = satellite[selected];
                    const ndvi = sat?.ndvi?.mean ?? sat?.ndviMean;
                    const ndwi = sat?.ndwi?.mean ?? sat?.ndwiMean;
                    return (
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="bg-[#0C3B2E] text-white rounded-xl p-2.5 text-center shadow-sm">
                          <p className="text-[10px] font-bold opacity-70">Overall</p>
                          <p className="text-sm font-bold mt-0.5">{selectedIntel?.overallRisk ?? '—'}</p>
                          <p className="text-[10px] opacity-70">/100</p>
                        </div>
                        <div className="bg-white border border-[#e4eae4] rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold text-gray-500">NDVI</p>
                          <p className="text-sm font-bold text-gray-900">{ndvi != null ? Number(ndvi).toFixed(2) : '—'}</p>
                          <p className="text-[10px] text-gray-400">vegetation</p>
                        </div>
                        <div className="bg-white border border-[#e4eae4] rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold text-gray-500">NDWI</p>
                          <p className="text-sm font-bold text-gray-900">{ndwi != null ? Number(ndwi).toFixed(2) : '—'}</p>
                          <p className="text-[10px] text-gray-400">water</p>
                        </div>
                        <div className="bg-white border border-[#e4eae4] rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold text-gray-500">Yield</p>
                          <p className="text-sm font-bold text-gray-900">{selectedIntel?.yieldIndex != null ? selectedIntel.yieldIndex : '—'}</p>
                          <p className="text-[10px] text-gray-400">index</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Agricultural Indicators — collapsible, compact */}
                  <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                    <button onClick={() => toggleSection('indicators')} className="w-full flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Agricultural Indicators</p>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openSections.indicators ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.indicators && (
                      <div className="mt-2 space-y-2.5">
                        {(() => {
                          const sat = satellite[selected];
                          const ndvi = sat?.ndvi?.mean ?? sat?.ndviMean;
                          const ndwi = sat?.ndwi?.mean ?? sat?.ndwiMean;
                          const items = [
                            { label: 'NDVI', value: ndvi, max: 1, min: -1, note: 'Satellite-derived vegetation condition (-1 to +1)' },
                            { label: 'NDWI', value: ndwi, max: 1, min: -1, note: 'Satellite-derived water-stress indicator (-1 to +1)' },
                            { label: 'Pest Risk', value: selectedIntel?.pestRisk, max: 100, min: 0, suffix: '/100', isRisk: true },
                            { label: 'Disease Risk', value: selectedIntel?.diseaseRisk, max: 100, min: 0, suffix: '/100', isRisk: true },
                            { label: 'Water Stress', value: selectedIntel?.waterStress, max: 100, min: 0, suffix: '/100', isRisk: true },
                            { label: 'Yield Index', value: selectedIntel?.yieldIndex, max: 100, min: 0, suffix: '/100', isRisk: true },
                          ];
                          return items.map((it) => {
                            const has = it.value != null && Number.isFinite(it.value);
                            // For risk scores, clamp to 0-100 and show as 34/100, not -34%
                            const displayValue = has ? (it.isRisk ? `${Math.round(Math.max(0, Math.min(100, it.value)))}/100` : it.label === 'NDVI' || it.label === 'NDWI' ? Number(it.value).toFixed(2) : `${it.value}`) : 'Not available';
                            const pct = has ? Math.round(((Math.max(it.min, Math.min(it.max, it.value)) - it.min) / (it.max - it.min)) * 100) : 0;
                            const color = it.label === 'NDVI' || it.label === 'Yield Index' ? (pct >= 65 ? '#065f46' : pct >= 35 ? '#d97706' : '#dc2626') : it.label === 'NDWI' ? (it.value > 0.1 ? '#065f46' : it.value > -0.05 ? '#d97706' : '#dc2626') : (it.value >= 70 ? '#dc2626' : it.value >= 40 ? '#d97706' : '#065f46');
                            return (
                              <div key={it.label}>
                                <div className="flex justify-between text-xs">
                                  <span className="font-semibold text-gray-700">{it.label}</span>
                                  <span className="font-bold text-gray-900">{displayValue}</span>
                                </div>
                                <div className="h-1.5 bg-[#eef3ee] rounded-full overflow-hidden mt-1">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: has ? `${pct}%` : '0%', background: has ? color : '#e5e7eb' }} />
                                </div>
                                {it.note && <p className="text-[10px] text-gray-400 mt-0.5">{it.note}</p>}
                              </div>
                            );
                          });
                        })()}
                        <p className="text-[10px] text-gray-400 mt-1">Risk: 0 low → 100 high. NDVI/NDWI: -1 to +1 satellite scale.</p>
                      </div>
                    )}
                  </div>

                  {/* Risk breakdown — collapsible, compact */}
                  <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                    <button onClick={() => toggleSection('risk')} className="w-full flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Risk Breakdown</p>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openSections.risk ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.risk && (
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      {[
                        { label: 'Pest Risk', value: selectedIntel?.pestRisk },
                        { label: 'Disease Risk', value: selectedIntel?.diseaseRisk },
                        { label: 'Water Stress', value: selectedIntel?.waterStress },
                        { label: 'Yield Index', value: selectedIntel?.yieldIndex },
                      ].map((r) => {
                        const v = r.value;
                        const has = v != null;
                        const level = !has ? null : v >= 70 ? 'High' : v >= 40 ? 'Medium' : 'Low';
                        const color = level === 'High' ? 'bg-red-100 text-red-700 border-red-200' : level === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : level === 'Low' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200';
                        return (
                          <div key={r.label} className={`border rounded-xl p-2.5 flex items-center justify-between ${color}`}>
                            <span className="font-bold">{r.label}</span>
                            <span className="font-bold">{has ? `${Math.round(Math.max(0, Math.min(100, v)))}${r.label === 'Yield Index' ? '' : '%'}` : 'Not available'}</span>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>

                  {/* Satellite-derived indicators — clearly labelled, not standalone diagnosis */}
                  {(() => {
                    const sat = satellite[selected];
                    if (!sat) return (
                      <div className="bg-[#f5f7f5] border border-dashed border-[#e4eae4] rounded-xl p-3 text-center">
                        <p className="text-xs font-bold text-gray-500">Satellite indicators — loading…</p>
                      </div>
                    );
                    const ndviVal = sat.ndvi?.mean ?? sat.ndviMean;
                    const ndwiVal = sat.ndwi?.mean ?? sat.ndwiMean;
                    const isReal = sat.isRealData;
                    return (
                      <div className="bg-white border border-[#e4eae4] rounded-xl p-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                          <Leaf size={11} /> Satellite indicators
                          <span className={`ml-auto text-[10px] rounded-full px-1.5 py-0.5 font-bold ${isReal ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {isReal ? 'Satellite-derived • Sentinel-2' : 'Prototype • Demo satellite layer'}
                          </span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2.5">
                            <p className="text-[11px] font-bold text-gray-500">NDVI — vegetation condition</p>
                            <p className="text-sm font-bold text-gray-900">{ndviVal != null ? Number(ndviVal).toFixed(2) : 'Not available'}</p>
                            <p className="text-[10px] text-gray-500">-1 to +1 · higher = more vigorous</p>
                          </div>
                          <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2.5">
                            <p className="text-[11px] font-bold text-gray-500">NDWI — water-stress indicator</p>
                            <p className="text-sm font-bold text-gray-900">{ndwiVal != null ? Number(ndwiVal).toFixed(2) : 'Not available'}</p>
                            <p className="text-[10px] text-gray-500">(NIR-SWIR)/(NIR+SWIR) · B8/B11</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-gray-500">
                          <span>Source: <b className="text-gray-700">{sat.dataSource || sat.provenance?.dataSource || 'GeoFarm Prototype'}</b></span>
                          <span>· Date: <b className="text-gray-700">{sat.sourceDate || sat.provenance?.sourceDate || '2026-09-01'}</b></span>
                          <span>· Quality: <b className={sat.quality?.status === 'good' ? 'text-green-700' : sat.quality?.status === 'warning' ? 'text-amber-700' : 'text-gray-700'}>{sat.quality?.status || 'good'}</b> ({sat.validPixelPercent ?? sat.quality?.validPixelPercent ?? '—'}% valid)</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">NDVI/NDWI are indicators only — not standalone diagnoses of disease, drought, or yield.</p>
                      </div>
                    );
                  })()}

                  <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                    <button onClick={() => toggleSection('cases')} className="w-full flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Field Cases {activeCases.length > 0 && `· ${activeCases.length}`}</p>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openSections.cases ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.cases && (
                      <div className="mt-2">
                        {activeCases.length === 0 ? (
                          <p className="text-xs text-gray-500 bg-[#f5f7f5] border border-dashed border-[#e4eae4] rounded-xl px-3 py-3 text-center">No active student cases in this district.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {activeCases.map((c) => (
                              <div key={c.id} className="flex items-center justify-between bg-[#f5f7f5] border border-[#e4eae4] rounded-xl px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{c.issue}</p>
                                  <p className="text-[11px] text-gray-500 truncate">{c.farmer} · {c.village}</p>
                                </div>
                                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ml-2 ${c.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.priority}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                    <button onClick={() => toggleSection('activity')} className="w-full flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Student Field Activity</p>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openSections.activity ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.activity && studentCounts && (
                      <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
                        <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2">
                          <p className="text-sm font-bold text-gray-900">{studentCounts.active}</p>
                          <p className="text-[10px] font-semibold text-gray-500">Active visits</p>
                        </div>
                        <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2">
                          <p className="text-sm font-bold text-gray-900">{studentCounts.completed}</p>
                          <p className="text-[10px] font-semibold text-gray-500">Completed</p>
                        </div>
                        <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl py-2">
                          <p className="text-sm font-bold text-gray-900">{studentCounts.reports}</p>
                          <p className="text-[10px] font-semibold text-gray-500">Reports</p>
                        </div>
                      </div>
                    )}
                    {openSections.activity && !studentCounts && (
                      <p className="text-xs text-gray-500 mt-2">No field activity recorded</p>
                    )}
                  </div>

                  {/* Agricultural Summary — generated from actual data */}
                  {(() => {
                    if (!selectedIntel) return (
                      <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Agricultural Summary</p>
                        <p className="text-xs text-gray-500 mt-1">Insufficient data for district summary.</p>
                      </div>
                    );
                    const riskText = selectedIntel.riskLevel === 'HIGH' ? 'elevated agricultural risk indicators' : selectedIntel.riskLevel === 'MEDIUM' ? 'moderate agricultural risk indicators' : 'relatively low agricultural risk indicators';
                    const crop = selectedIntel.crop || 'mixed-crop';
                    const hasCases = activeCases.length > 0;
                    if (!selectedIntel.overallRisk && !hasCases) {
                      return (
                        <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Agricultural Summary</p>
                          <p className="text-xs text-gray-500 mt-1">Insufficient data for district summary.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Agricultural Summary</p>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                          {selected} is represented in the current prototype as a {crop.toLowerCase()}-growing district with {riskText}. {hasCases ? `Active field cases include ${activeCases.map(c=>c.issue).join(' and ')}.` : 'No active student cases are currently recorded for this district.'} Prototype data — not an official assessment.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Data Sources — collapsible, dynamic provenance */}
                  <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                    <button onClick={() => toggleSection('sources')} className="w-full flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Data Sources</p>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openSections.sources ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.sources && (
                      <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Agricultural Statistics</span>
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${dataSource === 'REAL_OFFICIAL' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{dataSource === 'REAL_OFFICIAL' ? 'REAL' : 'DEMO'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Satellite Indicators (Sentinel-2)</span>
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${satellite[selected]?.isRealData ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{satellite[selected]?.isRealData ? 'REAL' : 'DEMO'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Pest & Disease Reports</span>
                        <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">PARTIAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ML Intelligence</span>
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${dataSource === 'REAL_OFFICIAL' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{dataSource === 'REAL_OFFICIAL' ? 'REAL' : 'SYNTHETIC / DEMO'}</span>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Trend chart — collapsible, ready for real time-series */}
                  <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                    <button onClick={() => toggleSection('trend')} className="w-full flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">NDVI Trend — {selected}</p>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openSections.trend ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.trend && (
                      <div className="mt-2 bg-[#f5f7f5] border border-dashed border-[#e4eae4] rounded-xl px-3 py-6 text-center">
                      <p className="text-xs font-bold text-gray-500">Historical satellite series unavailable</p>
                      <p className="text-[11px] text-gray-400 mt-1">Chart will show Aug 1 → Aug 15 → Sep 1 when multi-date data is available.</p>
                      </div>
                    )}
                  </div>

                  {/* District comparison — selected vs Maharashtra avg */}
                  {(() => {
                    const sat = satellite[selected];
                    const ndvi = sat?.ndvi?.mean ?? sat?.ndviMean;
                    const ndwi = sat?.ndwi?.mean ?? sat?.ndwiMean;
                    const allSat = Object.values(satellite).filter(s => s.ndvi?.mean != null || s.ndviMean != null);
                    const avgNdvi = allSat.length ? (allSat.reduce((a,b)=>a+(b.ndvi?.mean ?? b.ndviMean ?? 0),0)/allSat.length) : null;
                    const avgNdwi = allSat.length ? (allSat.reduce((a,b)=>a+(b.ndwi?.mean ?? b.ndwiMean ?? 0),0)/allSat.length) : null;
                    if (ndvi == null && ndwi == null) return null;
                    return (
                      <div className="bg-white border border-[#e4eae4] rounded-xl p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">District Comparison — vs Maharashtra avg</p>
                        <div className="mt-2 space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">NDVI — {selected}</span><span className="font-bold text-gray-900">{ndvi != null ? Number(ndvi).toFixed(2) : 'Not available'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">NDVI — Maharashtra avg</span><span className="font-bold text-gray-700">{avgNdvi != null ? Number(avgNdvi).toFixed(2) : 'Not available'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">NDWI — {selected}</span><span className="font-bold text-gray-900">{ndwi != null ? Number(ndwi).toFixed(2) : 'Not available'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">NDWI — Maharashtra avg</span><span className="font-bold text-gray-700">{avgNdwi != null ? Number(avgNdwi).toFixed(2) : 'Not available'}</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onNavigate?.('nearby')} className="flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0C3B2E] hover:bg-[#12503d] text-white rounded-xl py-2.5 transition-colors">View Field Cases <ChevronRight size={13} /></button>
                    <button onClick={() => onNavigate?.('assignments')} className="flex items-center justify-center gap-1.5 text-xs font-bold bg-white border border-[#0C3B2E]/30 text-[#0C3B2E] hover:bg-[#0C3B2E]/5 rounded-xl py-2.5 transition-colors">Start Field Visit <ChevronRight size={13} /></button>
                    <button onClick={() => onNavigate?.('visits')} className="flex items-center justify-center gap-1.5 text-xs font-bold bg-white border border-[#e4eae4] text-gray-700 hover:bg-[#f5f7f5] rounded-xl py-2.5 transition-colors">View Reports</button>
                    <button onClick={() => onNavigate?.('library')} className="flex items-center justify-center gap-1.5 text-xs font-bold bg-white border border-[#e4eae4] text-gray-700 hover:bg-[#f5f7f5] rounded-xl py-2.5 transition-colors">View Knowledge</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricMini({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#f5f7f5] border border-[#e4eae4] rounded-xl p-2.5">
      <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
        <Icon size={11} /> {label}
      </p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}