/**
 * Geo-Farm Field Operations — Field Scout mock data
 * SIH26131: Early detection & management of crop diseases and pest infestations
 *
 * This is the frontend-demo "ground truth" data set for the Field Scout /
 * Agriculture Student portal. No backend exists yet — every value here is
 * realistic mock data standing in for what would come from the Geo-Farm
 * mission-assignment engine, smart traps, and microclimate sensors.
 */

export const SCOUT_PROFILE = {
  name: 'Aarav Patil',
  role: 'Agricultural Student',
  scoutId: 'GFS-AG-0248',
  college: 'Mahatma Phule Krishi Vidyapeeth',
  department: 'Agriculture',
  year: '3rd Year',
  district: 'Nashik',
  status: 'Verified',
  email: 'aarav.patil@mpkv.ac.in',
  studentId: 'AG2024-248',
  joined: 'Aug 2025',
  registeredLocation: 'Nashik, Maharashtra',
  registeredVillage: 'Dindori',
  registeredTaluka: 'Dindori',
  points: 1240,
  rank: 3,
  credits: 12,
  communityHours: 48,
  stats: {
    missionsCompleted: 24,
    reportsSubmitted: 22,
    reportsVerified: 19,
    verificationRate: 86,
    dataQuality: 92,
  },
};

export const MISSION_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EN_ROUTE: 'En Route',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  NEEDS_REVISIT: 'Needs Revisit',
  COMPLETED: 'Completed',
};

export const INITIAL_MISSIONS = [
  {
    id: 'GF-1042',
    title: 'Powdery Mildew Surveillance',
    location: 'Dindori, Nashik',
    fieldName: 'Dindori Grapevine Block A12',
    coords: [20.0571, 73.834],
    crop: 'Grapes',
    priority: 'HIGH',
    assignedLabel: 'Today, 9:00 AM',
    status: MISSION_STATUS.PENDING,
    distanceKm: 4.2,
    assignedBy: 'Agriculture Officer — Nashik Division',
    surveyType: 'Disease surveillance',
    cropStage: 'Flowering',
    lastObservation: '2 days ago',
    trapId: 'GF-TRAP-018',
    reason: {
      humidity: 87,
      leafWetness: 'Elevated',
      previousObservation: 'Powdery mildew symptoms',
      nearbyReports: 3,
      riskModel: 'HIGH',
    },
    recommendedChecks: [
      'Upper leaf surface',
      'Lower leaf surface',
      'Young shoots',
      'Fruit clusters',
    ],
  },
  {
    id: 'GF-1038',
    title: 'Fruit Fly Trap Inspection',
    location: 'Niphad, Nashik',
    fieldName: 'Niphad Grape Block C4',
    coords: [20.0844, 74.111],
    crop: 'Grapes',
    priority: 'MEDIUM',
    assignedLabel: 'Yesterday, 8:30 AM',
    status: MISSION_STATUS.COMPLETED,
    distanceKm: 11.6,
    assignedBy: 'Agriculture Officer — Nashik Division',
    surveyType: 'Pest trap inspection',
    cropStage: 'Fruit set',
    lastObservation: '5 days ago',
    trapId: 'GF-TRAP-011',
    reason: {
      humidity: 74,
      leafWetness: 'Moderate',
      previousObservation: 'Rising fruit fly catch',
      nearbyReports: 1,
      riskModel: 'MEDIUM',
    },
    recommendedChecks: ['Trap condition', 'Fruit clusters', 'Ripening fruit'],
  },
  {
    id: 'GF-1035',
    title: 'Onion Thrips Check',
    location: 'Sinnar, Nashik',
    fieldName: 'Sinnar Onion Plot B2',
    coords: [19.8496, 73.9866],
    crop: 'Onion',
    priority: 'LOW',
    assignedLabel: 'Tomorrow, 10:00 AM',
    status: MISSION_STATUS.ACCEPTED,
    distanceKm: 18.3,
    assignedBy: 'Agriculture Officer — Nashik Division',
    surveyType: 'Routine surveillance',
    cropStage: 'Bulb development',
    lastObservation: '9 days ago',
    trapId: null,
    reason: {
      humidity: 58,
      leafWetness: 'Low',
      previousObservation: 'No prior symptoms',
      nearbyReports: 0,
      riskModel: 'LOW',
    },
    recommendedChecks: ['Leaf tips', 'Neck region', 'Soil moisture'],
  },
];

