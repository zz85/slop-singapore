// Singapore: the Central Area — the CBD & Marina Bay, Chinatown & Tanjong Pagar, the Civic District, Bugis & Kampong
// Glam, Little India, Orchard, River Valley, Tiong Bahru — from OpenStreetMap
export default {
  id: 'singapore',
  name: 'Singapore',
  short: 'SG',
  origin: { lat: 1.28405, lon: 103.85143, label: 'Raffles Place' },
  bearing: 'auto', // no city-wide grid: the frame turns to the streets' dominant direction
  detail: [1.262, 103.822, 1.318, 103.878], // south, west, north, east
  margin: 0.005, // degrees fetched beyond the detail box so its edge blocks are whole
  sidewalk: 5, // property line in from the curb (m)
  strip: 6, // waterfront strip kept clear of blocks (m in from the shore)
  driveSide: 'left',
  // Building styles by neighbourhood: a block takes the style of the nearest centre within its radius (m). Styles:
  // glass-towers, offices, shophouses, housing, midrise, lowrise (js/buildings.js); elsewhere a mix
  districts: [
    { name: 'Raffles Place', at: [1.2840, 103.8514], r: 450, style: 'glass-towers' },
    { name: 'Marina Bay Financial Centre', at: [1.2793, 103.8540], r: 450, style: 'glass-towers' },
    { name: 'Shenton Way', at: [1.2770, 103.8480], r: 450, style: 'offices' },
    { name: 'Chinatown', at: [1.2836, 103.8443], r: 380, style: 'shophouses' },
    { name: 'Tanjong Pagar', at: [1.2780, 103.8430], r: 300, style: 'shophouses' },
    { name: 'Boat Quay', at: [1.2868, 103.8494], r: 130, style: 'shophouses' },
    { name: 'Clarke Quay', at: [1.2895, 103.8460], r: 200, style: 'lowrise' },
    { name: 'Civic District', at: [1.2925, 103.8515], r: 400, style: 'midrise' },
    { name: 'Bugis', at: [1.3000, 103.8556], r: 380, style: 'offices' },
    { name: 'Kampong Glam', at: [1.3023, 103.8590], r: 280, style: 'shophouses' },
    { name: 'Little India', at: [1.3066, 103.8518], r: 500, style: 'shophouses' },
    { name: 'Orchard', at: [1.3040, 103.8318], r: 650, style: 'offices' },
    { name: 'River Valley', at: [1.2935, 103.8370], r: 650, style: 'housing' },
    { name: 'Robertson Quay', at: [1.2905, 103.8400], r: 300, style: 'housing' },
    { name: 'Tiong Bahru', at: [1.2850, 103.8300], r: 450, style: 'midrise' },
    { name: 'Outram', at: [1.2790, 103.8380], r: 350, style: 'housing' },
    { name: 'Lavender', at: [1.3080, 103.8630], r: 500, style: 'housing' }
  ],
  // Teleport destinations & landmarks (arrivals snap to the nearest street)
  places: [
    { id: 'raffles', name: 'Raffles Place', sub: 'Downtown Core', at: [1.2840, 103.8514] },
    { id: 'mbs', name: 'Marina Bay Sands', sub: 'Bayfront', at: [1.2834, 103.8607] },
    { id: 'gardens', name: 'Gardens by the Bay', sub: 'Marina South', at: [1.2816, 103.8636] },
    { id: 'merlion', name: 'Merlion Park', sub: 'Marina Bay', at: [1.2868, 103.8545] },
    { id: 'esplanade', name: 'Esplanade', sub: 'Marina Bay', at: [1.2897, 103.8555] },
    { id: 'clarkequay', name: 'Clarke Quay', sub: 'Singapore River', at: [1.2884, 103.8465] },
    { id: 'chinatown', name: 'Chinatown', sub: 'Outram', at: [1.2836, 103.8443] },
    { id: 'orchard', name: 'Orchard Road', sub: 'Orchard', at: [1.3040, 103.8318] },
    { id: 'littleindia', name: 'Little India', sub: 'Rochor', at: [1.3066, 103.8518] },
    { id: 'kampongglam', name: 'Kampong Glam', sub: 'Rochor', at: [1.3023, 103.8590] }
  ],
  // Trees: NParks' inventory (Trees.sg © National Parks Board) as collected by cheeaun/sgtreesdata, each tree at its
  // place with its estimated height; its family picks the crown's shape (js/trees.js), the rest are `shape`
  trees: {
    source: 'sgtreesdata',
    url: 'https://raw.githubusercontent.com/cheeaun/sgtreesdata/master/data/trees.csv',
    families: 'https://raw.githubusercontent.com/cheeaun/sgtreesdata/master/data/families-species.json',
    credit: 'Trees.sg © National Parks Board, via cheeaun/sgtreesdata',
    shape: 'evergreen',
    shapes: { 'Fabaceae (Leguminosae)': 'raintree', Lythraceae: 'weeping', Bignoniaceae: 'weeping', 'Arecaceae (Palmae)': 'palm' }
  },
  // Vehicle liveries (js/city-common.js NYC_VEHICLES, overridden part by part): the taxi fleet (ComfortDelGro blue
  // most, CityCab yellow, Trans-cab red, Premier silver) with lettering on the doors, Singapore plates, the green
  // buses of the Land Transport Authority's livery
  vehicles: {
    taxis: [0x1f63c3, 0x1f63c3, 0x1f63c3, 0x1f63c3, 0x1f63c3, 0xf2c200, 0xf2c200, 0xc8102e, 0xc9cdd2],
    taxiBadge: null,
    taxiLettering: 0xffffff,
    taxiMedallion: false,
    plate: { front: 0xf4f4f0, bg: '#f4c51c', ink: '#111111', labels: ['SHA 4721 D', 'SKH 318 G', 'SLA 5062 K', 'SGX 842 Z'] },
    playerTaxi: {
      door: { bg: '#1f63c3', ink: '#ffffff', emblem: '', title: 'ComfortDelGro', lines: ['TAXI · 6552 1111', 'SHA 7948 A'] },
      plate: { bg: '#f4c51c', ink: '#111111', top: '', number: 'SHA 7948A', bottom: '' }
    },
    bus: { body: 0x48a83a, stripe: 0x2e7d2a, ribbon: 0xcfe9c3, skirt: 0x1c2026, route: '36', routeBadge: '#1c1c1c', destination: 'CHANGI AIRPORT' },
    labels: { car: 'Taxi', cyclist: 'Cyclist' }
  },
  // Landmarks modelled by hand (js/singapore-landmarks.js) instead of standing as their OpenStreetMap outlines: the
  // buildings and parts they replace (way ids) are left out of GEO.buildings
  landmarks: [
    // the three hotel towers and the SkyPark (the podium, lobbies & Shoppes stand as mapped)
    { id: 'mbs', name: 'Marina Bay Sands', hide: [116800998, 116801004, 172307472, 172307471] },
    // the wheel, mapped as 29 slices of building:part and a footprint on the ground (the terminal stands as mapped)
    { id: 'flyer', name: 'Singapore Flyer', hide: [230082125, 492119925, 492119928, 492119930, 492119932, 492119933, 492119935, 492119937,
      492119939, 492119940, 492119942, 492119944, 492119946, 492119948, 492119949, 492119951, 492119953, 492119954, 492119956,
      492119958, 492119959, 492119961, 492119963, 492119964, 492119966, 492119968, 492119969, 492119971, 492119973, 492119974] },
    // the Supertrees of Supertree Grove & the Silver Garden, each mapped as a stack of rings (its pad, trunk & canopy)
    { id: 'supertrees', name: 'Supertrees', hide: [
      172288947, 681695775, 681695776, 681695777, 681695778, 172288948, 681695792, 681695793, 681695794,
      172288950, 572839871, 572839872, 572839873, 572839874, 572839875, 172288952, 681693634, 681693635,
      681693636, 681693637, 172288953, 681695799, 681695800, 681695801, 681695802, 172288955, 681695795,
      681695796, 681695797, 681695798, 172288956, 681695779, 681695780, 681695782, 172288958, 681695804,
      681695806, 681695808, 681695810, 172288975, 681695783, 681695784, 681695785, 681695786, 572839866,
      572839867, 572839868, 572839869, 572839870, 572839876, 572839877, 572839878, 572839879, 572839880,
      572839881, 591619300, 591619301, 591619302, 681695787, 681695788, 681695789, 681695790] },
    // the Esplanade's two shells (the podium, annexe & outdoor theatre stand as mapped)
    { id: 'esplanade', name: 'Esplanade', hide: [256163011, 256163012] },
    // The CBD towers built by model programs (js/landmark-models/<model>.js, from their mapped outlines and documented
    // dimensions): UOB Plaza's two towers and podium; One Raffles Place's two towers and podium; Guoco Tower, its hotel
    // block and podium
    { id: 'uob-plaza', name: 'UOB Plaza', model: 'uob-plaza', hide: [106193385, 171999282, 335167827,
      // Tower 1's mapped parts (the stack of offset squares) and Tower 2's
      335167781, 335167782, 335167783, 335167784, 335167786, 335167809, 335167814, 335167823, 335167824, 335167825, 335167826,
      1075244649, 1566728320, 1566728321, 1566728322, 1566728323, 1566728324, 1566728325, 1566728326, 1566728327, 1566728328,
      1566728329, 1566728330, 1566728331, 1566728332, 1566728333, 1566728334, 1566728335,
      335167785, 335167790, 335167791, 335167792, 335167794, 335167796, 335167812, 335167813, 335167816, 335167818, 335167819,
      335167821, 335167822, 1075244650, 1479638475] },
    { id: 'one-raffles-place', name: 'One Raffles Place', model: 'one-raffles-place', hide: [171999293, 325793737, 325793773, 407705492, 407705505, 407705559, 852006883] },
    { id: 'guoco-tower', name: 'Guoco Tower', model: 'guoco-tower', hide: [393100845, 393100848, 393100849, 393100850] },
    // The second batch: Republic Plaza (its octagonal shaft, the sloped corner parts and the crown slivers, its podium
    // outline), Asia Square's two towers (outlines and their stepped parts), Marina Bay Financial Centre (the three
    // office towers, Marina Bay Residences, the podium, the Link Mall and 116905047: the residences' lap pool, mapped as
    // a 245 m building; Marina Bay Suites is way 393092728 across Straits View, left to the city)
    { id: 'republic-plaza', name: 'Republic Plaza', model: 'republic-plaza', hide: [171999304, 407705511, 407705516, 407705520, 407705531,
      407705532, 407705537, 407705543, 407705558, 407705560, 407705561, 407705562, 407705565, 407705571, 463857990, 463857991, 463857992] },
    { id: 'asia-square', name: 'Asia Square', model: 'asia-square', hide: [407941850, 407941851, 407941832, 407941833, 407941834, 407941835,
      407941836, 407941837, 407941838, 407941839, 407941840, 407941841, 407941842, 407941843, 407941844, 407941845, 407941847, 407941848,
      679388852, 1566584724] },
    { id: 'marina-bay-financial-centre', name: 'Marina Bay Financial Centre', model: 'marina-bay-financial-centre', hide: [116905040, 116905041,
      116905042, 116905045, 116905047, 509003525, 509003526, 509003527, 509003528, 509003529, 728243729] },
    // Former General Post Office: the hotel only; One Fullerton and the Waterboat House remain separate buildings.
    { id: 'fullerton-hotel', name: 'The Fullerton Hotel', model: 'fullerton-hotel', hide: [46595395,407926378,407926385], hideRelations: [4039936] },
    { id: 'fullerton-bay-hotel', name: 'The Fullerton Bay Hotel', model: 'fullerton-bay-hotel', hide: [184297025,406900561,986973997], hideRelations: [13262095] },
    { id: 'raffles-place-mrt', name: 'Raffles Place MRT', model: 'raffles-place-mrt', hide: [106193387,106193391] },
    // Raffles Hotel and Arcade: separate suite-wing ways plus the two enclosing multipolygons. These are not
    // Raffles City (across Bras Basah Road). The model keeps the gardens, Lawn and Arcade square open.
    { id: 'raffles-hotel', name: 'Raffles Hotel', model: 'raffles-hotel', hide: [
      254815862,254815935,254815936,254815939,254815947,254815951,254815960,254815966,254815967,254815972,
      254815973,254815975,254815979,254815983,254815989,254815992,254815995,254816004,254816006,254816008,
      254816010,254816011,254816013,254816015,254816017,254816022,254816025,254816029,254816030,254816031,
      254816032,254816033,254816036,254816039,254816040,254816041,254816042,254816043,254816044,254816046,
      254816048,254816055,254833690,254833691,254833693,1228813829,1228813830
    ], hideRelations: [3413910,3413596] },
    // Marina One: the offices' outline, the West and East Towers, their bronze stair shafts, the glass corner crowns
    // and their chimneys (941456992–97), and the two residences
    { id: 'marina-one', name: 'Marina One', model: 'marina-one', hide: [463857949, 463857945, 463857946, 463857947, 463857948,
      941456992, 941456993, 941456994, 941456995, 941456996, 941456997, 463858904, 463858905] },
    // DUO: the Residences (its stack of parts and its outline), the Tower (its stack and outline; 432375290 repeats its
    // base), and the Duo Galleria's outline and the low parts of it between and beside the towers
    { id: 'duo', name: 'DUO', model: 'duo', hide: [427064874, 432375288, 432375292, 432375294, 560240330, 432375289, 432375290, 432375291,
      432375293, 560240322, 560240325, 560240327, 560275084, 560275278] },
    // SG-039: the market outline and all eight radial roof wedges; the adjacent restaurant and canopies remain.
    { id: 'lau-pa-sat', name: 'Lau Pa Sat', model: 'lau-pa-sat', hide: [45098520,
      463863828,463863829,463863830,463863831,463863832,463863833,463863834,463863835] },
    // SG-242: the prayer hall, domes, four minarets and pinnacles; the separate annexe 190945743 remains mapped.
    { id: 'sultan-mosque', name: 'Sultan Mosque', model: 'sultan-mosque', hide: [
      155990076,685610171,694102548,694102549,
      1165450368,1165450369,1165450370,1165450371,1165450372,1165450373,1165450374,
      1165450375,1165450376,1165450377,1165450378,1165450379,1165450380,
      1165452713,1165452714,1165452715,1165452716,1165452717,1165452718,1165452719,
      1165452720,1165452721,1165452722,1165452723,1165452724,1165452725,1165452726,
      1165452727,1165452728,1165452729,1165452730,1165452731,1165452732,1165452733,
      1165452734,1165452735,1165452736,1165452737,1165452738,1165452739,1165452740] }
  ],
  // The rest of the island beyond the detail box, streamed in tiles of buildings & main roads around the player
  // (tools/city/fetch-island.mjs, tools/city/tiles.mjs, js/city-tiles.js): [south, west, north, east]
  island: { box: [1.20, 103.59, 1.475, 104.09], fetchCell: 0.055, tile: 1500 },
  // Map labels: 0 regions, 1 waters, 2 neighbourhoods (the districts above are labelled too)
  labels: [
    { name: 'MARINA BAY', at: [1.2860, 103.8575], kind: 1 },
    { name: 'SINGAPORE RIVER', at: [1.2878, 103.8475], kind: 1 },
    { name: 'KALLANG BASIN', at: [1.3030, 103.8710], kind: 1 },
    { name: 'SINGAPORE STRAIT', at: [1.2640, 103.8640], kind: 1 },
    { name: 'MARINA SOUTH', at: [1.2740, 103.8620], kind: 2 },
    { name: 'MARINA EAST', at: [1.2880, 103.8720], kind: 2 }
  ]
};
