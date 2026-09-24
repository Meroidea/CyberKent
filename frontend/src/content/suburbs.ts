/**
 * Approximate centres of the City of Hume's suburbs, for the schematic scam
 * map. Suburb centres, not boundaries: the map only ever places a count at a
 * suburb, never anything finer (data rule D5), and a centre is all that needs.
 *
 * Coordinates are approximate (±1 km) and are for layout only.
 */
export const SUBURB_CENTRES: Record<string, { lat: number; lng: number }> = {
  Attwood: { lat: -37.668, lng: 144.886 },
  Broadmeadows: { lat: -37.683, lng: 144.919 },
  Bulla: { lat: -37.633, lng: 144.8 },
  Campbellfield: { lat: -37.683, lng: 144.96 },
  Coolaroo: { lat: -37.655, lng: 144.928 },
  Craigieburn: { lat: -37.6, lng: 144.943 },
  Dallas: { lat: -37.672, lng: 144.936 },
  Donnybrook: { lat: -37.543, lng: 144.97 },
  "Gladstone Park": { lat: -37.689, lng: 144.885 },
  Greenvale: { lat: -37.629, lng: 144.884 },
  Jacana: { lat: -37.69, lng: 144.914 },
  Kalkallo: { lat: -37.537, lng: 144.945 },
  "Meadow Heights": { lat: -37.652, lng: 144.918 },
  "Melbourne Airport": { lat: -37.67, lng: 144.85 },
  Mickleham: { lat: -37.545, lng: 144.905 },
  "Oaklands Junction": { lat: -37.626, lng: 144.835 },
  "Roxburgh Park": { lat: -37.625, lng: 144.93 },
  Somerton: { lat: -37.643, lng: 144.948 },
  Sunbury: { lat: -37.577, lng: 144.726 },
  Tullamarine: { lat: -37.702, lng: 144.88 },
  Westmeadows: { lat: -37.674, lng: 144.894 },
  Wildwood: { lat: -37.545, lng: 144.765 },
  Yuroke: { lat: -37.585, lng: 144.878 },
};