export const TRAPS = {
  'GF-TRAP-018': {
    id: 'GF-TRAP-018',
    location: 'Dindori Block A12',
    crop: 'Grapes',
    type: 'Yellow Sticky Trap',
    lastScan: '2 days ago',
    battery: 78,
    lastSynced: '12 min ago',
    history: [
      { day: 'Day 1', count: 8 },
      { day: 'Day 3', count: 12 },
      { day: 'Day 5', count: 18 },
      { day: 'Day 7', count: 27 },
    ],
    previousTotal: 27,
  },
  'GF-TRAP-011': {
    id: 'GF-TRAP-011',
    location: 'Niphad Block C4',
    crop: 'Grapes',
    type: 'Yellow Sticky Trap',
    lastScan: '5 days ago',
    battery: 54,
    lastSynced: '2 hr ago',
    history: [
      { day: 'Day 1', count: 4 },
      { day: 'Day 3', count: 6 },
      { day: 'Day 5', count: 9 },
      { day: 'Day 7', count: 11 },
    ],
    previousTotal: 11,
  },
};

export const INITIAL_REPORTS = [
  {
    id: 'GF-RPT-1039',
    missionId: 'GF-1038',
    field: 'Niphad',
    crop: 'Grapes',
    finding: 'Fruit Fly',
    risk: 'MEDIUM',
    status: 'Verified',
    submittedAt: 'Yesterday, 11:20 AM',
    dataQuality: 90,
    aiConfidence: 81,
    trapCount: 11,
    trend: '+22%',
    photos: 3,
    timeline: [
      { time: '08:31', icon: 'pin', label: 'Field check-in' },
      { time: '08:34', icon: 'camera', label: 'Leaf image captured' },
      { time: '08:35', icon: 'ai', label: 'AI analysis completed' },
      { time: '08:37', icon: 'grad', label: 'Scout confirmed symptoms' },
      { time: '08:40', icon: 'trap', label: 'Smart trap scanned' },
      { time: '08:42', icon: 'chart', label: 'Risk recalculated' },
      { time: '08:45', icon: 'cloud', label: 'Report uploaded' },
      { time: '09:10', icon: 'gov', label: 'Verified by Agriculture Officer' },
    ],
  },
  {
    id: 'GF-RPT-1031',
    missionId: null,
    field: 'Sinnar',
    crop: 'Onion',
    finding: 'No major issue',
    risk: 'LOW',
    status: 'Verified',
    submittedAt: '4 days ago',
    dataQuality: 88,
    aiConfidence: 74,
    trapCount: null,
    trend: null,
    photos: 2,
    timeline: [
      { time: '10:02', icon: 'pin', label: 'Field check-in' },
      { time: '10:05', icon: 'camera', label: 'Leaf image captured' },
      { time: '10:06', icon: 'ai', label: 'AI analysis completed' },
      { time: '10:07', icon: 'grad', label: 'Scout confirmed: healthy' },
      { time: '10:09', icon: 'cloud', label: 'Report uploaded' },
      { time: '13:40', icon: 'gov', label: 'Verified by Agriculture Officer' },
    ],
  },
];

