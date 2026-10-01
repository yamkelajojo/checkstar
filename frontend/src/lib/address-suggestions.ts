export interface AddressSuggestion {
  id: string
  address: string
  suburb: string
  city: string
  postalCode: string
  latitude: number
  longitude: number
  storeArea: 'Durban Central' | 'Umhlanga' | 'Pinetown'
}

/**
 * Curated real KwaZulu-Natal / greater Durban street addresses within the
 * active delivery radii of Checkstar Durban Central (-29.8587, 31.0218),
 * Checkstar Umhlanga (-29.7267, 31.0856), and Checkstar Pinetown (-29.8167, 30.8833).
 * Works 100% offline without external API keys or OSRM files.
 */
export const DURBAN_ADDRESS_CATALOG: AddressSuggestion[] = [
  // Durban Central / Berea / Morningside / Musgrave / Glenwood / Point
  {
    id: 'dbn-1',
    address: '123 West Street, Durban Central, Durban, 4001',
    suburb: 'Durban Central',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8512,
    longitude: 31.0314,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-2',
    address: '195 Florida Road, Morningside, Durban, 4001',
    suburb: 'Morningside',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8289,
    longitude: 31.0145,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-3',
    address: '115 Musgrave Road, Berea, Durban, 4001',
    suburb: 'Musgrave',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8476,
    longitude: 31.0012,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-4',
    address: '320 Pixley KaSeme Street, Durban Central, Durban, 4001',
    suburb: 'Durban Central',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8579,
    longitude: 31.0245,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-5',
    address: '42 Helen Joseph Road, Glenwood, Durban, 4001',
    suburb: 'Glenwood',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8648,
    longitude: 30.9924,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-6',
    address: '88 OR Tambo Parade, North Beach, Durban, 4001',
    suburb: 'North Beach',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8473,
    longitude: 31.0365,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-7',
    address: '14 Timeball Boulevard, Point Waterfront, Durban, 4001',
    suburb: 'Point Waterfront',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8692,
    longitude: 31.0442,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-8',
    address: '210 Windermere Road, Morningside, Durban, 4001',
    suburb: 'Morningside',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8312,
    longitude: 31.0198,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-9',
    address: '64 Anton Lembede Street, Durban Central, Durban, 4001',
    suburb: 'Durban Central',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8594,
    longitude: 31.0261,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-10',
    address: '50 Mackeurtan Avenue, Durban North, Durban, 4051',
    suburb: 'Durban North',
    city: 'Durban',
    postalCode: '4051',
    latitude: -29.7918,
    longitude: 31.0389,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-11',
    address: '274 Umbilo Road, Umbilo, Durban, 4001',
    suburb: 'Umbilo',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8742,
    longitude: 30.9918,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-12',
    address: '18 Isaiah Ntshangase Road, Stamford Hill, Durban, 4001',
    suburb: 'Stamford Hill',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8265,
    longitude: 31.0308,
    storeArea: 'Durban Central',
  },

  // Umhlanga / La Lucia / Mount Edgecombe / Gateway
  {
    id: 'umh-1',
    address: '45 Lighthouse Road, Umhlanga Rocks, Umhlanga, 4319',
    suburb: 'Umhlanga Rocks',
    city: 'Umhlanga',
    postalCode: '4319',
    latitude: -29.7267,
    longitude: 31.0856,
    storeArea: 'Umhlanga',
  },
  {
    id: 'umh-2',
    address: '1 Palm Boulevard, Umhlanga Ridge, Umhlanga, 4319',
    suburb: 'Umhlanga Ridge',
    city: 'Umhlanga',
    postalCode: '4319',
    latitude: -29.7254,
    longitude: 31.0663,
    storeArea: 'Umhlanga',
  },
  {
    id: 'umh-3',
    address: '16 Chartwell Drive, Umhlanga Rocks, Umhlanga, 4320',
    suburb: 'Umhlanga Rocks',
    city: 'Umhlanga',
    postalCode: '4320',
    latitude: -29.7278,
    longitude: 31.0849,
    storeArea: 'Umhlanga',
  },
  {
    id: 'umh-4',
    address: '90 William Campbell Drive, La Lucia, Umhlanga, 4051',
    suburb: 'La Lucia',
    city: 'Umhlanga',
    postalCode: '4051',
    latitude: -29.7542,
    longitude: 31.0641,
    storeArea: 'Umhlanga',
  },
  {
    id: 'umh-5',
    address: '24 Lagoon Drive, Umhlanga Rocks, Umhlanga, 4320',
    suburb: 'Umhlanga Rocks',
    city: 'Umhlanga',
    postalCode: '4320',
    latitude: -29.7221,
    longitude: 31.0884,
    storeArea: 'Umhlanga',
  },
  {
    id: 'umh-6',
    address: '12 Flanders Drive, Mount Edgecombe, Umhlanga, 4302',
    suburb: 'Mount Edgecombe',
    city: 'Umhlanga',
    postalCode: '4302',
    latitude: -29.7195,
    longitude: 31.0442,
    storeArea: 'Umhlanga',
  },

  // Pinetown / Westville / Kloof / New Germany
  {
    id: 'ptn-1',
    address: '78 Josiah Gumede Road, Pinetown Central, Pinetown, 3610',
    suburb: 'Pinetown Central',
    city: 'Pinetown',
    postalCode: '3610',
    latitude: -29.8167,
    longitude: 30.8833,
    storeArea: 'Pinetown',
  },
  {
    id: 'ptn-2',
    address: '34 Old Main Road, Pinetown, 3610',
    suburb: 'Pinetown',
    city: 'Pinetown',
    postalCode: '3610',
    latitude: -29.8142,
    longitude: 30.8615,
    storeArea: 'Pinetown',
  },
  {
    id: 'ptn-3',
    address: '18 Jan Hofmeyr Road, Westville, Durban, 3629',
    suburb: 'Westville',
    city: 'Westville',
    postalCode: '3629',
    latitude: -29.8295,
    longitude: 30.9284,
    storeArea: 'Pinetown',
  },
  {
    id: 'ptn-4',
    address: '52 Shepstone Road, New Germany, Pinetown, 3610',
    suburb: 'New Germany',
    city: 'Pinetown',
    postalCode: '3610',
    latitude: -29.7945,
    longitude: 30.8862,
    storeArea: 'Pinetown',
  },
  {
    id: 'ptn-5',
    address: '10 Village Road, Kloof, 3610',
    suburb: 'Kloof',
    city: 'Kloof',
    postalCode: '3610',
    latitude: -29.7912,
    longitude: 30.8342,
    storeArea: 'Pinetown',
  },
]

