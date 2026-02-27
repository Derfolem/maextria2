import { supabase } from './supabase';

export type MarketingEventType =
  | 'course_search'
  | 'course_click'
  | 'course_cta_click'
  | 'trilha_start_click'
  | 'trilha_start_success'
  | 'signup_success'
  | 'login_success';

type MarketingEventPayload = {
  courseId?: string;
  courseTitle?: string;
  searchTerm?: string;
  resultCount?: number;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = 'maextria_session_id';

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  let sessionId = window.localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const trackMarketingEvent = async (
  eventType: MarketingEventType,
  payload: MarketingEventPayload = {}
) => {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  const searchTerm = payload.searchTerm?.trim();

  const { error } = await supabase.from('marketing_events').insert({
    session_id: sessionId,
    event_type: eventType,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    course_id: payload.courseId || null,
    course_title: payload.courseTitle || null,
    search_term: searchTerm || null,
    result_count: Number.isFinite(payload.resultCount) ? payload.resultCount : null,
    metadata: payload.metadata || {},
  });

  if (error) {
    console.error('Marketing event error:', error.message);
  }
};