export const NOTIFICATIONS = [
  {
    id: 'N1',
    level: 'critical',
    title: 'High priority mission assigned',
    body: 'Powdery mildew surveillance required in Dindori.',
    time: '8:15 AM',
    read: false,
  },
  {
    id: 'N2',
    level: 'warning',
    title: 'Trap inspection due',
    body: 'Trap GF-TRAP-018 requires inspection today.',
    time: 'Yesterday',
    read: false,
  },
  {
    id: 'N3',
    level: 'info',
    title: 'Report reviewed',
    body: 'Your report GF-RPT-1039 was verified by the Agriculture Officer.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 'N4',
    level: 'success',
    title: 'Mission completed',
    body: 'Mission GF-1038 was successfully submitted.',
    time: '2 days ago',
    read: true,
  },
];

export const FIELD_GUIDE_SECTIONS = [
  {
    title: 'How to photograph a leaf',
    steps: [
      'Use natural light, not flash',
      'Keep the leaf in focus, fill the frame',
      'Capture both healthy and affected areas',
      'Avoid harsh shadows',
      'Include multiple leaves when possible',
    ],
  },
  {
    title: 'How to inspect a sticky trap',
    steps: [
      'Confirm the Trap ID before scanning',
      'Check trap condition and remaining stickiness',
      'Capture a full, well-lit trap image',
      'Ensure the image is clear and not blurred',
      'Review the AI pest count',
      'Confirm or correct the result',
    ],
  },
];

export const DISEASE_GUIDE = [
  {
    name: 'Powdery Mildew',
    crop: 'Grapes',
    symptoms: 'White powdery patches on upper leaf surface, curling of young leaves.',
    action: 'Improve canopy airflow, apply sulfur-based fungicide, report if spreading.',
  },
  {
    name: 'Downy Mildew',
    crop: 'Grapes',
    symptoms: 'Yellow oily patches on top of leaf, white downy growth underneath.',
    action: 'Remove affected leaves, apply copper-based fungicide, monitor humidity.',
  },
  {
    name: 'Leaf Spot',
    crop: 'Onion / Tomato',
    symptoms: 'Small brown or grey spots with yellow halo, spreading outward.',
    action: 'Remove infected foliage, avoid overhead irrigation, apply fungicide.',
  },
  {
    name: 'Wilting',
    crop: 'Cotton / Tomato',
    symptoms: 'Drooping leaves despite adequate soil moisture, stunted growth.',
    action: 'Check root zone and soil moisture, inspect for stem discoloration.',
  },
  {
    name: 'Pest Damage',
    crop: 'All crops',
    symptoms: 'Holes in leaves, feeding marks, visible larvae or insects.',
    action: 'Identify pest via trap data, note damage extent, escalate if severe.',
  },
];

export const SYMPTOM_OPTIONS = [
  'White powdery patches',
  'Leaf spots',
  'Yellowing',
  'Curling',
  'Wilting',
  'Holes / feeding damage',
  'Stem damage',
  'Fruit damage',
  'No visible symptoms',
  'Other',
];

/**
 * Phase 1 — Agricultural Student Portal mock data.
 * UI-only. No backend, GPS, camera, or AI integration yet.
 * Reuses INITIAL_MISSIONS as the source of truth for map/case links
 * (GF-1042, GF-1038, GF-1035) plus student-specific views below.
 */

export const NEARBY_CASES = [
  {
    id: 'GF-1042',
    farmer: 'Suresh Pawar',
    issue: 'Powdery Mildew — Grapes',
    village: 'Dindori, Nashik',
    distanceKm: 4.2,
    priority: 'HIGH',
    crop: 'Grapes',
    reportedAt: 'Today, 8:15 AM',
    // Main card image for the Nearby Cases list
    image: '/agriculture/grapes/vineyard.jpg',
  },
  {
    id: 'GF-1038',
    farmer: 'Anil Shinde',
    issue: 'Fruit Fly — Grapes',
    village: 'Niphad, Nashik',
    distanceKm: 11.6,
    priority: 'MEDIUM',
    crop: 'Grapes',
    reportedAt: 'Yesterday, 4:40 PM',
    // Main card image for the Nearby Cases list
    image: '/agriculture/grapes/fruit-fly.jpg',
  },
  {
    id: 'GF-RHR-201',
    farmer: 'Ravi Deshmukh',
    issue: 'Cotton Pest Alert — Rahuri',
    village: 'Rahuri, Ahilyanagar',
    distanceKm: 62,
    priority: 'HIGH',
    crop: 'Cotton',
    reportedAt: 'Today, 7:05 AM',
    // Main card image for the Nearby Cases list
    image: '/agriculture/cotton/cotton-pest.jpg',
  },
];

