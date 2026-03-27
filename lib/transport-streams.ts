import { GlobeEvent } from "@/lib/transport";

type StreamKind = "ships" | "whales";

export type StreamState = {
  connected: boolean;
  source: string;
  fallback: boolean;
  messages: number;
  reconnects: number;
  lastMessageAt: string | null;
  lastError: string | null;
};

type LayerSnapshot = {
  events: GlobeEvent[];
  state: StreamState;
};

const MAX_EVENTS = 120;

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pseudoLatLng(seed: string) {
  const h = stableHash(seed);
  const lat = -70 + (h % 14000) / 100;
  const lng = -170 + (Math.floor(h / 7) % 34000) / 100;
  return { lat, lng };
}

function pushBounded<T>(arr: T[], item: T, max: number) {
  arr.unshift(item);
  if (arr.length > max) {
    arr.length = max;
  }
}

class RealtimeStream {
  private ws: WebSocket | null = null;
  private timer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1500;
  private readonly events: GlobeEvent[] = [];
  private state: StreamState;

  constructor(
    private readonly kind: StreamKind,
    private readonly source: string,
    private readonly connectUrl: string,
    private readonly initPayload: (() => string | null) | null,
    private readonly normalize: (raw: unknown) => GlobeEvent | null,
    private readonly enabled: () => boolean,
  ) {
    this.state = {
      connected: false,
      source,
      fallback: true,
      messages: 0,
      reconnects: 0,
      lastMessageAt: null,
      lastError: null,
    };
  }

  start() {
    if (this.ws || this.timer) {
      return;
    }

    if (!this.enabled()) {
      this.state.fallback = true;
      this.state.lastError = `${this.kind} stream key not configured`;
      return;
    }

    if (typeof WebSocket === "undefined") {
      this.state.fallback = true;
      this.state.lastError = "WebSocket client unavailable in runtime";
      return;
    }

    this.open();
  }

  snapshot(): LayerSnapshot {
    return {
      events: [...this.events],
      state: { ...this.state },
    };
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.state.connected = false;
    this.state.fallback = true;
  }

  resetBackoffAndReconnect() {
    this.reconnectDelay = 1500;
    this.stop();
    this.start();
  }

  inject(event: GlobeEvent) {
    pushBounded(this.events, event, MAX_EVENTS);
    this.state.messages += 1;
    this.state.lastMessageAt = new Date().toISOString();
  }

  private open() {
    try {
      const socket = new WebSocket(this.connectUrl);
      this.ws = socket;

      socket.onopen = () => {
        this.state.connected = true;
        this.state.fallback = false;
        this.state.lastError = null;
        this.reconnectDelay = 1500;

        const payload = this.initPayload?.();
        if (payload) {
          socket.send(payload);
        }
      };

      socket.onmessage = (event) => {
        this.state.messages += 1;
        this.state.lastMessageAt = new Date().toISOString();

        try {
          const parsed = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          const normalized = this.normalize(parsed);
          if (normalized) {
            pushBounded(this.events, normalized, MAX_EVENTS);
          }
        } catch {
          // ignore malformed packet
        }
      };

      socket.onerror = () => {
        this.state.lastError = `${this.kind} stream socket error`;
      };

      socket.onclose = () => {
        this.state.connected = false;
        this.ws = null;
        this.scheduleReconnect();
      };
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : "unknown websocket error";
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.enabled()) {
      this.state.fallback = true;
      return;
    }

    this.state.reconnects += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.open();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
  }
}

function normalizeShip(raw: any): GlobeEvent | null {
  const report =
    raw?.Message?.PositionReport ??
    raw?.Message?.StandardClassBPositionReport ??
    raw?.PositionReport ??
    raw;

  const lat = Number(report?.Latitude ?? report?.lat ?? report?.latitude);
  const lng = Number(report?.Longitude ?? report?.lon ?? report?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const mmsi = String(report?.UserID ?? report?.MMSI ?? report?.mmsi ?? "unknown");
  return {
    id: `ship-${mmsi}-${Date.now()}`,
    layer: "ships",
    lat,
    lng,
    title: `AIS Vessel ${mmsi}`,
    severity: "low",
    meta: {
      source: "aisstream",
      mmsi,
    },
  };
}

function normalizeWhale(raw: any): GlobeEvent | null {
  const tx = raw?.transaction ?? raw?.data ?? raw;
  const amount = Number(tx?.amount_usd ?? tx?.amount ?? tx?.value ?? 0);
  const id = String(tx?.id ?? tx?.hash ?? tx?.tx_hash ?? Date.now());

  const from = String(tx?.from?.owner ?? tx?.from?.address ?? tx?.from ?? "unknown");
  const to = String(tx?.to?.owner ?? tx?.to?.address ?? tx?.to ?? "unknown");
  const { lat, lng } = pseudoLatLng(`${id}:${from}:${to}`);

  if (!id) {
    return null;
  }

  return {
    id: `whale-${id}`,
    layer: "whales",
    lat,
    lng,
    title: `Whale ${amount ? `$${Math.round(amount).toLocaleString()}` : "transfer"}`,
    severity: amount > 5_000_000 ? "high" : amount > 1_000_000 ? "medium" : "low",
    meta: {
      source: "whale-alert",
      from,
      to,
      amount: Number.isFinite(amount) ? amount : 0,
    },
  };
}

const aisKey = process.env.AISSTREAM_API_KEY;
const whaleKey = process.env.WHALE_ALERT_API_KEY;

const shipsStream = new RealtimeStream(
  "ships",
  "aisstream",
  "wss://stream.aisstream.io/v0/stream",
  () => {
    if (!aisKey) {
      return null;
    }

    return JSON.stringify({
      APIKey: aisKey,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
      FilterMessageTypes: [
        "PositionReport",
        "StandardClassBPositionReport",
        "ExtendedClassBPositionReport",
      ],
    });
  },
  normalizeShip,
  () => Boolean(aisKey),
);

const whalesStream = new RealtimeStream(
  "whales",
  "whale-alert",
  "wss://leviathan.whale-alert.io/ws",
  () => {
    if (!whaleKey) {
      return null;
    }

    return JSON.stringify({
      type: "subscribe",
      api_key: whaleKey,
      min_value_usd: 250000,
    });
  },
  normalizeWhale,
  () => Boolean(whaleKey),
);

let started = false;

function ensureStarted() {
  if (started) {
    return;
  }
  started = true;
  shipsStream.start();
  whalesStream.start();
}

export function getRealtimeTransportLayers() {
  ensureStarted();
  return {
    ships: shipsStream.snapshot(),
    whales: whalesStream.snapshot(),
  };
}


export function adminReconnectStreams() {
  ensureStarted();
  shipsStream.resetBackoffAndReconnect();
  whalesStream.resetBackoffAndReconnect();
}

export function adminInjectStreamEvent(event: GlobeEvent) {
  ensureStarted();
  if (event.layer === "ships") {
    shipsStream.inject(event);
  } else if (event.layer === "whales") {
    whalesStream.inject(event);
  }
}
