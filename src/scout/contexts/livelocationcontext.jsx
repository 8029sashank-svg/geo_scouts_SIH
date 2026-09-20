import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { haversine } from '../utils/geo.js';

const LiveLocationContext = createContext(null);

export function LiveLocationProvider({ children }) {
  const [status, setStatus] = useState('idle');
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const watchIdRef = useRef(null);
  const lastRef = useRef(null);
  const timerRef = useRef(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (_e) { /* ignore */ }
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation not supported');
      return;
    }
    setStatus('requesting');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ latitude, longitude, accuracy, timestamp: pos.timestamp });
        setStatus('active');
        setError(null);
      },
      (err) => {
        if (err.code === 1) { setStatus('denied'); setError('Permission denied'); }
        else if (err.code === 2) { setStatus('unavailable'); setError('Position unavailable'); }
        else { setStatus('error'); setError(err.message || 'GPS error'); }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation not supported');
      return;
    }
    setStatus('requesting');
    setError(null);
    setStartTime(Date.now());
    setDistance(0);
    setPoints([]);
    lastRef.current = null;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const cur = { latitude, longitude, accuracy, timestamp: pos.timestamp };
        setCoords(cur);
        setStatus('active');
        setPoints((prev) => {
          const next = [...prev, cur];
          return next.length > 200 ? next.slice(-200) : next;
        });
        if (lastRef.current) {
          const d = haversine(lastRef.current.latitude, lastRef.current.longitude, latitude, longitude);
          if (d < 500 && accuracy != null && accuracy < 100) setDistance((p) => p + d);
        }
        lastRef.current = cur;
      },
      (err) => {
        if (err.code === 1) { setStatus('denied'); setError('Permission denied'); }
        else if (err.code === 2) { setStatus('unavailable'); setError('Position unavailable'); }
        else { setStatus('error'); setError(err.message || 'GPS error'); }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    watchIdRef.current = id;
  }, []);

  const stopTracking = useCallback(() => {
    clearWatch();
    setStatus((s) => (s === 'active' || s === 'requesting' ? 'stopped' : s));
  }, [clearWatch]);

  const clearLocation = useCallback(() => {
    clearWatch();
    setStatus('idle');
    setCoords(null);
    setError(null);
    setDistance(0);
    setPoints([]);
    setStartTime(null);
    setElapsed(0);
    lastRef.current = null;
  }, [clearWatch]);

  useEffect(() => {
    if (status !== 'active' && status !== 'requesting') return;
    if (!startTime) return;
    const t = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(t);
  }, [status, startTime]);

  useEffect(() => () => clearWatch(), [clearWatch]);

  const value = {
    status, coords, error, distance, points, startTime, elapsed,
    requestLocation, startTracking, stopTracking, clearLocation,
    isActive: status === 'active',
    hasLocation: !!coords,
  };

  return <LiveLocationContext.Provider value={value}>{children}</LiveLocationContext.Provider>;
}

export function useLiveLocationShared() {
  const ctx = useContext(LiveLocationContext);
  if (!ctx) throw new Error('useLiveLocationShared must be used within LiveLocationProvider');
  return ctx;
}

export default LiveLocationContext;