export const FARMER_REQUESTS = [
  {
    id: 'FR-301',
    farmer: 'Suresh Pawar',
    village: 'Dindori, Nashik',
    crop: 'Grapes',
    message: 'White powder on leaves spreading fast. Please visit today.',
    time: '35 min ago',
    urgent: true,
  },
  {
    id: 'FR-302',
    farmer: 'Meera Jadhav',
    village: 'Sinnar, Nashik',
    crop: 'Onion',
    message: 'Leaf tips drying. Need advice on spray schedule.',
    time: '2 hrs ago',
    urgent: false,
  },
];

export const STUDENT_PROGRESS = {
  visitsThisWeek: 4,
  visitsGoal: 6,
  casesResolved: 18,
  pendingVisits: 2,
  participationPct: 72,
  nextMilestone: 'Field Expert — 1500 pts',
  pointsToNext: 260,
};

export const LEADERBOARD = [
  { rank: 1, name: 'Priya Nair', college: 'MPKV Rahuri', points: 1480, visits: 31, casesAssisted: 27 },
  { rank: 2, name: 'Rahul Mane', college: 'MPKV Pune', points: 1355, visits: 28, casesAssisted: 24 },
  { rank: 3, name: 'Aarav Patil', college: 'Mahatma Phule Krishi Vidyapeeth', points: 1240, visits: 24, casesAssisted: 21, you: true },
  { rank: 4, name: 'Sneha Kulkarni', college: 'MPKV Nashik', points: 1180, visits: 22, casesAssisted: 19 },
  { rank: 5, name: 'Amit Thorat', college: 'MPKV Kolhapur', points: 1095, visits: 20, casesAssisted: 17 },
];

export const CERTIFICATES = [
  {
    id: 'GF-CERT-001',
    title: 'Field Survey Basics',
    student: 'Aarav Patil',
    achievement: 'Completed 10 verified field visits',
    issuer: 'Geo-Farm + MPKV',
    date: 'Jul 2026',
    credits: 4,
    status: 'Earned',
  },
  {
    id: 'GF-CERT-002',
    title: 'Pest Identification — Level 1',
    student: 'Aarav Patil',
    achievement: 'Identified 5 pest cases with evidence',
    issuer: 'Geo-Farm + MPKV',
    date: 'Aug 2026',
    credits: 4,
    status: 'Earned',
  },
  {
    id: 'GF-CERT-003',
    title: 'Community Field Service — 50 hrs',
    student: 'Aarav Patil',
    achievement: 'Log 50 community field-service hours',
    issuer: 'Geo-Farm',
    date: 'In progress',
    credits: 4,
    status: 'In Progress',
    progressPct: 78,
  },
];

export const KNOWLEDGE_SPOTLIGHT = [
  {
    name: 'Powdery Mildew',
    crop: 'Grapes',
    summary: 'White powdery patches, leaf curling. Check upper leaf surface first.',
  },
  {
    name: 'Fruit Fly',
    crop: 'Grapes',
    summary: 'Trap catch rising. Inspect ripening clusters and trap stickiness.',
  },
  {
    name: 'Cotton Bollworm',
    crop: 'Cotton',
    summary: 'Holes in bolls, larval feeding marks. Early morning inspection best.',
  },
];

