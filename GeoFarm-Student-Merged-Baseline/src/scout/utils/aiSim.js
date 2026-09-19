/**
 * Geo-Farm — Field Scout AI simulation helpers
 *
 * Frontend-demo layer only. No real inference happens here — these
 * functions simulate advisory AI output so the field-survey and
 * smart-trap-scan workflows can be demonstrated end-to-end without a
 * backend. Every result is explicitly framed as advisory and requiring
 * scout verification, matching Geo-Farm's real product workflow.
 */

// Simulated leaf-disease classification. In production this would call
// the Geo-Farm disease-detection model; here it returns a fixed,
// realistic result so the demo narrative stays consistent.
export function simulateLeafAnalysis() {
  return {
    primary: { label: 'Powdery Mildew', confidence: 87 },
    alternatives: [
      { label: 'Downy Mildew', confidence: 8 },
      { label: 'Healthy Leaf', confidence: 5 },
    ],
  };
}

// Simulated smart-trap camera pest count. Returns a per-species
// breakdown plus a total, with a small amount of run-to-run variation
// so re-scanning doesn't look perfectly static.
export function simulateTrapScan(previousTotal = 18) {
  const counts = {
    'Fruit Fly': 27,
    Leafhopper: 6,
    'Other insects': 4,
    Unknown: 2,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const changePct = previousTotal
    ? Math.round(((total - previousTotal) / previousTotal) * 100)
    : 0;
  return { counts, total, previousTotal, changePct };
}

// Combines image findings + trap trend + microclimate + prior
// observations into a single field-risk score, in the same spirit as
// the officer-side risk model used elsewhere in Geo-Farm.
export function computeFieldRisk({ trapChangePct, humidity, hasSymptoms, nearbyReports }) {
  let score = 20;
  if (trapChangePct >= 80) score += 30;
  else if (trapChangePct >= 30) score += 18;
  else if (trapChangePct > 0) score += 8;

  if (humidity >= 85) score += 20;
  else if (humidity >= 70) score += 10;

  if (hasSymptoms) score += 20;
  if (nearbyReports >= 3) score += 10;
  else if (nearbyReports >= 1) score += 5;

  score = Math.min(98, score);

  let level = 'LOW';
  if (score >= 70) level = 'HIGH';
  else if (score >= 45) level = 'MODERATE';

  const signals = [];
  if (trapChangePct > 0) signals.push({ icon: 'bug', text: `Pest population ↑ ${trapChangePct}%` });
  if (humidity >= 70) signals.push({ icon: 'humidity', text: 'Humidity elevated' });
  if (hasSymptoms) signals.push({ icon: 'leaf', text: 'Leaf symptoms detected' });
  if (nearbyReports > 0) signals.push({ icon: 'reports', text: 'Nearby reports increasing' });

  return { score, level, signals };
}

// Data-quality score for a submitted report — encourages scouts to
// capture complete, well-evidenced field data rather than partial forms.
export function computeDataQuality({ gps, timestamp, requiredFieldsComplete, photoQualityGood, trapVerified, severityRecorded }) {
  const checks = [
    { label: 'GPS captured', pass: !!gps },
    { label: 'Timestamp captured', pass: !!timestamp },
    { label: 'Required fields complete', pass: !!requiredFieldsComplete },
    { label: 'Good image quality', pass: !!photoQualityGood },
    { label: 'Trap ID verified', pass: trapVerified !== false },
  ];
  if (severityRecorded !== undefined) {
    checks.push({ label: 'Severity & spread recorded', pass: !!severityRecorded });
  }
  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  return { score, checks };
}
