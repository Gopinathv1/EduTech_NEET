/** Browser signals only. They never participate in eligibility or scoring. */
export const MONITORING_EVENT_TYPES = [
  'TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT',
  'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CONTEXT_MENU_ATTEMPT',
  'TAB_VISIBLE', 'WINDOW_FOCUS', 'FULLSCREEN_ENTER',
] as const;

export type MonitoringEventType = typeof MONITORING_EVENT_TYPES[number];

export const MONITORING_EVENT_LABELS: Record<MonitoringEventType, string> = {
  TAB_HIDDEN: 'Tab hidden',
  WINDOW_BLUR: 'Window lost focus',
  FULLSCREEN_EXIT: 'Fullscreen exit',
  COPY_ATTEMPT: 'Copy attempt',
  PASTE_ATTEMPT: 'Paste attempt',
  CONTEXT_MENU_ATTEMPT: 'Context menu attempt',
  TAB_VISIBLE: 'Tab visible',
  WINDOW_FOCUS: 'Window regained focus',
  FULLSCREEN_ENTER: 'Fullscreen enter',
};

export const MONITORING_MAX_BATCH = 20;
export const MONITORING_MAX_EVENTS_PER_MINUTE = 60;
export const MONITORING_MAX_EVENTS_PER_ATTEMPT = 1000;
export const MONITORING_NOTICE = 'During the test, SIVORA may record browser focus changes, tab switches, fullscreen changes, and copy/paste or context-menu attempts for test-integrity purposes. These signals do not change your score.';

/** Sequence is local to one document; server receipt time orders the history. */
export interface ClientMonitoringEvent {
  clientEventId: string;
  eventType: MonitoringEventType;
  clientTimestamp?: string;
  sequence?: number;
}