export const CHAT_THREADS = [
  {
    id: 'CH-1',
    farmer: 'Suresh Pawar',
    village: 'Dindori',
    caseId: 'GF-1042',
    caseLabel: 'Powdery Mildew — Grapes',
    lastMessage: 'Sir, white powder increased since morning.',
    time: '10 min ago',
    unread: 2,
  },
  {
    id: 'CH-2',
    farmer: 'Anil Shinde',
    village: 'Niphad',
    caseId: 'GF-1038',
    caseLabel: 'Fruit Fly — Grapes',
    lastMessage: 'Trap photo sent. Please check.',
    time: '1 hr ago',
    unread: 0,
  },
  {
    id: 'CH-3',
    farmer: 'Meera Jadhav',
    village: 'Sinnar',
    caseId: null,
    caseLabel: 'Onion leaf-tip drying',
    lastMessage: 'Thank you for yesterday’s visit!',
    time: 'Yesterday',
    unread: 0,
  },
];

/**
 * Phase 2 — Nearby Cases detail (mock only, additive).
 * NEARBY_CASES above stays the list source (Dashboard + list screen).
 * This map adds per-case detail: AI diagnosis, symptoms, contact,
 * photo labels. No backend, no real upload.
 */
export const NEARBY_CASE_DETAILS = {
  'GF-1042': {
    problem: 'Powdery Mildew',
    aiDiagnosis: 'Powdery Mildew',
    aiConfidence: 87,
    symptoms: ['White powdery growth', 'Leaf curling', 'Reduced plant vigor'],
    farmerPhone: '+91 98220 4XXXX',
    photoLabels: ['Leaf close-up', 'Affected canopy', 'Whole vine row'],
    // Main field image shown in CaseDetail
    image: '/agriculture/grapes/vineyard.jpg',
    // Symptom close-ups: none curated yet — gallery shows labelled placeholders
    symptomImages: null,
  },
  'GF-1038': {
    problem: 'Fruit Fly',
    aiDiagnosis: 'Fruit Fly',
    aiConfidence: 82,
    symptoms: ['Fruit puncture marks', 'Premature fruit drop', 'Rising trap catch'],
    farmerPhone: '+91 94230 1XXXX',
    photoLabels: ['Trap close-up', 'Affected cluster'],
    // Main field image shown in CaseDetail
    image: '/agriculture/grapes/fruit-fly.jpg',
    // Symptom close-ups: none curated yet — gallery shows labelled placeholders
    symptomImages: null,
  },
  'GF-RHR-201': {
    problem: 'Cotton Pest Alert',
    aiDiagnosis: 'Cotton pest infestation',
    aiConfidence: 79,
    symptoms: ['Boll damage', 'Larval feeding marks', 'Leaf holes'],
    farmerPhone: '+91 98500 7XXXX',
    photoLabels: ['Damaged boll', 'Field overview'],
    // Main field image shown in CaseDetail
    image: '/agriculture/cotton/cotton-pest.jpg',
    // Symptom close-up images shown in the CaseDetail gallery
    symptomImages: ['/agriculture/cotton/cotton-pest.jpg'],
  },
};

/**
 * Master phase — Cluster / group farm visits (mock only).
 * Coordinates are demo positions near the case villages, not live GPS.
 */
export const CLUSTER_VISITS = [
  {
    id: 'CL-01',
    name: 'Dindori Grapevine Cluster',
    village: 'Dindori, Nashik',
    coords: [20.0621, 73.839],
    date: '24 September',
    time: '8:00 AM',
    organizer: 'Aarav Patil',
    participants: 12,
    maxParticipants: 15,
    focus: 'Powdery Mildew sweep across Block A12',
    farmers: ['Suresh Pawar', 'Vikas More'],
  },
  {
    id: 'CL-02',
    name: 'Niphad Trap Inspection Drive',
    village: 'Niphad, Nashik',
    coords: [20.0894, 74.116],
    date: '26 September',
    time: '7:30 AM',
    organizer: 'Priya Nair',
    participants: 8,
    maxParticipants: 15,
    focus: 'Fruit fly sticky-trap checks in Block C4',
    farmers: ['Anil Shinde'],
  },
];

