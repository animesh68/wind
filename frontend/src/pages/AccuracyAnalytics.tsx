import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ZAxis,
} from 'recharts';
import { api } from '../services/api';
import type { AccuracySummaryResponse } from '../types';
import { KpiCard } from '../components/cards/KpiCard';
import { Filter, RotateCcw, Loader2, Info } from 'lucide-react';

interface AccuracyAnalyticsProps {
  cutoffTime: string;
  matchingMode: string;
}

export const AccuracyAnalytics: React.FC<AccuracyAnalyticsProps> = ({ cutoffTime, matchingMode }) => {
  const [data, setData] = useState<AccuracySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');
  const [hourFrom, setHourFrom] = useState<number>(0);
  const [hourTo, setHourTo] = useState<number>(23);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAccuracySummary({
        startDate,
        endDate,
        hourFrom,
        hourTo,
        cutoff: cutoffTime,
        matchingMode: matchingMode,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load accuracy analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, hourFrom, hourTo, cutoffTime, matchingMode]);

  const handleResetFilters = () => {
    setStartDate('2026-01-01');
    setEndDate('2026-01-31');
    setHourFrom(0);
    setHourTo(23);
  };

  const tooltipStyle = {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E5DE',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace',
    color: '#29332E',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#E2E5DE] gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#29332E] tracking-tight font-heading">
            Accuracy Analytics & Error Quantification
          </h2>
          <p className="text-xs text-[#68736C] mt-1">
            Statistical distribution, diurnal profiles, scatter correlations, and systematic bias evaluation.
          </p>
        </div>

        {/* Dynamic Filtering Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-[#E2E5DE] p-2 rounded-lg text-xs font-mono shadow-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-[#285C46]" />
            <span className="text-[#68736C]">Date:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E] px-2 py-0.5 rounded text-xs focus:outline-none hover:border-[#658A70]"
            />
            <span className="text-[#89928A]">to</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E] px-2 py-0.5 rounded text-xs focus:outline-none hover:border-[#658A70]"
            />
          </div>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-[#E2E5DE]">
            <span className="text-[#68736C]">Hours:</span>
            <select
              value={hourFrom}
              onChange={(e) => setHourFrom(Number(e.target.value))}
              className="bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E] px-1.5 py-0.5 rounded text-xs focus:outline-none hover:border-[#658A70]"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
            <span className="text-[#89928A]">to</span>
            <select
              value={hourTo}
              onChange={(e) => setHourTo(Number(e.target.value))}
              className="bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E] px-1.5 py-0.5 rounded text-xs focus:outline-none hover:border-[#658A70]"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            className="p-1 hover:bg-[#F5F5F0] text-[#68736C] hover:text-[#285C46] rounded transition ml-1"
            title="Reset to Full January 2026"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center space-y-2">
          <Loader2 className="w-7 h-7 text-[#285C46] animate-spin" />
        </div>
      ) : error || !data ? (
        <div className="p-6 rounded-lg bg-[#FDF2F2] border border-[#B95D55]/30 text-center text-[#B95D55] text-xs font-mono">
          {error || 'Error loading accuracy metrics'}
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              title="MAE"
              value={data.metrics.mae_mw.toFixed(1)}
              unit="MW"
              subtitle="Mean Absolute Error"
              badge={{ label: 'Primary', variant: 'warning' }}
            />
            <KpiCard
              title="RMSE"
              value={data.metrics.rmse_mw.toFixed(1)}
              unit="MW"
              subtitle="Square-error penalised"
              badge={{ label: 'Spread', variant: 'neutral' }}
            />
            <KpiCard
              title="MBE"
              value={data.metrics.mbe_mw > 0 ? `+${data.metrics.mbe_mw.toFixed(1)}` : data.metrics.mbe_mw.toFixed(1)}
              unit="MW"
              subtitle="Systemic bias tendency"
              badge={{ label: data.metrics.mbe_mw > 0 ? 'Over' : 'Under', variant: 'info' }}
            />
            <KpiCard
              title="WAPE"
              value={`${data.metrics.wape_percent.toFixed(1)}%`}
              subtitle="Weighted abs % error"
              badge={{ label: 'WAPE', variant: 'neutral' }}
            />
            <KpiCard
              title="Accuracy"
              value={`${data.metrics.accuracy_indicator_percent.toFixed(1)}%`}
              subtitle="100 - WAPE indicator"
              badge={{ label: 'Derived', variant: 'success' }}
              highlight
            />
            <KpiCard
              title="Peak Error"
              value={data.metrics.max_absolute_error_mw.toFixed(0)}
              unit="MW"
              subtitle="Single interval maximum"
              badge={{ label: 'Extreme', variant: 'neutral' }}
            />
          </div>

          {/* Analytical Interpretation Callout */}
          <div className="rounded-lg border-l-4 border-l-[#285C46] border border-[#E2E5DE] bg-white p-4 flex items-start space-x-3 shadow-xs">
            <Info className="w-5 h-5 text-[#285C46] shrink-0 mt-0.5" />
            <div className="text-xs text-[#29332E] leading-relaxed font-mono">
              <span className="font-bold text-[#285C46] mr-1">Quantitative Evaluation:</span>
              {data.observations_text}
            </div>
          </div>

          {/* Charts Row 1: Daily Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily MAE Trend */}
            <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                Daily Mean Absolute Error (MW)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily_metrics} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                    <XAxis
                      dataKey="settlement_date"
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      tickFormatter={(d) => d.substring(8, 10)}
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      unit=" MW"
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="mae_mw" name="Daily MAE (MW)" fill="#C58B38" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily WAPE Trend */}
            <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                Daily WAPE (%) & Derived Accuracy (%)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.daily_metrics} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                    <XAxis
                      dataKey="settlement_date"
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      tickFormatter={(d) => d.substring(8, 10)}
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      unit="%"
                      domain={[0, 'auto']}
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="wape_percent" name="WAPE (%)" stroke="#C58B38" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="accuracy_indicator_percent" name="Accuracy Indicator (%)" stroke="#285C46" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Scatter Correlation & Error Histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Correlation Scatter Plot: Actual vs Forecast */}
            <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                  Forecast vs Actual Generation Correlation
                </h3>
                <span className="text-[11px] font-mono text-[#89928A]">MW vs MW</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" />
                    <XAxis
                      type="number"
                      dataKey="actual_mw"
                      name="Actual Generation"
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      unit=" MW"
                      domain={[0, 'auto']}
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="number"
                      dataKey="forecast_mw"
                      name="DA Forecast"
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      unit=" MW"
                      domain={[0, 'auto']}
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <ZAxis range={[20, 20]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3', stroke: '#68736C' }}
                      contentStyle={tooltipStyle}
                      formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
                    />
                    <Scatter name="Intervals" data={data.scatter_points} fill="#658A70" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Error Distribution Histogram */}
            <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                  Forecast Error Frequency Distribution
                </h3>
                <span className="text-[11px] font-mono text-[#89928A]">error = forecast - actual (MW)</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.error_histogram} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                    <XAxis
                      dataKey="bin_center"
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#68736C', fontSize: 10 }}
                      unit="%"
                      axisLine={{ stroke: '#E2E5DE' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(center) => `Error Center: ${Number(center).toFixed(0)} MW`}
                      formatter={(val: any) => [`${val}% of intervals`, 'Frequency']}
                    />
                    <Bar dataKey="percentage" name="% Frequency" fill="#729C86" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Diurnal Error Profile (Hour of Day) */}
          <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                Diurnal Error Profile — Hour of Day (00:00 to 23:00)
              </h3>
              <span className="text-[11px] font-mono text-[#89928A]">Mean Absolute Error across 24 hours</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.hourly_metrics} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                  <XAxis
                    dataKey="hour_label"
                    tick={{ fill: '#68736C', fontSize: 10 }}
                    axisLine={{ stroke: '#E2E5DE' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#68736C', fontSize: 10 }}
                    unit=" MW"
                    axisLine={{ stroke: '#E2E5DE' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#68736C', fontSize: 10 }}
                    unit="%"
                    axisLine={{ stroke: '#E2E5DE' }}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="mae_mw" name="Hourly MAE (MW)" fill="#C58B38" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="wape_percent" name="Hourly WAPE (%)" stroke="#285C46" strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
