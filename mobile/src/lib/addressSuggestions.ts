export interface AddressSuggestion {
  id: string;
  label: string;
  address: string;
  suburb: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  storeArea: 'Durban Central' | 'Umhlanga' | 'Pinetown';
}

/**
 * Curated real KwaZulu-Natal / greater Durban street addresses within the
 * active delivery radii of Checkstar Durban Central (-29.8587, 31.0218),
 * Checkstar Umhlanga (-29.7267, 31.0856), and Checkstar Pinetown (-29.8167, 30.8833).
 */
export const DURBAN_ADDRESS_CATALOG: AddressSuggestion[] = [
  {
    id: 'dbn-1',
    label: '123 West Street, Durban Central',
    address: '123 West Street, Durban Central, Durban, 4001',
    suburb: 'Durban Central',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8587,
    longitude: 31.0218,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-2',
    label: '195 Florida Road, Morningside',
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
    label: '115 Musgrave Road, Berea',
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
    label: '320 Pixley KaSeme Street, Durban Central',
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
    label: '42 Helen Joseph Road, Glenwood',
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
    label: '88 OR Tambo Parade, North Beach',
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
    label: '14 Timeball Boulevard, Point Waterfront',
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
    label: '210 Windermere Road, Morningside',
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
    label: '50 Mackeurtan Avenue, Durban North',
    address: '50 Mackeurtan Avenue, Durban North, Durban, 4051',
    suburb: 'Durban North',
    city: 'Durban',
    postalCode: '4051',
    latitude: -29.7918,
    longitude: 31.0389,
    storeArea: 'Durban Central',
  },
  {
    id: 'dbn-10',
    label: '274 Umbilo Road, Umbilo',
    address: '274 Umbilo Road, Umbilo, Durban, 4001',
    suburb: 'Umbilo',
    city: 'Durban',
    postalCode: '4001',
    latitude: -29.8742,
    longitude: 30.9918,
    storeArea: 'Durban Central',
  },
  {
    id: 'umh-1',
    label: '45 Lighthouse Road, Umhlanga Rocks',
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
    label: '1 Palm Boulevard, Umhlanga Ridge',
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
    label: '16 Chartwell Drive, Umhlanga Rocks',
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
    label: '90 William Campbell Drive, La Lucia',
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
    label: '12 Flanders Drive, Mount Edgecombe',
    address: '12 Flanders Drive, Mount Edgecombe, Umhlanga, 4302',
    suburb: 'Mount Edgecombe',
    city: 'Umhlanga',
    postalCode: '4302',
    latitude: -29.7195,
    longitude: 31.0442,
    storeArea: 'Umhlanga',
  },
  {
    id: 'ptn-1',
    label: '78 Josiah Gumede Road, Pinetown Central',
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
    label: '34 Old Main Road, Pinetown',
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
    label: '18 Jan Hofmeyr Road, Westville',
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
    label: '52 Shepstone Road, New Germany',
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
    label: '10 Village Road, Kloof',
    address: '10 Village Road, Kloof, 3610',
    suburb: 'Kloof',
    city: 'Kloof',
    postalCode: '3610',
    latitude: -29.7912,
    longitude: 30.8342,
    storeArea: 'Pinetown',
  },
];

export function searchAddressSuggestions(query: string, limit = 5): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return DURBAN_ADDRESS_CATALOG.slice(0, limit);
  }

  const tokens = q.split(/[\s,]+/).filter(Boolean);

  return DURBAN_ADDRESS_CATALOG.map((item) => {
    const haystack = `${item.address} ${item.suburb} ${item.city} ${item.postalCode} ${item.storeArea}`.toLowerCase();
    let score = 0;
    if (haystack.startsWith(q)) score += 100;
    if (item.address.toLowerCase().includes(q)) score += 50;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 20;
    }
    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
    .slice(0, limit);
}

export function resolveAddressCoordinates(
  addressText: string,
  currentCoords?: { latitude: number; longitude: number } | null,
): { latitude: number; longitude: number } {
  const q = addressText.trim().toLowerCase();

  const exact = DURBAN_ADDRESS_CATALOG.find((a) => a.address.toLowerCase() === q);
  if (exact) {
    return { latitude: exact.latitude, longitude: exact.longitude };
  }

  const streetMatch = DURBAN_ADDRESS_CATALOG.find((a) => {
    const streetPart = a.address.split(',')[0]?.trim().toLowerCase() ?? '';
    const streetWords = streetPart.replace(/^\d+\s*/, '');
    return streetWords.length >= 5 && q.includes(streetWords);
  });
  if (streetMatch) {
    return { latitude: streetMatch.latitude, longitude: streetMatch.longitude };
  }

  if (/umhlanga|la lucia|gateway|mount edgecombe|chartwell|lighthouse/i.test(q)) {
    return { latitude: -29.7267, longitude: 31.0856 };
  }
  if (/pinetown|westville|kloof|new germany|josiah gumede/i.test(q)) {
    return { latitude: -29.8167, longitude: 30.8833 };
  }

  if (
    currentCoords &&
    currentCoords.latitude >= -30.1 &&
    currentCoords.latitude <= -29.5 &&
    currentCoords.longitude >= 30.7 &&
    currentCoords.longitude <= 31.2
  ) {
    return { latitude: currentCoords.latitude, longitude: currentCoords.longitude };
  }

  return { latitude: -29.8587, longitude: 31.0218 };
}