/**
 * Master phase — Knowledge Library articles (educational reference only).
 * Not professional agricultural advice — confirm with a college mentor
 * or agriculture officer before acting in the field.
 */
export const KNOWLEDGE_CATEGORIES = [
  'All',
  'Crops',
  'Diseases',
  'Pests',
  'Treatments',
  'Field Identification',
  'Quick Reference',
];

export const KNOWLEDGE_LIBRARY = [
  {
    id: 'KB-01',
    title: 'Powdery Mildew',
    crop: 'Grapes',
    category: 'Diseases',
    symptoms: ['White powdery growth', 'Leaf curling', 'Reduced plant vigor'],
    identification: 'Look for white powdery patches on upper leaf surfaces early morning; check young shoots first.',
    treatment: 'Reference: improve canopy airflow by pruning; sulfur-based fungicide is the standard reference option.',
    prevention: 'Reference: prune for airflow, avoid excess nitrogen, and rotate fungicide modes of action per label.',
    image: '/agriculture/grapes/vineyard.jpg',
    fieldNotes: 'Photograph both healthy and affected leaves in natural light for comparison.',
  },
  {
    id: 'KB-02',
    title: 'Fruit Fly',
    crop: 'Grapes',
    category: 'Pests',
    symptoms: ['Fruit puncture marks', 'Premature fruit drop', 'Rising trap catch'],
    identification: 'Inspect ripening clusters for tiny punctures; confirm with yellow sticky-trap counts.',
    treatment: 'Reference: timely harvest of ripe fruit plus bait traps are the standard reference options.',
    prevention: 'Reference: destroy fallen fruit promptly and keep traps serviced through harvest.',
    image: '/agriculture/grapes/fruit-fly.jpg',
    fieldNotes: 'Record trap ID and count on every visit to track the trend.',
  },
  {
    id: 'KB-03',
    title: 'Cotton Bollworm',
    crop: 'Cotton',
    category: 'Pests',
    symptoms: ['Holes in bolls', 'Larval feeding marks', 'Leaf holes'],
    identification: 'Check bolls early morning for entry holes and frass near the damage.',
    treatment: 'Reference: pheromone traps for monitoring; escalate severe blocks to the agriculture officer.',
    prevention: 'Reference: scout twice weekly in flowering and preserve beneficial insects by spraying only on threshold.',
    image: '/agriculture/cotton/cotton-pest.jpg',
    fieldNotes: 'Early-morning inspection finds larvae before they hide from midday heat.',
  },
  {
    id: 'KB-04',
    title: 'Onion Thrips',
    crop: 'Onion',
    category: 'Pests',
    symptoms: ['Silvery leaf streaks', 'Leaf-tip drying', 'Stunted bulbs'],
    identification: 'Tap leaves over white paper — tiny yellow-black thrips become visible.',
    treatment: 'Reference: blue sticky traps for monitoring; avoid overhead irrigation during outbreaks.',
    prevention: 'Reference: rotate onion with non-host crops and manage field-edge weeds that host thrips.',
    image: null,
    fieldNotes: 'Check the leaf neck region where thrips shelter.',
  },
  {
    id: 'KB-05',
    title: 'Sulfur Spray Basics',
    crop: 'Grapes',
    category: 'Treatments',
    symptoms: ['Preventive schedule', 'Dosage reference', 'Safety gear'],
    identification: 'Match the spray schedule to flowering and fruit-set stages on the label.',
    treatment: 'Reference: always follow the product label dose; wear gloves and mask during application.',
    prevention: 'Reference: calibrate sprayers each season and respect pre-harvest intervals on the label.',
    image: '/agriculture/grapes/vineyard.jpg',
    fieldNotes: 'Never spray in peak afternoon heat; prefer early morning or late evening.',
  },
  {
    id: 'KB-06',
    title: 'Reading a Sticky Trap',
    crop: 'All crops',
    category: 'Field Identification',
    symptoms: ['Uneven insect spread', 'Dust-covered surface', 'Full trap'],
    identification: 'Divide the trap into quarters and count one quarter to estimate the total.',
    treatment: 'Reference: replace traps when the surface is full or no longer sticky.',
    prevention: 'Reference: place traps just above canopy height and replace on a fixed weekly schedule.',
    image: null,
    fieldNotes: 'Confirm the Trap ID before scanning so counts attach to the right field.',
  },
  {
    id: 'KB-07',
    title: 'Soil Moisture by Hand',
    crop: 'All crops',
    category: 'Quick Reference',
    symptoms: ['Dry crumbly soil', 'Waterlogged patches', 'Wilting despite watering'],
    identification: 'Squeeze a fistful of soil: it should hold shape briefly, then crumble.',
    treatment: 'Reference: mulch open beds to hold moisture between irrigations.',
    prevention: 'Reference: level beds for even water spread and irrigate in the cool hours.',
    image: null,
    fieldNotes: 'Check moisture at root depth (10–15 cm), not just the surface.',
  },
  {
    id: 'KB-08',
    title: 'Thompson Seedless Growth Stages',
    crop: 'Grapes',
    category: 'Crops',
    symptoms: ['Bud break', 'Flowering', 'Fruit set', 'Veraison'],
    identification: 'Note the dominant stage across the block — mixed stages are normal at edges.',
    treatment: 'Reference: align surveillance intensity with flowering and fruit-set windows.',
    prevention: 'Reference: keep written stage records each season to compare year-on-year timing.',
    image: '/agriculture/grapes/vineyard.jpg',
    fieldNotes: 'Record variety and stage on every visit; officers use it to prioritize cases.',
  },
  {
    id: 'KB-09',
    title: 'Leafhopper',
    crop: 'Cotton',
    category: 'Pests',
    symptoms: ['Round feeding holes', 'Brown leaf margins', 'Visible hopper insects'],
    identification: 'Look for wedge-shaped hoppers that jump when disturbed; round shot-holes with brown edges.',
    treatment: 'Reference: yellow sticky traps for monitoring; escalate heavy infestation to the agriculture officer.',
    prevention: 'Reference: remove weed hosts around the field and avoid excess nitrogen that attracts hoppers.',
    image: '/agriculture/pests/leafhopper.jpg',
    fieldNotes: 'Approach slowly — leafhoppers jump away when shadows fall on the leaf.',
  },
];

// Prototype farmer estimates — NOT official government data. Replace with verified census when available.
export const FARMER_ESTIMATES = {
  Ahmednagar: 156000,
  Akola: 98000,
  Amravati: 112000,
  Aurangabad: 134000,
  Bhandara: 87000,
  Bid: 121000,
  Buldana: 105000,
  Chandrapur: 93000,
  Dhule: 102000,
  Garhchiroli: 68000,
  Gondiya: 79000,
  'Greater Bombay': 45000,
  Hingoli: 76000,
  Jalgaon: 142000,
  Jalna: 88000,
  Kolhapur: 165000,
  Latur: 110000,
  Nagpur: 148000,
  Nanded: 128000,
  Nandurbar: 82000,
  Nashik: 218000,
  Osmanabad: 95000,
  Parbhani: 90000,
  Pune: 194000,
  Raigarh: 108000,
  Ratnagiri: 74000,
  Sangli: 138000,
  Satara: 125000,
  Sindhudurg: 62000,
  Solapur: 171000,
  Thane: 132000,
  Wardha: 85000,
  Washim: 71000,
  Yavatmal: 118000,
};
