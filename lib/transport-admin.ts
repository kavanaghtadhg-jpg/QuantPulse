import {
  adminInjectStreamEvent,
  adminReconnectStreams,
  getRealtimeTransportLayers,
} from "@/lib/transport-streams";
import { GlobeEvent } from "@/lib/transport";

const RECENT_TEST_EVENTS: GlobeEvent[] = [];
const MAX_TEST_EVENTS = 40;

function pushTestEvent(event: GlobeEvent) {
  RECENT_TEST_EVENTS.unshift(event);
  if (RECENT_TEST_EVENTS.length > MAX_TEST_EVENTS) {
    RECENT_TEST_EVENTS.length = MAX_TEST_EVENTS;
  }
}

export function listTestEvents() {
  return [...RECENT_TEST_EVENTS];
}

export function injectTestEvent(
  layer: "ships" | "whales",
  title: string,
  lat: number,
  lng: number,
): GlobeEvent {
  const event: GlobeEvent = {
    id: `test-${layer}-${Date.now()}`,
    layer,
    title,
    lat,
    lng,
    severity: "low",
    meta: {
      source: "admin-test",
    },
  };
  pushTestEvent(event);
  adminInjectStreamEvent(event);
  return event;
}

export function getStreamCounters() {
  const streams = getRealtimeTransportLayers();
  return {
    ships: streams.ships.state,
    whales: streams.whales.state,
    testEvents: listTestEvents().length,
  };
}


export function requestReconnect() {
  adminReconnectStreams();
}
