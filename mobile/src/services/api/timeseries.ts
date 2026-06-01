/** Service séries temporelles (lecture seule côté mobile). */
import { apiRequest } from '@/services/api/client';
import type {
  ActivityEvent,
  CgmReading,
  InsulinEvent,
  MealEvent,
  TimeseriesQuery,
} from '@/types/api';

function toQueryString(q: TimeseriesQuery): string {
  const params = new URLSearchParams();
  if (q.patient_id) params.set('patient_id', q.patient_id);
  if (q.start) params.set('start', q.start);
  if (q.end) params.set('end', q.end);
  if (q.limit != null) params.set('limit', String(q.limit));
  if (q.offset != null) params.set('offset', String(q.offset));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function getCgm(q: TimeseriesQuery = {}): Promise<CgmReading[]> {
  return apiRequest<CgmReading[]>(`/timeseries/cgm${toQueryString(q)}`);
}

export async function getInsulin(
  q: TimeseriesQuery = {},
): Promise<InsulinEvent[]> {
  return apiRequest<InsulinEvent[]>(`/timeseries/insulin${toQueryString(q)}`);
}

export async function getMeals(q: TimeseriesQuery = {}): Promise<MealEvent[]> {
  return apiRequest<MealEvent[]>(`/timeseries/meals${toQueryString(q)}`);
}

export async function getActivity(
  q: TimeseriesQuery = {},
): Promise<ActivityEvent[]> {
  return apiRequest<ActivityEvent[]>(`/timeseries/activity${toQueryString(q)}`);
}
