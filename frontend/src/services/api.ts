import type {
  HealthResponse,
  MarketOverviewResponse,
  DayForecastExplorerResponse,
  ForecastIntervalDetail,
  AccuracySummaryResponse,
  ForecastEvolutionResponse,
  DataQualityResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let message = `API Error (${res.status}): ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) message = parsed.detail;
      else if (parsed.message) message = parsed.message;
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  getHealth: (): Promise<HealthResponse> => {
    return fetch(`${API_BASE}/api/health`).then(handleResponse<HealthResponse>);
  },

  getMarketOverview: (cutoff = '11:00', matchingMode = 'mapped'): Promise<MarketOverviewResponse> => {
    const params = new URLSearchParams({ cutoff_time: cutoff, matching_mode: matchingMode });
    return fetch(`${API_BASE}/api/overview?${params}`).then(handleResponse<MarketOverviewResponse>);
  },

  getAvailableDates: (): Promise<string[]> => {
    return fetch(`${API_BASE}/api/forecasts/dates`).then(handleResponse<string[]>);
  },

  getDayForecasts: (date: string, cutoff = '11:00'): Promise<DayForecastExplorerResponse> => {
    const params = new URLSearchParams({ cutoff_time: cutoff });
    return fetch(`${API_BASE}/api/forecasts/${date}?${params}`).then(handleResponse<DayForecastExplorerResponse>);
  },

  getIntervalVersions: (date: string, sp: number, cutoff = '11:00'): Promise<ForecastIntervalDetail> => {
    const params = new URLSearchParams({ cutoff_time: cutoff });
    return fetch(`${API_BASE}/api/forecasts/${date}/${sp}?${params}`).then(handleResponse<ForecastIntervalDetail>);
  },

  getAccuracySummary: (filters: {
    startDate?: string;
    endDate?: string;
    hourFrom?: number;
    hourTo?: number;
    cutoff?: string;
    matchingMode?: string;
  }): Promise<AccuracySummaryResponse> => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('start_date', filters.startDate);
    if (filters.endDate) params.set('end_date', filters.endDate);
    if (filters.hourFrom !== undefined) params.set('hour_from', filters.hourFrom.toString());
    if (filters.hourTo !== undefined) params.set('hour_to', filters.hourTo.toString());
    if (filters.cutoff) params.set('cutoff_time', filters.cutoff);
    if (filters.matchingMode) params.set('matching_mode', filters.matchingMode);

    return fetch(`${API_BASE}/api/analytics/summary?${params}`).then(handleResponse<AccuracySummaryResponse>);
  },

  getForecastEvolution: (date = '2026-01-15', sp = 24, cutoff = '11:00'): Promise<ForecastEvolutionResponse> => {
    const params = new URLSearchParams({
      delivery_date: date,
      settlement_period: sp.toString(),
      cutoff_time: cutoff
    });
    return fetch(`${API_BASE}/api/evolution?${params}`).then(handleResponse<ForecastEvolutionResponse>);
  },

  getDataQuality: (): Promise<DataQualityResponse> => {
    return fetch(`${API_BASE}/api/data-quality`).then(handleResponse<DataQualityResponse>);
  },

  getExportEvaluationUrl: (cutoff = '11:00', matchingMode = 'mapped') => {
    return `${API_BASE}/api/exports/evaluation.csv?cutoff_time=${cutoff}&matching_mode=${matchingMode}`;
  },

  getExportDailyAccuracyUrl: (cutoff = '11:00', matchingMode = 'mapped') => {
    return `${API_BASE}/api/exports/daily-accuracy.csv?cutoff_time=${cutoff}&matching_mode=${matchingMode}`;
  }
};
