/**
 * Mock Maharashtra district agricultural intelligence.
 * Structured for easy swap to API: getDistrictIntelligence() will
 * later fetch from Python/FastAPI ML service.
 */

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function riskLevel(score) {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

// Curated overrides for districts that match existing student cases
const OVERRIDES = {
  Nashik: { overallRisk: 78, pestRisk: 72, diseaseRisk: 84, waterStress: 41, yieldIndex: 76, crop: 'Grapes' },
  Ahmednagar: { overallRisk: 74, pestRisk: 78, diseaseRisk: 62, waterStress: 55, yieldIndex: 68, crop: 'Cotton' },
  Pune: { overallRisk: 62, pestRisk: 55, diseaseRisk: 68, waterStress: 38, yieldIndex: 81 },
};

const CROP_POOL = ['Grapes', 'Cotton', 'Onion', 'Soybean', 'Sugarcane', 'Wheat'];

export function generateMockIntelligence() {
  // We generate for the 34 known Maharashtra districts from the GeoJSON.
  // If called without args, returns a map keyed by district NAME_2.
  const districts = [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Bhandara', 'Bid', 'Buldana', 'Chandrapur',
    'Dhule', 'Garhchiroli', 'Gondiya', 'Greater Bombay', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
    'Latur', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Parbhani', 'Pune',
    'Raigarh', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
  ];

  const map = {};
  for (const name of districts) {
    const o = OVERRIDES[name];
    if (o) {
      map[name] = { district: name, riskLevel: riskLevel(o.overallRisk), ...o };
      continue;
    }
    const h = hash(name);
    const overallRisk = 18 + (h % 65); // 18-82
    const pestRisk = 15 + ((h >> 3) % 70);
    const diseaseRisk = 15 + ((h >> 6) % 70);
    const waterStress = 12 + ((h >> 9) % 68);
    const yieldIndex = 48 + ((h >> 11) % 48);
    const crop = CROP_POOL[h % CROP_POOL.length];
    map[name] = {
      district: name,
      overallRisk,
      riskLevel: riskLevel(overallRisk),
      pestRisk,
      diseaseRisk,
      waterStress,
      yieldIndex,
      crop,
    };
  }
  return map;
}

// The singleton used by UI today; later this becomes a fetch wrapper.
export const MOCK_DISTRICT_INTELLIGENCE = generateMockIntelligence();

/**
 * Fetch from FastAPI ML service with graceful fallback to the in-file
 * mock map. The 3D map never white-screens if the service is down.
 */
export async function getDistrictIntelligence() {
  try {
    const res = await fetch('http://localhost:8000/districts', { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = await res.json();
    // Array → map keyed by district, preserving shape expected by map
    const map = {};
    for (const d of arr) {
      // Basic shape validation — skip malformed entries
      if (!d.district || typeof d.overallRisk !== 'number') continue;
      map[d.district] = d;
    }
    // Ensure we got the 34 districts; otherwise fall back to full mock
    if (Object.keys(map).length < 10) throw new Error('too few districts');
    return map;
  } catch {
    return MOCK_DISTRICT_INTELLIGENCE;
  }
}

export function riskColor(level, alpha = 255) {
  // Returns [r,g,b,a] for deck.gl
  switch (level) {
    case 'HIGH': return [220, 38, 38, alpha]; // red
    case 'MEDIUM': return [245, 158, 11, alpha]; // amber
    case 'LOW': return [16, 122, 80, alpha]; // teal/green
    default: return [100, 116, 139, alpha];
  }
}

export function scoreToLevel(score) {
  return riskLevel(score);
}
