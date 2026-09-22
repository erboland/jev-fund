export type ViewStats = {
  opens: number;
  visitors: number;
};

export type ViewStore = {
  opens: number;
  visitorIds: Set<string>;
};

const VISITOR_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export function createViewStore(initial?: {
  opens?: number;
  visitorIds?: string[];
}): ViewStore {
  return {
    opens: initial?.opens ?? 0,
    visitorIds: new Set(initial?.visitorIds ?? []),
  };
}

export function statsOf(store: ViewStore): ViewStats {
  return { opens: store.opens, visitors: store.visitorIds.size };
}

export function serializeViewStore(store: ViewStore) {
  return {
    opens: store.opens,
    visitorIds: [...store.visitorIds],
  };
}

export function recordOpen(store: ViewStore, visitorId?: string): ViewStats {
  store.opens += 1;
  if (visitorId && VISITOR_ID_RE.test(visitorId)) {
    store.visitorIds.add(visitorId);
  }
  return statsOf(store);
}
