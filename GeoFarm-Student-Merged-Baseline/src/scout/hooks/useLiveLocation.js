import { useCallback, useEffect, useRef, useState } from 'react';
import { haversine } from '../utils/geo.js';

/**
 * Live GPS tracking for field visits — uses watchPosition only while active.
 * States: idle, requesting, active, denied, unavailable, error, stopped
 */
export default function useLiveLocation() {
  const [status, setStatus] = useState('idle');
  const [coords, setCoords] = useState(null); // { latitude, longitude, accuracy, timestamp }
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
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch (_e) { /* ignore */ }
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
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
        const timestamp = pos.timestamp;
        const cur = { latitude, longitude, accuracy, timestamp };
        setCoords(cur);
        setStatus('active');
        setPoints((prev) => {
          const next = [...prev, cur];
          // keep last 200 points for track
          return next.length > 200 ? next.slice(-200) : next;
        });
        if (lastRef.current) {
          const d = haversine(lastRef.current.latitude, lastRef.current.longitude, latitude, longitude);
          // ignore jumps > 500m (likely GPS glitch) and accuracy > 100m
          if (d < 500 && accuracy != null && accuracy < 100) {
            setDistance((prev) => prev + d);
          }
        }
        lastRef.current = cur;
      },
      (err) => {
        if (err.code === 1) {
          setStatus('denied');
          setError('Permission denied');
        } else if (err.code === 2) {
          setStatus('unavailable');
          setError('Position unavailable');
        } else if (err.code === 3) {
          setStatus('error');
          setError('Timeout');
        } else {
          setStatus('error');
          setError(err.message || 'GPS error');
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    watchIdRef.current = id;

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - (startTime || Date.now()));
    }, 1000);
    // Fix startTime reference for timer
    setElapsed(0);
  }, [startTime]);

  // Keep elapsed updated from startTime
  useEffect(() => {
    if (status !== 'active' && status !== 'requesting') return;
    if (!startTime) return;
    const t = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(t);
  }, [status, startTime]);

  const stop = useCallback(() => {
    clearWatch();
    setStatus((s) => (s === 'active' || s === 'requesting' ? 'stopped' : s));
  }, [clearWatch]);

  const reset = useCallback(() => {
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

  useEffect(() => () => clearWatch(), [clearWatch]);

  return {
    status,
    coords,
    error,
    distance,
    points,
    startTime,
    elapsed,
    start,
    stop,
    reset,
    isActive: status === 'active',
  };
}