/**
 * Search real Durban / KZN addresses matching a user query.
 * When query is empty or short, returns top popular addresses across all 3 store areas.
 */
export function searchAddressSuggestions(query: string, limit = 6): AddressSuggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return DURBAN_ADDRESS_CATALOG.slice(0, limit)
  }

  const tokens = q.split(/[\s,]+/).filter(Boolean)

  const scored = DURBAN_ADDRESS_CATALOG.map(item => {
    const haystack = `${item.address} ${item.suburb} ${item.city} ${item.postalCode} ${item.storeArea}`.toLowerCase()
    let score = 0
    if (haystack.startsWith(q)) score += 100
    if (item.address.toLowerCase().includes(q)) score += 50
    for (const token of tokens) {
      if (haystack.includes(token)) score += 20
    }
    return { item, score }
  })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)

  return scored.slice(0, limit)
}

/**
 * Resolves coordinates from a typed address string, falling back to device/default coords
 * only if they are within KwaZulu-Natal delivery range; otherwise maps the address
 * to the matching Checkstar store area so delivery orders always resolve cleanly.
 */
export function resolveAddressCoordinates(
  addressText: string,
  currentCoords?: { latitude: number; longitude: number; usedFallback?: boolean } | null,
): { latitude: number; longitude: number } {
  const q = addressText.trim().toLowerCase()

  // 1. Exact catalog match
  const exact = DURBAN_ADDRESS_CATALOG.find(a => a.address.toLowerCase() === q)
  if (exact) {
    return { latitude: exact.latitude, longitude: exact.longitude }
  }

  // 2. Street-level catalog match (match on street name before the first comma)
  const streetMatch = DURBAN_ADDRESS_CATALOG.find(a => {
    const streetPart = a.address.split(',')[0]?.trim().toLowerCase() ?? ''
    const streetWords = streetPart.replace(/^\d+\s*/, '')
    return streetWords.length >= 5 && q.includes(streetWords)
  })
  if (streetMatch) {
    return { latitude: streetMatch.latitude, longitude: streetMatch.longitude }
  }

  // 3. Suburb / area keyword match
  if (/umhlanga|la lucia|gateway|mount edgecombe|chartwell|lighthouse/i.test(q)) {
    return { latitude: -29.7267, longitude: 31.0856 }
  }
  if (/pinetown|westville|kloof|new germany|josiah gumede/i.test(q)) {
    return { latitude: -29.8167, longitude: 30.8833 }
  }

  // 4. If currentCoords is within greater Durban bounding box, keep it
  if (
    currentCoords &&
    currentCoords.latitude >= -30.1 &&
    currentCoords.latitude <= -29.5 &&
    currentCoords.longitude >= 30.7 &&
    currentCoords.longitude <= 31.2
  ) {
    return { latitude: currentCoords.latitude, longitude: currentCoords.longitude }
  }

  // 5. Default to Durban Central flagship delivery zone (Morningside / Berea)
  return { latitude: -29.8389, longitude: 31.0145 }
}

/**
 * Resolves a human-readable street address, default label, and deliverable
 * coordinates from a GPS fix so "Use my current location" populates all
 * address form inputs immediately.
 */
export function reverseResolveAddress(
  latitude: number,
  longitude: number,
): { address: string; label: string; latitude: number; longitude: number } {
  const inDurbanBounds =
    latitude >= -30.1 &&
    latitude <= -29.5 &&
    longitude >= 30.7 &&
    longitude <= 31.2

  let closest = DURBAN_ADDRESS_CATALOG[0]
  let bestDistSq = Number.POSITIVE_INFINITY

  for (const item of DURBAN_ADDRESS_CATALOG) {
    const dLat = item.latitude - latitude
    const dLng = item.longitude - longitude
    const distSq = dLat * dLat + dLng * dLng
    if (distSq < bestDistSq) {
      bestDistSq = distSq
      closest = item
    }
  }

  return {
    address: closest.address,
    label: closest.suburb || 'Home',
    latitude: inDurbanBounds ? latitude : closest.latitude,
    longitude: inDurbanBounds ? longitude : closest.longitude,
  }
}

