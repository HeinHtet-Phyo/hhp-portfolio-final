// Loads the world-atlas TopoJSON once, converts it to GeoJSON, and caches the
// result at module scope so every consumer shares a single parse.
//
// Resolution: countries-110m. Tested against 50m — at the size the Education
// map renders (~17px wide for the UK) 50m is heavily oversampled (14k path
// chars for a 17px shape) for 7x the payload, while 110m still resolves the UK
// as a distinct island (Great Britain + Northern Ireland) and Myanmar as a
// clean single outline.

import type { Feature, FeatureCollection, Geometry } from "geojson";

export type CountryFeature = Feature<Geometry, { name: string }>;

// ISO 3166-1 *numeric* codes — world-atlas keys features by these, not alpha-3.
export const GBR = "826"; // United Kingdom
export const MMR = "104"; // Myanmar
export const ATA = "010"; // Antarctica — excluded, see below

export const BRISTOL: [number, number] = [-2.5879, 51.4545];
export const YANGON: [number, number] = [96.1951, 16.8661];

let cache: Promise<CountryFeature[]> | null = null;

export function loadCountries(): Promise<CountryFeature[]> {
  if (!cache) {
    cache = Promise.all([
      import("topojson-client"),
      import("world-atlas/countries-110m.json"),
    ]).then(([topojson, mod]) => {
      const topo = (mod.default ?? mod) as never;
      const fc = topojson.feature(
        topo,
        (topo as { objects: { countries: never } }).objects.countries
      ) as unknown as FeatureCollection<Geometry, { name: string }>;
      // Antarctica is dropped at the data level, before any fitExtent/fitWidth
      // call sees it: its reach to -90° otherwise dominates the projection's
      // bounds and shrinks every inhabited landmass to fit. It is the only
      // polar geometry here — the next-southernmost features are Chile and
      // Argentina at ~-55°, which are inhabited and stay.
      return (fc.features as CountryFeature[]).filter((f) => String(f.id) !== ATA);
    });
  }
  return cache;
}
