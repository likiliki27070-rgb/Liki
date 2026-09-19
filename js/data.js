// Data models, Network definitions, and initial states for Quantum Traffic

window.TRAFFIC_DATA = {
  intersections: [
    {
      id: "I1",
      name: "Downtown West",
      district: "Financial & Commerce",
      x: -32,
      z: -22,
      lat: 37.7915,
      lon: -122.4095,
      density: 68,
      queueLength: 22,
      vehicleCount: 48,
      capacity: 1200,
      phase: "GREEN_NS",
      phaseTimer: 18,
      classicalTiming: { red: 40, yellow: 5, green: 25 },
      optimizedTiming: { red: 26, yellow: 5, green: 44 },
      currentTiming: { red: 40, yellow: 5, green: 25 },
      neighbors: ["I2", "I3", "I7"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 46
    },
    {
      id: "I2",
      name: "Uptown Tech",
      district: "Innovation Corridor",
      x: 32,
      z: -22,
      lat: 37.7915,
      lon: -122.3935,
      density: 54,
      queueLength: 16,
      vehicleCount: 36,
      capacity: 1100,
      phase: "GREEN_EW",
      phaseTimer: 12,
      classicalTiming: { red: 38, yellow: 5, green: 27 },
      optimizedTiming: { red: 30, yellow: 5, green: 40 },
      currentTiming: { red: 38, yellow: 5, green: 27 },
      neighbors: ["I1", "I4", "I7"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 39
    },
    {
      id: "I3",
      name: "Civic Center",
      district: "Government & Culture",
      x: -32,
      z: 0,
      lat: 37.7855,
      lon: -122.4095,
      density: 76,
      queueLength: 28,
      vehicleCount: 62,
      capacity: 1300,
      phase: "GREEN_NS",
      phaseTimer: 9,
      classicalTiming: { red: 42, yellow: 5, green: 23 },
      optimizedTiming: { red: 24, yellow: 5, green: 46 },
      currentTiming: { red: 42, yellow: 5, green: 23 },
      neighbors: ["I1", "I4", "I5"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 52
    },
    {
      id: "I4",
      name: "Central Square",
      district: "Retail & Transit Hub",
      x: 32,
      z: 0,
      lat: 37.7855,
      lon: -122.3935,
      density: 84,
      queueLength: 38,
      vehicleCount: 78,
      capacity: 1400,
      phase: "RED",
      phaseTimer: 28,
      classicalTiming: { red: 45, yellow: 5, green: 20 },
      optimizedTiming: { red: 22, yellow: 5, green: 48 },
      currentTiming: { red: 45, yellow: 5, green: 20 },
      neighbors: ["I2", "I3", "I6"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 61
    },
    {
      id: "I5",
      name: "Harbor District",
      district: "Port & Logistics",
      x: -32,
      z: 22,
      lat: 37.7795,
      lon: -122.4095,
      density: 48,
      queueLength: 12,
      vehicleCount: 30,
      capacity: 1000,
      phase: "GREEN_EW",
      phaseTimer: 16,
      classicalTiming: { red: 35, yellow: 5, green: 30 },
      optimizedTiming: { red: 32, yellow: 5, green: 38 },
      currentTiming: { red: 35, yellow: 5, green: 30 },
      neighbors: ["I3", "I6", "I8"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 34
    },
    {
      id: "I6",
      name: "Medical Center",
      district: "Healthcare & University Hospital",
      x: 32,
      z: 22,
      lat: 37.7795,
      lon: -122.3935,
      density: 62,
      queueLength: 19,
      vehicleCount: 44,
      capacity: 1250,
      phase: "GREEN_NS",
      phaseTimer: 21,
      classicalTiming: { red: 40, yellow: 5, green: 25 },
      optimizedTiming: { red: 25, yellow: 5, green: 45 },
      currentTiming: { red: 40, yellow: 5, green: 25 },
      neighbors: ["I4", "I5", "I8"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 44
    },
    {
      id: "I7",
      name: "Innovation Gateway North",
      district: "Silicon High-Tech & Research Campus",
      x: 0,
      z: -44,
      lat: 37.7965,
      lon: -122.4015,
      density: 58,
      queueLength: 18,
      vehicleCount: 42,
      capacity: 1200,
      phase: "GREEN_EW",
      phaseTimer: 15,
      classicalTiming: { red: 38, yellow: 5, green: 27 },
      optimizedTiming: { red: 28, yellow: 5, green: 42 },
      currentTiming: { red: 38, yellow: 5, green: 27 },
      neighbors: ["I1", "I2"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 38
    },
    {
      id: "I8",
      name: "Grand Central Terminal South",
      district: "Avengers HQ & Intermodal Plaza",
      x: 0,
      z: 44,
      lat: 37.7745,
      lon: -122.4015,
      density: 74,
      queueLength: 32,
      vehicleCount: 68,
      capacity: 1500,
      phase: "GREEN_NS",
      phaseTimer: 18,
      classicalTiming: { red: 42, yellow: 5, green: 23 },
      optimizedTiming: { red: 24, yellow: 5, green: 46 },
      currentTiming: { red: 42, yellow: 5, green: 23 },
      neighbors: ["I5", "I6"],
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 54
    }
  ],

  roads: [
    { id: "R_1_2", from: "I1", to: "I2", length: 64, lanes: 2, speedLimit: 50, flow: 860, capacity: 1200, closed: false, congestion: "medium" },
    { id: "R_1_3", from: "I1", to: "I3", length: 44, lanes: 2, speedLimit: 50, flow: 940, capacity: 1200, closed: false, congestion: "high" },
    { id: "R_2_4", from: "I2", to: "I4", length: 44, lanes: 2, speedLimit: 50, flow: 820, capacity: 1200, closed: false, congestion: "medium" },
    { id: "R_3_4", from: "I3", to: "I4", length: 64, lanes: 3, speedLimit: 60, flow: 1350, capacity: 1600, closed: false, congestion: "critical" },
    { id: "R_3_5", from: "I3", to: "I5", length: 44, lanes: 2, speedLimit: 50, flow: 680, capacity: 1200, closed: false, congestion: "low" },
    { id: "R_4_6", from: "I4", to: "I6", length: 44, lanes: 2, speedLimit: 50, flow: 1100, capacity: 1300, closed: false, congestion: "high" },
    { id: "R_5_6", from: "I5", to: "I6", length: 64, lanes: 2, speedLimit: 50, flow: 710, capacity: 1200, closed: false, congestion: "low" },
    { id: "R_1_7", from: "I1", to: "I7", length: 42, lanes: 2, speedLimit: 50, flow: 780, capacity: 1200, closed: false, congestion: "medium" },
    { id: "R_7_2", from: "I7", to: "I2", length: 42, lanes: 2, speedLimit: 50, flow: 750, capacity: 1200, closed: false, congestion: "medium" },
    { id: "R_5_8", from: "I5", to: "I8", length: 42, lanes: 2, speedLimit: 50, flow: 890, capacity: 1300, closed: false, congestion: "high" },
    { id: "R_8_6", from: "I8", to: "I6", length: 42, lanes: 2, speedLimit: 50, flow: 920, capacity: 1300, closed: false, congestion: "high" }
  ],

  geoapify: {
    apiKey: "b5a852f6b97e420ab0850cc32c31c9d9",
    routingKey: "b5a852f6b97e420ab0850cc32c31c9d9",
    isolineKey: "5557e9758dbf492abbc58c3de058f972",
    geocodingKey: "b5a852f6b97e420ab0850cc32c31c9d9",
    reverseKey: "b9a95414ae8a4dd3b9d2f97ae2fc0546",
    autocompleteKey: "509e607576bb4c1d94ee7f92dce287da",
    tileUrl: "https://maps.geoapify.com/v1/tile/{style}/{z}/{x}/{y}.png?apiKey=b5a852f6b97e420ab0850cc32c31c9d9",
    routingUrl: "https://api.geoapify.com/v1/routing?waypoints={waypoints}&mode={mode}&apiKey=b5a852f6b97e420ab0850cc32c31c9d9",
    isolineUrl: "https://api.geoapify.com/v1/isoline?lat={lat}&lon={lon}&type={type}&mode={mode}&range={range}&apiKey=5557e9758dbf492abbc58c3de058f972",
    styles: ["osm-bright", "positron", "dark-matter", "osm-liberty", "klokantech-basic"],
    defaultStyle: "osm-bright",
    center: [37.7855, -122.4015],
    zoom: 14
  },

  emergencyRoute: ["I1", "I3", "I4", "I6"],

  weights: {
    waitingTime: 0.30,
    queueLength: 0.20,
    emergencyPriority: 0.20,
    throughput: 0.15,
    fuelEconomy: 0.10,
    co2Emissions: 0.05
  },

  qaoaSettings: {
    layers: 2,
    optimizer: "COBYLA",
    maxIterations: 80,
    shots: 2048,
    classicalPolish: true
  },

  baselineMetrics: {
    waitingTime: 54.2,      // seconds
    queueLength: 22.4,      // vehicles
    throughput: 1180,       // veh/hr
    fuelConsumption: 96.5,  // L/hr
    co2Emissions: 224.8,    // kg/hr
    emergencyTravelTime: 7.2 // minutes
  },
  optimizedMetrics: {
    waitingTime: 41.8,      // seconds (-22.9%)
    queueLength: 14.1,      // vehicles (-37.1%)
    throughput: 1420,       // veh/hr (+20.3%)
    fuelConsumption: 82.3,  // L/hr (-14.7%)
    co2Emissions: 189.6,    // kg/hr (-15.7%)
    emergencyTravelTime: 4.8 // minutes (-33.3%, saving 2.4 min)
  }
};

window.GLOBAL_CITIES = {
  coimbatore: {
    id: "coimbatore",
    name: "Coimbatore",
    country: "India",
    region: "Tamil Nadu",
    flag: "🇮🇳",
    lat: 11.0168,
    lon: 76.9558,
    zoom: 14,
    description: "Manchester of South India & Industrial Engineering Smart Corridor",
    population: "2.8M",
    vehicles: "1.4M Daily",
    quantumAdvantage: "+28.4% Flow",
    center: [11.0168, 76.9558],
    intersections: [
      { id: "I1", name: "Avinashi Road Jn", district: "IT & Aerospace Corridor", x: -32, z: -22, lat: 11.0268, lon: 76.9680, density: 72, queueLength: 26, vehicleCount: 52, capacity: 1300, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 48 },
      { id: "I2", name: "Gandhipuram Signal", district: "Central Commercial Core", x: 32, z: -22, lat: 11.0268, lon: 76.9840, density: 82, queueLength: 34, vehicleCount: 72, capacity: 1500, phase: "GREEN_EW", phaseTimer: 12, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 58 },
      { id: "I3", name: "RS Puram DB Road", district: "Retail & Residential Hub", x: -32, z: 0, lat: 11.0168, lon: 76.9558, density: 64, queueLength: 20, vehicleCount: 46, capacity: 1200, phase: "GREEN_NS", phaseTimer: 10, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 24, yellow: 5, green: 46 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 42 },
      { id: "I4", name: "Town Hall Junction", district: "Heritage & Transit Terminal", x: 32, z: 0, lat: 11.0168, lon: 76.9718, density: 86, queueLength: 40, vehicleCount: 82, capacity: 1450, phase: "RED", phaseTimer: 25, classicalTiming: { red: 45, yellow: 5, green: 20 }, optimizedTiming: { red: 22, yellow: 5, green: 48 }, currentTiming: { red: 45, yellow: 5, green: 20 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 65 },
      { id: "I5", name: "Ukkadam Flyover Link", district: "South Lake Gateway", x: -32, z: 22, lat: 11.0068, lon: 76.9558, density: 56, queueLength: 16, vehicleCount: 38, capacity: 1100, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 36, yellow: 5, green: 29 }, optimizedTiming: { red: 30, yellow: 5, green: 40 }, currentTiming: { red: 36, yellow: 5, green: 29 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 36 },
      { id: "I6", name: "Singanallur Medical Hub", district: "Healthcare & Arterial Ring", x: 32, z: 22, lat: 11.0068, lon: 76.9718, density: 70, queueLength: 24, vehicleCount: 54, capacity: 1250, phase: "GREEN_NS", phaseTimer: 20, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 46 },
      { id: "I7", name: "Saravanampatti Tech Zone", district: "Special Economic Zone", x: 0, z: -44, lat: 11.0368, lon: 76.9638, density: 60, queueLength: 19, vehicleCount: 44, capacity: 1200, phase: "GREEN_EW", phaseTimer: 14, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 40 },
      { id: "I8", name: "Podanur Railway Terminal", district: "Southern Rail Hub", x: 0, z: 44, lat: 10.9968, lon: 76.9638, density: 68, queueLength: 22, vehicleCount: 49, capacity: 1350, phase: "GREEN_NS", phaseTimer: 17, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 45 }
    ]
  },

  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    country: "India",
    region: "Karnataka",
    flag: "🇮🇳",
    lat: 12.9716,
    lon: 77.5946,
    zoom: 13,
    description: "Silicon Valley of India & High-Density Tech Corridors",
    population: "13.2M",
    vehicles: "8.5M Daily",
    quantumAdvantage: "+34.2% Flow",
    center: [12.9716, 77.5946],
    intersections: [
      { id: "I1", name: "Silk Board Jn", district: "Outer Ring Road South", x: -32, z: -22, lat: 12.9176, lon: 77.6234, density: 92, queueLength: 48, vehicleCount: 96, capacity: 1800, phase: "GREEN_NS", phaseTimer: 22, classicalTiming: { red: 50, yellow: 5, green: 20 }, optimizedTiming: { red: 28, yellow: 5, green: 52 }, currentTiming: { red: 50, yellow: 5, green: 20 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 78 },
      { id: "I2", name: "Koramangala 80ft", district: "Startup Hub & Dining", x: 32, z: -22, lat: 12.9345, lon: 77.6265, density: 75, queueLength: 28, vehicleCount: 65, capacity: 1400, phase: "GREEN_EW", phaseTimer: 14, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 52 },
      { id: "I3", name: "Indiranagar 100ft", district: "Commercial & Metro Hub", x: -32, z: 0, lat: 12.9784, lon: 77.6408, density: 80, queueLength: 32, vehicleCount: 74, capacity: 1500, phase: "GREEN_NS", phaseTimer: 12, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 59 },
      { id: "I4", name: "MG Road Trinity", district: "Central Business District", x: 32, z: 0, lat: 12.9738, lon: 77.6163, density: 85, queueLength: 36, vehicleCount: 82, capacity: 1600, phase: "RED", phaseTimer: 24, classicalTiming: { red: 45, yellow: 5, green: 20 }, optimizedTiming: { red: 24, yellow: 5, green: 46 }, currentTiming: { red: 45, yellow: 5, green: 20 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 66 },
      { id: "I5", name: "Electronic City Gate", district: "Tech Park Mega Zone", x: -32, z: 22, lat: 12.8399, lon: 77.6770, density: 78, queueLength: 30, vehicleCount: 68, capacity: 1600, phase: "GREEN_EW", phaseTimer: 18, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 27, yellow: 5, green: 43 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 54 },
      { id: "I6", name: "Whitefield ITPL", district: "Enterprise Technology Campus", x: 32, z: 22, lat: 12.9866, lon: 77.7380, density: 84, queueLength: 38, vehicleCount: 86, capacity: 1700, phase: "GREEN_NS", phaseTimer: 20, classicalTiming: { red: 46, yellow: 5, green: 19 }, optimizedTiming: { red: 24, yellow: 5, green: 46 }, currentTiming: { red: 46, yellow: 5, green: 19 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 68 },
      { id: "I7", name: "Hebbal Flyover", district: "Airport Arterial Gateway", x: 0, z: -44, lat: 13.0358, lon: 77.5970, density: 88, queueLength: 42, vehicleCount: 90, capacity: 1900, phase: "GREEN_EW", phaseTimer: 16, classicalTiming: { red: 48, yellow: 5, green: 22 }, optimizedTiming: { red: 26, yellow: 5, green: 49 }, currentTiming: { red: 48, yellow: 5, green: 22 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 72 },
      { id: "I8", name: "Marathahalli Bridge", district: "East Arterial Transit Link", x: 0, z: 44, lat: 12.9560, lon: 77.7011, density: 82, queueLength: 35, vehicleCount: 80, capacity: 1650, phase: "GREEN_NS", phaseTimer: 19, classicalTiming: { red: 45, yellow: 5, green: 20 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 45, yellow: 5, green: 20 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 62 }
    ]
  },

  chennai: {
    id: "chennai",
    name: "Chennai",
    country: "India",
    region: "Tamil Nadu",
    flag: "🇮🇳",
    lat: 13.0827,
    lon: 80.2707,
    zoom: 13,
    description: "Detroit of Asia & Coastal Tech Hub",
    population: "11.5M",
    vehicles: "6.2M Daily",
    quantumAdvantage: "+27.8% Flow",
    center: [13.0827, 80.2707],
    intersections: [
      { id: "I1", name: "Anna Salai Gemini", district: "Central Arterial Spine", x: -32, z: -22, lat: 13.0520, lon: 80.2510, density: 78, queueLength: 32, vehicleCount: 70, capacity: 1600, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 54 },
      { id: "I2", name: "Guindy Kathipara", district: "Southern Cloverleaf Interchange", x: 32, z: -22, lat: 13.0067, lon: 80.2025, density: 85, queueLength: 39, vehicleCount: 88, capacity: 1800, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 45, yellow: 5, green: 20 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 45, yellow: 5, green: 20 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 64 },
      { id: "I3", name: "T. Nagar Panagal Park", district: "Retail & High-Density Pedestrian", x: -32, z: 0, lat: 13.0418, lon: 80.2337, density: 82, queueLength: 35, vehicleCount: 76, capacity: 1500, phase: "GREEN_NS", phaseTimer: 11, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 24, yellow: 5, green: 46 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 61 },
      { id: "I4", name: "Marina Beach Road", district: "Heritage Waterfront Promenade", x: 32, z: 0, lat: 13.0500, lon: 80.2824, density: 66, queueLength: 22, vehicleCount: 50, capacity: 1400, phase: "RED", phaseTimer: 22, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 44 },
      { id: "I5", name: "OMR Sholinganallur", district: "IT Expressway Tech Corridor", x: -32, z: 22, lat: 12.9010, lon: 80.2279, density: 88, queueLength: 44, vehicleCount: 92, capacity: 1850, phase: "GREEN_EW", phaseTimer: 17, classicalTiming: { red: 48, yellow: 5, green: 17 }, optimizedTiming: { red: 24, yellow: 5, green: 46 }, currentTiming: { red: 48, yellow: 5, green: 17 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 71 },
      { id: "I6", name: "Velachery Bypass", district: "Southern Transit & Residential", x: 32, z: 22, lat: 12.9759, lon: 80.2212, density: 74, queueLength: 27, vehicleCount: 62, capacity: 1450, phase: "GREEN_NS", phaseTimer: 21, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 52 },
      { id: "I7", name: "Chennai Central Rail", district: "Intermodal Northern Terminal", x: 0, z: -44, lat: 13.0827, lon: 80.2755, density: 84, queueLength: 38, vehicleCount: 84, capacity: 1700, phase: "GREEN_EW", phaseTimer: 14, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 65 },
      { id: "I8", name: "Adyar Madhya Kailash", district: "Academic & Tech Junction", x: 0, z: 44, lat: 13.0063, lon: 80.2443, density: 72, queueLength: 26, vehicleCount: 58, capacity: 1500, phase: "GREEN_NS", phaseTimer: 19, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 49 }
    ]
  },

  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    region: "Maharashtra",
    flag: "🇮🇳",
    lat: 19.0760,
    lon: 72.8777,
    zoom: 13,
    description: "Financial Capital of India & Coastal Sea Link Network",
    population: "21.3M",
    vehicles: "4.2M Daily",
    quantumAdvantage: "+31.6% Flow",
    center: [19.0760, 72.8777],
    intersections: [
      { id: "I1", name: "Nariman Point", district: "Financial Headquarters", x: -32, z: -22, lat: 18.9256, lon: 72.8242, density: 76, queueLength: 29, vehicleCount: 65, capacity: 1500, phase: "GREEN_NS", phaseTimer: 16, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 51 },
      { id: "I2", name: "Bandra-Kurla BKC", district: "Global Financial District", x: 32, z: -22, lat: 19.0664, lon: 72.8682, density: 89, queueLength: 45, vehicleCount: 94, capacity: 1900, phase: "GREEN_EW", phaseTimer: 13, classicalTiming: { red: 48, yellow: 5, green: 17 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 48, yellow: 5, green: 17 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 73 },
      { id: "I3", name: "Dadar TT Circle", district: "Central Transit Interchange", x: -32, z: 0, lat: 19.0178, lon: 72.8478, density: 86, queueLength: 41, vehicleCount: 88, capacity: 1750, phase: "GREEN_NS", phaseTimer: 10, classicalTiming: { red: 46, yellow: 5, green: 19 }, optimizedTiming: { red: 24, yellow: 5, green: 46 }, currentTiming: { red: 46, yellow: 5, green: 19 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 69 },
      { id: "I4", name: "Worli Sea Link Toll", district: "Coastal Expressway Gateway", x: 32, z: 0, lat: 19.0270, lon: 72.8170, density: 72, queueLength: 25, vehicleCount: 60, capacity: 1600, phase: "RED", phaseTimer: 23, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 47 },
      { id: "I5", name: "Andheri East WEH", district: "Commercial & Metro Hub", x: -32, z: 22, lat: 19.1136, lon: 72.8697, density: 88, queueLength: 43, vehicleCount: 91, capacity: 1800, phase: "GREEN_EW", phaseTimer: 16, classicalTiming: { red: 47, yellow: 5, green: 18 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 47, yellow: 5, green: 18 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 72 },
      { id: "I6", name: "Powai Hiranandani", district: "Tech & Academic Corridor", x: 32, z: 22, lat: 19.1197, lon: 72.9051, density: 68, queueLength: 22, vehicleCount: 52, capacity: 1350, phase: "GREEN_NS", phaseTimer: 20, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 43 },
      { id: "I7", name: "CST Terminal Plaza", district: "Historic Rail Headquarters", x: 0, z: -44, lat: 18.9400, lon: 72.8353, density: 83, queueLength: 37, vehicleCount: 80, capacity: 1700, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 63 },
      { id: "I8", name: "Bandra Lucky Hotel", district: "Western Suburbs Gateway", x: 0, z: 44, lat: 19.0544, lon: 72.8402, density: 81, queueLength: 34, vehicleCount: 77, capacity: 1650, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 59 }
    ]
  },

  singapore: {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    region: "Southeast Asia",
    flag: "🇸🇬",
    lat: 1.3521,
    lon: 103.8198,
    zoom: 13,
    description: "Pioneering Smart Nation & Intelligent Transport System (ERP 2.0)",
    population: "5.9M",
    vehicles: "980K Daily",
    quantumAdvantage: "+24.5% Flow",
    center: [1.3521, 103.8198],
    intersections: [
      { id: "I1", name: "Marina Bay Boulevard", district: "Downtown Financial District", x: -32, z: -22, lat: 1.2800, lon: 103.8540, density: 62, queueLength: 18, vehicleCount: 45, capacity: 1500, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 38 },
      { id: "I2", name: "Orchard Road Plaza", district: "Prime Retail Corridor", x: 32, z: -22, lat: 1.3048, lon: 103.8318, density: 74, queueLength: 26, vehicleCount: 60, capacity: 1400, phase: "GREEN_EW", phaseTimer: 14, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 49 },
      { id: "I3", name: "Raffles Place Quay", district: "Banking & Intermodal Transit", x: -32, z: 0, lat: 1.2830, lon: 103.8510, density: 68, queueLength: 22, vehicleCount: 52, capacity: 1550, phase: "GREEN_NS", phaseTimer: 10, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 42 },
      { id: "I4", name: "Bugis Junction", district: "Arts & Cultural District", x: 32, z: 0, lat: 1.3000, lon: 103.8550, density: 70, queueLength: 24, vehicleCount: 55, capacity: 1450, phase: "RED", phaseTimer: 21, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 46 },
      { id: "I5", name: "Jurong Gateway Hub", district: "Western Second CBD", x: -32, z: 22, lat: 1.3329, lon: 103.7436, density: 65, queueLength: 20, vehicleCount: 48, capacity: 1500, phase: "GREEN_EW", phaseTimer: 16, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 40 },
      { id: "I6", name: "Tanjong Pagar Port Link", district: "Southern Maritime Waterfront", x: 32, z: 22, lat: 1.2750, lon: 103.8430, density: 58, queueLength: 16, vehicleCount: 40, capacity: 1400, phase: "GREEN_NS", phaseTimer: 19, classicalTiming: { red: 36, yellow: 5, green: 29 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 36, yellow: 5, green: 29 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 36 },
      { id: "I7", name: "Changi Airport Gateway", district: "Aviation & Logistics Zone", x: 0, z: -44, lat: 1.3644, lon: 103.9915, density: 52, queueLength: 14, vehicleCount: 36, capacity: 1600, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 36, yellow: 5, green: 29 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 36, yellow: 5, green: 29 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 32 },
      { id: "I8", name: "Sentosa Gateway", district: "Hospitality & Leisure Island", x: 0, z: 44, lat: 1.2644, lon: 103.8222, density: 60, queueLength: 18, vehicleCount: 42, capacity: 1300, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 37 }
    ]
  },

  sanfrancisco: {
    id: "sanfrancisco",
    name: "San Francisco",
    country: "USA",
    region: "California",
    flag: "🇺🇸",
    lat: 37.7749,
    lon: -122.4194,
    zoom: 14,
    description: "Bay Area Innovation Hub & Autonomous Vehicle Testbed",
    population: "870K",
    vehicles: "520K Daily",
    quantumAdvantage: "+22.9% Flow",
    center: [37.7855, -122.4015],
    intersections: window.TRAFFIC_DATA.intersections
  },

  london: {
    id: "london",
    name: "London",
    country: "UK",
    region: "Greater London",
    flag: "🇬🇧",
    lat: 51.5074,
    lon: -0.1278,
    zoom: 13,
    description: "Historic Metropolis with Ultra Low Emission Zone (ULEZ)",
    population: "9.0M",
    vehicles: "2.6M Daily",
    quantumAdvantage: "+25.3% Flow",
    center: [51.5074, -0.1278],
    intersections: [
      { id: "I1", name: "Westminster Bridge", district: "Government & Parliament", x: -32, z: -22, lat: 51.5007, lon: -0.1246, density: 70, queueLength: 24, vehicleCount: 52, capacity: 1400, phase: "GREEN_NS", phaseTimer: 17, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 45 },
      { id: "I2", name: "Piccadilly Circus", district: "West End Entertainment Hub", x: 32, z: -22, lat: 51.5101, lon: -0.1340, density: 82, queueLength: 35, vehicleCount: 78, capacity: 1500, phase: "GREEN_EW", phaseTimer: 13, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 58 },
      { id: "I3", name: "City Financial Square", district: "Square Mile Banking Hub", x: -32, z: 0, lat: 51.5133, lon: -0.0890, density: 76, queueLength: 28, vehicleCount: 64, capacity: 1550, phase: "GREEN_NS", phaseTimer: 11, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 50 },
      { id: "I4", name: "Canary Wharf Gateway", district: "Docklands Enterprise Hub", x: 32, z: 0, lat: 51.5054, lon: -0.0209, density: 72, queueLength: 26, vehicleCount: 58, capacity: 1600, phase: "RED", phaseTimer: 23, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 46 },
      { id: "I5", name: "London Bridge South", district: "Borough Transit Interchange", x: -32, z: 22, lat: 51.5050, lon: -0.0870, density: 68, queueLength: 22, vehicleCount: 50, capacity: 1450, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 42 },
      { id: "I6", name: "King's Cross St Pancras", district: "Eurostar Rail Hub", x: 32, z: 22, lat: 51.5308, lon: -0.1238, density: 80, queueLength: 32, vehicleCount: 74, capacity: 1650, phase: "GREEN_NS", phaseTimer: 20, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 56 },
      { id: "I7", name: "Hyde Park Corner", district: "Royal Parks Arterial", x: 0, z: -44, lat: 51.5033, lon: -0.1517, density: 74, queueLength: 27, vehicleCount: 62, capacity: 1600, phase: "GREEN_EW", phaseTimer: 14, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 27, yellow: 5, green: 43 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 48 },
      { id: "I8", name: "Camden Town Lock", district: "North London Cultural Spine", x: 0, z: 44, lat: 51.5414, lon: -0.1426, density: 65, queueLength: 20, vehicleCount: 46, capacity: 1350, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 41 }
    ]
  },

  tokyo: {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    region: "Kanto",
    flag: "🇯🇵",
    lat: 35.6762,
    lon: 139.6503,
    zoom: 13,
    description: "World's Largest Megacity & Precision Multimodal Grid",
    population: "37.4M",
    vehicles: "14.8M Daily",
    quantumAdvantage: "+30.1% Flow",
    center: [35.6762, 139.6503],
    intersections: [
      { id: "I1", name: "Shibuya Scramble", district: "World's Busiest Pedestrian Crossing", x: -32, z: -22, lat: 35.6595, lon: 139.7005, density: 90, queueLength: 46, vehicleCount: 92, capacity: 1900, phase: "GREEN_NS", phaseTimer: 22, classicalTiming: { red: 48, yellow: 5, green: 17 }, optimizedTiming: { red: 24, yellow: 5, green: 48 }, currentTiming: { red: 48, yellow: 5, green: 17 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 76 },
      { id: "I2", name: "Shinjuku Station South", district: "Skyscraper & Rail Megahub", x: 32, z: -22, lat: 35.6895, lon: 139.7005, density: 88, queueLength: 44, vehicleCount: 89, capacity: 1850, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 46, yellow: 5, green: 19 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 46, yellow: 5, green: 19 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 71 },
      { id: "I3", name: "Ginza 4-Chome", district: "Luxury Retail & Art Boulevard", x: -32, z: 0, lat: 35.6718, lon: 139.7650, density: 72, queueLength: 25, vehicleCount: 58, capacity: 1500, phase: "GREEN_NS", phaseTimer: 12, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 46 },
      { id: "I4", name: "Roppongi Hills Crossing", district: "International Commerce & Tech", x: 32, z: 0, lat: 35.6605, lon: 139.7292, density: 78, queueLength: 31, vehicleCount: 68, capacity: 1600, phase: "RED", phaseTimer: 24, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 55 },
      { id: "I5", name: "Akihabara Electric Town", district: "High-Tech Electronics Spine", x: -32, z: 22, lat: 35.6983, lon: 139.7731, density: 70, queueLength: 24, vehicleCount: 54, capacity: 1450, phase: "GREEN_EW", phaseTimer: 16, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 44 },
      { id: "I6", name: "Marunouchi Tokyo Station", district: "Shinkansen Bullet Rail Plaza", x: 32, z: 22, lat: 35.6812, lon: 139.7671, density: 84, queueLength: 36, vehicleCount: 80, capacity: 1750, phase: "GREEN_NS", phaseTimer: 19, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 62 },
      { id: "I7", name: "Shinagawa Gateway", district: "Maglev & Bay Transit Hub", x: 0, z: -44, lat: 35.6284, lon: 139.7387, density: 76, queueLength: 29, vehicleCount: 66, capacity: 1650, phase: "GREEN_EW", phaseTimer: 14, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 27, yellow: 5, green: 43 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 51 },
      { id: "I8", name: "Ueno Park Interchange", district: "Northern Cultural & Rail Gate", x: 0, z: 44, lat: 35.7140, lon: 139.7741, density: 66, queueLength: 21, vehicleCount: 48, capacity: 1400, phase: "GREEN_NS", phaseTimer: 17, classicalTiming: { red: 38, yellow: 5, green: 27 }, optimizedTiming: { red: 28, yellow: 5, green: 42 }, currentTiming: { red: 38, yellow: 5, green: 27 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 42 }
    ]
  },

  newyork: {
    id: "newyork",
    name: "New York City",
    country: "USA",
    region: "New York",
    flag: "🇺🇸",
    lat: 40.7128,
    lon: -74.0060,
    zoom: 14,
    description: "Global Financial Center with Manhattan Grid Topology",
    population: "8.8M",
    vehicles: "2.1M Daily",
    quantumAdvantage: "+29.4% Flow",
    center: [40.7128, -74.0060],
    intersections: [
      { id: "I1", name: "Times Square 42nd", district: "Broadway Theatre & Tourism Hub", x: -32, z: -22, lat: 40.7580, lon: -73.9855, density: 88, queueLength: 42, vehicleCount: 90, capacity: 1800, phase: "GREEN_NS", phaseTimer: 20, classicalTiming: { red: 46, yellow: 5, green: 19 }, optimizedTiming: { red: 24, yellow: 5, green: 48 }, currentTiming: { red: 46, yellow: 5, green: 19 }, neighbors: ["I2", "I3", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 72 },
      { id: "I2", name: "Wall Street Broadway", district: "New York Stock Exchange (NYSE)", x: 32, z: -22, lat: 40.7069, lon: -74.0113, density: 74, queueLength: 26, vehicleCount: 58, capacity: 1500, phase: "GREEN_EW", phaseTimer: 13, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I1", "I4", "I7"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 49 },
      { id: "I3", name: "Grand Central 42nd", district: "Metropolitan Commuter Rail Hub", x: -32, z: 0, lat: 40.7527, lon: -73.9772, density: 85, queueLength: 38, vehicleCount: 84, capacity: 1750, phase: "GREEN_NS", phaseTimer: 11, classicalTiming: { red: 45, yellow: 5, green: 20 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 45, yellow: 5, green: 20 }, neighbors: ["I1", "I4", "I5"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 65 },
      { id: "I4", name: "Hudson Yards Boulevard", district: "High-Rise Commercial Campus", x: 32, z: 0, lat: 40.7538, lon: -74.0022, density: 70, queueLength: 23, vehicleCount: 52, capacity: 1550, phase: "RED", phaseTimer: 23, classicalTiming: { red: 40, yellow: 5, green: 25 }, optimizedTiming: { red: 27, yellow: 5, green: 43 }, currentTiming: { red: 40, yellow: 5, green: 25 }, neighbors: ["I2", "I3", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 44 },
      { id: "I5", name: "Union Square 14th", district: "Subway Concourse & Transit Plaza", x: -32, z: 22, lat: 40.7359, lon: -73.9911, density: 78, queueLength: 30, vehicleCount: 68, capacity: 1600, phase: "GREEN_EW", phaseTimer: 16, classicalTiming: { red: 42, yellow: 5, green: 23 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 42, yellow: 5, green: 23 }, neighbors: ["I3", "I6", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 54 },
      { id: "I6", name: "Columbus Circle 59th", district: "Central Park West Roundabout", x: 32, z: 22, lat: 40.7681, lon: -73.9819, density: 82, queueLength: 35, vehicleCount: 76, capacity: 1700, phase: "GREEN_NS", phaseTimer: 19, classicalTiming: { red: 44, yellow: 5, green: 21 }, optimizedTiming: { red: 25, yellow: 5, green: 45 }, currentTiming: { red: 44, yellow: 5, green: 21 }, neighbors: ["I4", "I5", "I8"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 60 },
      { id: "I7", name: "Lincoln Tunnel Approach", district: "Interstate Hudson River Portal", x: 0, z: -44, lat: 40.7600, lon: -74.0000, density: 86, queueLength: 40, vehicleCount: 88, capacity: 1850, phase: "GREEN_EW", phaseTimer: 15, classicalTiming: { red: 47, yellow: 5, green: 18 }, optimizedTiming: { red: 26, yellow: 5, green: 46 }, currentTiming: { red: 47, yellow: 5, green: 18 }, neighbors: ["I1", "I2"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 68 },
      { id: "I8", name: "Brooklyn Bridge Plaza", district: "East River Crossing Connector", x: 0, z: 44, lat: 40.7110, lon: -74.0000, density: 79, queueLength: 32, vehicleCount: 72, capacity: 1650, phase: "GREEN_NS", phaseTimer: 18, classicalTiming: { red: 43, yellow: 5, green: 22 }, optimizedTiming: { red: 26, yellow: 5, green: 44 }, currentTiming: { red: 43, yellow: 5, green: 22 }, neighbors: ["I5", "I6"], isEmergencyCorridor: false, hasIncident: false, waitingTime: 57 }
    ]
  }
};

window.currentCityId = "coimbatore"; // Default to Coimbatore as requested in early user prompts

window.switchCity = function(cityId) {
  const city = window.GLOBAL_CITIES[cityId];
  if (!city) return false;

  window.currentCityId = cityId;
  window.TRAFFIC_DATA.intersections = JSON.parse(JSON.stringify(city.intersections));
  window.TRAFFIC_DATA.geoapify.center = [...city.center];
  window.TRAFFIC_DATA.geoapify.zoom = city.zoom || 14;

  if (window.trafficEngine) {
    window.trafficEngine.intersections = JSON.parse(JSON.stringify(city.intersections));
    window.trafficEngine.reset();
    window.trafficEngine.notify();
  }

  if (window.diagnosticsSuite) {
    window.diagnosticsSuite.addLog('INFO', 'CitySwitch', `Switched digital twin to ${city.name}, ${city.country}.`, 'LOCATION');
  }

  return true;
};

// ----------------------------------------------------
// Environmental Dashboard Metrics
// ----------------------------------------------------
window.ENVIRONMENTAL_METRICS = {
  treesCount: 248,
  greenAreaPct: 32,
  streetLightsCount: 184,
  roadNetworkKm: 14.6,
  soilZonesCount: 18,
  co2ReductionKg: 35.2,
  energyEfficiencyPct: 24.8
};

// ----------------------------------------------------
// Automatic Quantum Optimizer Configuration
// ----------------------------------------------------
window.AUTO_OPTIMIZER_CONFIG = {
  enabled: true,
  densityThreshold: 76,  // Auto-trigger if network/node density > 76%
  queueThreshold: 26,    // Auto-trigger if queue > 26 vehicles
  waitThreshold: 52,     // Auto-trigger if waiting time > 52 seconds
  cooldownSeconds: 30    // Cooldown between automated runs (bypassed on accidents/emergencies)
};

// ----------------------------------------------------
// Vehicle Distribution Ratios
// ----------------------------------------------------
window.TRAFFIC_DISTRIBUTION = {
  cars: 0.55,        // 55% Cars (Sedan, Hatchback, SUV)
  motorcycles: 0.25, // 25% Motorcycles
  scooters: 0.10,    // 10% Scooters
  buses: 0.04,       // 4% City Transit Buses
  trucks: 0.04,      // 4% Heavy Cargo Trucks
  vans: 0.02         // 2% Delivery Vans
};

// ----------------------------------------------------
// Initial Optimization History Ledger
// ----------------------------------------------------
window.INITIAL_OPTIMIZATION_HISTORY = [
  {
    id: "OPT-101",
    timestamp: "08:32:15 AM",
    trigger: "High Density Surge (82%)",
    target: "Network-wide (I1 - I6)",
    method: "QAOA Hybrid (p=2)",
    previousTiming: "Green: 25s | Red: 40s",
    optimizedTiming: "Green: 45s | Red: 25s",
    objective: 0.184,
    status: "APPLIED"
  },
  {
    id: "OPT-100",
    timestamp: "08:15:40 AM",
    trigger: "Scheduled Baseline Sweep",
    target: "Central Core (I3, I4)",
    method: "QUBO Ising Min",
    previousTiming: "Green: 25s | Red: 42s",
    optimizedTiming: "Green: 38s | Red: 32s",
    objective: 0.245,
    status: "APPLIED"
  }
];

// ----------------------------------------------------
// Centralized Safe Intersection Data Validator
// ----------------------------------------------------
window.validateIntersection = function(node) {
  if (!node || typeof node !== 'object') {
    return {
      id: "I1",
      name: "Avinashi Road Jn",
      district: "Central Smart Corridor",
      trafficDensity: 0,
      density: 0,
      queueLength: 0,
      roadCapacity: 1000,
      capacity: 1000,
      signalPhase: "RED",
      phase: "RED",
      phaseTimer: 15,
      greenDuration: 30,
      redDuration: 30,
      yellowDuration: 5,
      currentTiming: { green: 30, red: 30, yellow: 5 },
      optimizedTiming: { green: 45, red: 25, yellow: 5 },
      classicalTiming: { green: 25, red: 40, yellow: 5 },
      isEmergencyCorridor: false,
      hasIncident: false,
      waitingTime: 45,
      lat: 11.0168,
      lon: 76.9558,
      x: -32,
      z: -22,
      neighbors: ["I2", "I3"]
    };
  }

  const id = String(node.id || "I1");
  const name = String(node.name || `Intersection ${id}`);
  const district = String(node.district || "Metropolitan Zone");

  const densityVal = isFinite(node.density) ? Math.max(0, Math.min(100, Math.round(node.density))) : 0;
  const queueVal = isFinite(node.queueLength) ? Math.max(0, Math.round(node.queueLength)) : 0;
  const capVal = isFinite(node.capacity) ? Math.max(200, Math.round(node.capacity)) : 1200;
  const phaseVal = typeof node.phase === 'string' && node.phase ? node.phase : "RED";
  const timerVal = isFinite(node.phaseTimer) ? Math.max(1, Math.round(node.phaseTimer)) : 15;

  const currentTiming = node.currentTiming || {};
  const greenDuration = isFinite(currentTiming.green) ? Math.max(5, Math.min(120, Math.round(currentTiming.green))) : 30;
  const redDuration = isFinite(currentTiming.red) ? Math.max(5, Math.min(120, Math.round(currentTiming.red))) : 30;
  const yellowDuration = isFinite(currentTiming.yellow) ? Math.max(3, Math.min(10, Math.round(currentTiming.yellow))) : 5;

  const optTiming = node.optimizedTiming || {};
  const optGreen = isFinite(optTiming.green) ? Math.max(5, Math.min(120, Math.round(optTiming.green))) : 45;
  const optRed = isFinite(optTiming.red) ? Math.max(5, Math.min(120, Math.round(optTiming.red))) : 25;
  const optYellow = isFinite(optTiming.yellow) ? Math.max(3, Math.min(10, Math.round(optTiming.yellow))) : 5;

  return {
    ...node,
    id,
    name,
    district,
    trafficDensity: densityVal,
    density: densityVal,
    queueLength: queueVal,
    roadCapacity: capVal,
    capacity: capVal,
    signalPhase: phaseVal,
    phase: phaseVal,
    phaseTimer: timerVal,
    greenDuration,
    redDuration,
    yellowDuration,
    currentTiming: { green: greenDuration, red: redDuration, yellow: yellowDuration },
    optimizedTiming: { green: optGreen, red: optRed, yellow: optYellow },
    classicalTiming: node.classicalTiming || { green: 25, red: 40, yellow: 5 },
    isEmergencyCorridor: !!node.isEmergencyCorridor,
    hasIncident: !!node.hasIncident,
    waitingTime: isFinite(node.waitingTime) ? Math.max(0, Math.round(node.waitingTime)) : 40,
    lat: isFinite(node.lat) ? node.lat : 11.0168,
    lon: isFinite(node.lon) ? node.lon : 76.9558,
    x: isFinite(node.x) ? node.x : 0,
    z: isFinite(node.z) ? node.z : 0,
    neighbors: Array.isArray(node.neighbors) ? node.neighbors : []
  };
};
