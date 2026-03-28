import { fetchJsonWithTimeout } from "@/lib/http";
import { getRssNews } from "@/lib/news";

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

export type TransportLayerState = {
  connected: boolean;
  source: string;
  fallback: boolean;
  messages: number;
  reconnects: number;
  lastMessageAt: string | null;
  lastError: string | null;
};

export type TransportSnapshot = {
  layers: Record<GlobeLayer, GlobeEvent[]>;
  states: Partial<Record<GlobeLayer, TransportLayerState>>;
};

const AIRLABS_KEY = process.env.AIRLABS_KEY || "demo";
const OPEN_WEATHER_KEY = process.env.OPENWEATHER_KEY || "demo";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const NEWS_CITY_FALLBACKS = [
  { city: "Washington, DC", lat: 38.9072, lng: -77.0369 },
  { city: "New York", lat: 40.7128, lng: -74.006 },
  { city: "London", lat: 51.5072, lng: -0.1276 },
  { city: "Beijing", lat: 39.9042, lng: 116.4074 },
  { city: "Tokyo", lat: 35.6762, lng: 139.6503 },
] as const;

function withinBounds(lat: number, lng: number) {
  return lat >= -60 && lat <= 60 && lng >= -180 && lng <= 180;
}

function clampBounds(lat: number, lng: number) {
  const clampedLat = Math.min(60, Math.max(-60, lat));
  const clampedLng = Math.min(180, Math.max(-180, lng));
  return { lat: clampedLat, lng: clampedLng };
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function randomGlobal(id: string, layer: GlobeLayer, title: string): GlobeEvent {
  const h = stableHash(id + title);
  const lat = -60 + (h % 12000) / 100;
  const lng = -180 + (Math.floor(h / 3) % 36000) / 100;
  return {
    id,
    layer,
    title,
    lat,
    lng,
    severity: "medium",
  };
}

async function geocodeWithOpenAI(text: string): Promise<{ lat: number; lng: number } | null> {
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You geocode financial headlines. Return only strict JSON with keys lat and lng as numbers.",
          },
          {
            role: "user",
            content: `Geocode this news headline to its primary city/region center: ${text}`,
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json?.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    const parsed = JSON.parse(match[0]) as { lat?: number; lng?: number };
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return clampBounds(lat, lng);
  } catch {
    return null;
  }
}

function fallbackNewsPoint(index: number) {
  return NEWS_CITY_FALLBACKS[index % NEWS_CITY_FALLBACKS.length];
}

async function newsEvents(): Promise<GlobeEvent[]> {
  const items = await getRssNews();
  const top = items.slice(0, 24);

  const events = await Promise.all(
    top.map(async (item, index) => {
      const geo = await geocodeWithOpenAI(item.title);
      const fallback = fallbackNewsPoint(index);
      const point = geo && withinBounds(geo.lat, geo.lng) ? geo : { lat: fallback.lat, lng: fallback.lng };

      return {
        id: `news-${item.id}`,
        layer: "news",
        lat: point.lat,
        lng: point.lng,
        title: item.title,
        severity: "medium",
        meta: {
          source: item.source,
          city: geo ? "openai-geocode" : fallback.city,
        },
      } satisfies GlobeEvent;
    }),
  );

  return events.filter((event) => withinBounds(event.lat, event.lng));
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
    return features
      .slice(0, 20)
      .map((f) => {
        const coords = f.geometry?.coordinates ?? [0, 0];
        const lat = Number(coords[1] ?? 0);
        const lng = Number(coords[0] ?? 0);
        return {
          id: `quake-${f.id}`,
          layer: "quakes",
          lat,
          lng,
          title: f.properties?.place || "Earthquake",
          severity:
            (f.properties?.mag ?? 0) > 5.5 ? "high" : (f.properties?.mag ?? 0) > 4 ? "medium" : "low",
          meta: { magnitude: Number(f.properties?.mag ?? 0).toFixed(1) },
        } satisfies GlobeEvent;
      })
      .filter((item) => withinBounds(item.lat, item.lng));
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

    return flights
      .slice(0, 30)
      .map(
        (flight, idx) =>
          ({
            id: `plane-${idx}`,
            layer: "planes",
            lat: Number(flight.lat ?? 0),
            lng: Number(flight.lng ?? 0),
            title: flight.flight_icao || "Flight",
            severity: "low",
          }) satisfies GlobeEvent,
      )
      .filter((item) => withinBounds(item.lat, item.lng));
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

  return events.filter((event) => withinBounds(event.lat, event.lng));
}

function staticLayer(layer: GlobeLayer, label: string, count = 8): GlobeEvent[] {
  return Array.from({ length: count })
    .map((_, idx) => randomGlobal(`${layer}-${idx}`, layer, `${label} ${idx + 1}`))
    .filter((event) => withinBounds(event.lat, event.lng));
}

export async function getTransportIntel(): Promise<Record<GlobeLayer, GlobeEvent[]>> {
  const snapshot = await getTransportSnapshot();
  return snapshot.layers;
}

export async function getTransportSnapshot(): Promise<TransportSnapshot> {
  const [quakes, planes, weather, news] = await Promise.all([
    quakeEvents(),
    planeEvents(),
    weatherEvents(),
    newsEvents(),
  ]);

  const { getRealtimeTransportLayers } = await import("@/lib/transport-streams");
  const realtime = getRealtimeTransportLayers();

  const ships = (realtime.ships.events.length ? realtime.ships.events : staticLayer("ships", "AIS vessel")).filter(
    (event) => withinBounds(event.lat, event.lng),
  );
  const whales = (
    realtime.whales.events.length ? realtime.whales.events : staticLayer("whales", "Whale transfer")
  ).filter((event) => withinBounds(event.lat, event.lng));

  return {
    layers: {
      quakes,
      planes,
      weather,
      ships,
      whales,
      sentiment: staticLayer("sentiment", "Social sentiment pulse"),
      econ: staticLayer("econ", "Macro release"),
      forex: staticLayer("forex", "FX volatility cluster"),
      options: staticLayer("options", "Options flow burst"),
      news,
    },
    states: {
      ships: realtime.ships.state,
      whales: realtime.whales.state,
    },
  };
}
