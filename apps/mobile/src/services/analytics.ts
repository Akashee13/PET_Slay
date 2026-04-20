export type AnalyticsEventName =
  | "catalog_loaded"
  | "catalog_load_failed"
  | "product_detail_opened"
  | "product_detail_failed"
  | "order_quantity_rejected"
  | "order_submitted"
  | "order_submit_failed";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | undefined>;
};

export type Analytics = {
  track: (event: AnalyticsEventName, properties?: AnalyticsEvent["properties"]) => void;
  recordError: (event: AnalyticsEventName, error: unknown, properties?: AnalyticsEvent["properties"]) => void;
};

export function createConsoleAnalytics(): Analytics {
  return {
    track(event, properties) {
      console.info("[PET_Slay mobile analytics]", event, properties ?? {});
    },
    recordError(event, error, properties) {
      console.warn("[PET_Slay mobile analytics]", event, {
        ...properties,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    },
  };
}

export function createRecordingAnalytics(): Analytics & { events: AnalyticsEvent[] } {
  const events: AnalyticsEvent[] = [];
  return {
    events,
    track(event, properties) {
      events.push({ name: event, properties });
    },
    recordError(event, error, properties) {
      events.push({
        name: event,
        properties: {
          ...properties,
          error: error instanceof Error ? error.message : "unknown_error",
        },
      });
    },
  };
}

