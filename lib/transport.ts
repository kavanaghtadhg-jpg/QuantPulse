import { fetchJsonWithTimeout } from "@/lib/http";

export type GlobeLayer =
  | "news"
  | "ships"
  | "planes"
  | "weather"
  | "whales"
  | "sentiment"
  | "econ"
  | "forex"
  | "options"
  | "quakes";

export type GlobeEvent = {
  id: string;
  layer: GlobeLayer;
  lat: number;
  lng: number;
  title: string;
  severity?: "low" | "medium" | "high";
  meta?: Record<string, string | number>;
};

const AIRLABS_KEY = process.env.AIRLABS_KEY || "demo";
const OPEN_WEATHER_KEY = process.env.OPENWEATHER_KEY || "demo";

function randomGlobal(id: string, layer: GlobeLayer, title: string): GlobeEvent {
  return {
    id,
    layer,
    title,
    lat: -70 + Math.random() * 140,
    lng: -170 + Math.random() * 340,
    severity: "medium",
  };
}

async function quakeEvents(): Promise<GlobeEvent[]> {
  try {
    const feed = await fetchJsonWithTimeout<{
      features?: Array<{
        id: string;
        properties?: { place?: string; mag?: number };
        geometry?: { coordinates?: number[] };
      }>;
    }>("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", {
      timeoutMs: 3500,
      next: { revalidate: 300 },
    });

    const features = feed?.features ?? [];
    return features.slice(0, 20).map((f) => {
      const coords = f.geometry?.coordinates ?? [0, 0];
      return {
        id: `quake-${f.id}`,
        layer: "quakes",
        lat: Number(coords[1] ?? 0),
        lng: Number(coords[0] ?? 0),
        title: f.properties?.place || "Earthquake",
        severity:
          (f.properties?.mag ?? 0) > 5.5 ? "high" : (f.properties?.mag ?? 0) > 4 ? "medium" : "low",
        meta: { magnitude: Number(f.properties?.mag ?? 0).toFixed(1) },
      };
    });
  } catch {
    return [randomGlobal("quake-fallback", "quakes", "Seismic activity (fallback)")];
  }
}

async function planeEvents(): Promise<GlobeEvent[]> {
  try {
    const data = await fetchJsonWithTimeout<{
      response?: Array<{ lat?: number; lng?: number; flight_icao?: string }>;
    }>(`https://airlabs.co/api/v9/flights?api_key=${AIRLABS_KEY}`, {
      timeoutMs: 3500,
      cache: "no-store",
    });

    const flights = data?.response ?? [];
    if (!flights.length) {
      throw new Error("No flights");
    }

    return flights.slice(0, 30).map((flight, idx) => ({
      id: `plane-${idx}`,
      layer: "planes",
      lat: Number(flight.lat ?? 0),
      lng: Number(flight.lng ?? 0),
      title: flight.flight_icao || "Flight",
      severity: "low",
    }));
  } catch {
    return [
      randomGlobal("plane-fallback-1", "planes", "Atlantic Flight Corridor"),
      randomGlobal("plane-fallback-2", "planes", "Pacific Flight Corridor"),
    ];
  }
}

async function weatherEvents(): Promise<GlobeEvent[]> {
  const cities = [
    { name: "London", lat: 51.5072, lng: -0.1276 },
    { name: "New York", lat: 40.7128, lng: -74.006 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  ];

  const events = await Promise.all(
    cities.map(async (city, idx) => {
      try {
        const weather = await fetchJsonWithTimeout<{ weather?: Array<{ main?: string }> }>(
          `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lng}&appid=${OPEN_WEATHER_KEY}`,
          { timeoutMs: 3000, next: { revalidate: 300 } },
        );

        return {
          id: `weather-${idx}`,
          layer: "weather",
          lat: city.lat,
          lng: city.lng,
          title: `${city.name}: ${weather?.weather?.[0]?.main ?? "Weather"}`,
          severity: "medium",
        } satisfies GlobeEvent;
      } catch {
        return {
          id: `weather-${idx}`,
          layer: "weather",
          lat: city.lat,
          lng: city.lng,
          title: `${city.name}: Weather fallback`,
          severity: "low",
        } satisfies GlobeEvent;
      }
    }),
  );

  return events;
}

function staticLayer(layer: GlobeLayer, label: string, count = 8): GlobeEvent[] {
  return Array.from({ length: count }).map((_, idx) =>
    randomGlobal(`${layer}-${idx}`, layer, `${label} ${idx + 1}`),
  );
}

export async function getTransportIntel(): Promise<Record<GlobeLayer, GlobeEvent[]>> {
  const [quakes, planes, weather] = await Promise.all([quakeEvents(), planeEvents(), weatherEvents()]);

  return {
    quakes,
    planes,
    weather,
    ships: staticLayer("ships", "AIS vessel"),
    whales: staticLayer("whales", "Whale transfer"),
    sentiment: staticLayer("sentiment", "Social sentiment pulse"),
    econ: staticLayer("econ", "Macro release"),
    forex: staticLayer("forex", "FX volatility cluster"),
    options: staticLayer("options", "Options flow burst"),
    news: staticLayer("news", "Breaking headline"),
  };
}
