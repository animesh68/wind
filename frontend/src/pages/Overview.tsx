import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import type { MarketOverviewResponse } from '../types';
import { KpiCard } from '../components/cards/KpiCard';
import { InsightCard } from '../components/cards/InsightCard';
import { Loader2, RefreshCw } from 'lucide-react';

interface OverviewProps {
  cutoffTime: string;
  matchingMode: string;
}

export const Overview: React.FC<OverviewProps> = ({ cutoffTime, matchingMode }) => {
  const [data, setData] = useState<MarketOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'w1' | 'w2' | 'w3' | 'w4'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMarketOverview(cutoffTime, matchingMode);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load market overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cutoffTime, matchingMode]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3 py-24">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm font-mono text-slate-400">Loading January 2026 Market Analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="text-rose-400 font-mono text-sm font-semibold">Error Loading Data</div>
        <p className="text-xs text-slate-400">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-medium text-slate-950 inline-flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { metrics, insights, daily_summaries, time_series } = data;

  // Filter time series for chart
  let filteredSeries = time_series;
  if (dateFilter === 'w1') {
    filteredSeries = time_series.filter(d => d.settlement_date <= '2026-01-07');
  } else if (dateFilter === 'w2') {
    filteredSeries = time_series.filter(d => d.settlement_date >= '2026-01-08' && d.settlement_date <= '2026-01-14');
  } else if (dateFilter === 'w3') {
    filteredSeries = time_series.filter(d => d.settlement_date >= '2026-01-15' && d.settlement_date <= '2026-01-21');
  } else if (dateFilter === 'w4') {
    filteredSeries = time_series.filter(d => d.settlement_date >= '2026-01-22');
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
            Market Overview — January 2026
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            National wind generation forecast performance based strictly on Elexon FUELHH actuals & WINDFOR forecasts.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 self-start md:self-auto">
          <span>Evaluated Intervals:</span>
          <span className="text-cyan-400 font-bold">{metrics.matched_intervals}</span>
          <span className="text-slate-600">|</span>
          <span>D-1 Cutoff:</span>
          <span className="text-cyan-300 font-semibold">{cutoffTime} Europe/London</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Actual Generation"
          value={metrics.total_actual_mwh.toLocaleString()}
          unit="MWh"
          subtitle="Delivered national wind energy across Jan 2026"
          badge={{ label: 'Actuals', variant: 'neutral' }}
        />
        <KpiCard
          title="Total Day-Ahead Forecast"
          value={metrics.total_forecast_mwh.toLocaleString()}
          unit="MWh"
          subtitle="Energy procurement baseline at D-1 cutoff"
          badge={{ label: 'Forecast', variant: 'info' }}
          highlight
        />
        <KpiCard
          title="Mean Absolute Error (MAE)"
          value={metrics.mae_mw.toFixed(1)}
          unit="MW"
          subtitle={`RMSE: ${metrics.rmse_mw.toFixed(1)} MW | Max: ${metrics.max_absolute_error_mw.toFixed(0)} MW`}
          badge={{ label: 'Error', variant: 'warning' }}
        />
        <KpiCard
          title="Derived Accuracy Indicator"
          value={`${metrics.accuracy_indicator_percent.toFixed(1)}%`}
          subtitle={`Derived from WAPE: ${metrics.wape_percent.toFixed(1)}%`}
          badge={{
            label: metrics.accuracy_indicator_percent > 80 ? 'Robust' : 'Moderate',
            variant: metrics.accuracy_indicator_percent > 80 ? 'success' : 'warning',
          }}
          highlight
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Mean Bias Error (MBE)</div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {metrics.mbe_mw > 0 ? `+${metrics.mbe_mw.toFixed(1)}` : metrics.mbe_mw.toFixed(1)} MW
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.mbe_mw > 0 ? 'Overforecasting bias' : 'Underforecasting bias'}
            </div>
          </div>
          <span className={`text-xs font-mono px-2 py-1 rounded border ${metrics.mbe_mw > 0 ? 'bg-amber-950/60 text-amber-400 border-amber-800/60' : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'}`}>
            {metrics.mbe_mw > 0 ? 'OVER' : 'UNDER'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Overforecasting Ratio</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {metrics.overforecasting_pct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Forecast exceeded delivered generation</div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {Math.round((metrics.overforecasting_pct / 100) * metrics.matched_intervals)} intervals
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Underforecasting Ratio</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {metrics.underforecasting_pct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Delivered generation exceeded forecast</div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {Math.round((metrics.underforecasting_pct / 100) * metrics.matched_intervals)} intervals
          </span>
        </div>
      </div>

      {/* Main Interactive Time-Series Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              National Generation & Day-Ahead Forecast Profile
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous 30-minute time-series: Actual WIND (FUELHH) vs Selected Forecast (WINDFOR at {cutoffTime} Cutoff)
            </p>
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Full Month
            </button>
            <button
              onClick={() => setDateFilter('w1')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w1' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              W1 (1-7)
            </button>
            <button
              onClick={() => setDateFilter('w2')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w2' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              W2 (8-14)
            </button>
            <button
              onClick={() => setDateFilter('w3')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w3' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              W3 (15-21)
            </button>
            <button
              onClick={() => setDateFilter('w4')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w4' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              W4 (22-31)
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredSeries} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="start_time"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => {
                  if (!val) return '';
                  return val.substring(5, 10);
                }}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                labelFormatter={(label) => `Delivery: ${label}`}
                formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="actual_mw"
                name="Delivered Actual (MW)"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecast_mw"
                name={`Day-Ahead Forecast @ ${cutoffTime} (MW)`}
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="error_mw"
                name="Error (Forecast - Actual) MW"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Visualizations: Daily Profile & WAPE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Generation Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Daily Energy Volume (MWh)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Sum of (MW × 0.5h)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_summaries} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="settlement_date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => val ? val.substring(8, 10) : ''}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MWh"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MWh`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="actual_mwh" name="Actual Delivered MWh" fill="#10b981" fillOpacity={0.8} />
                <Bar dataKey="forecast_mwh" name="Forecasted MWh" fill="#38bdf8" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily WAPE and MAE Trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Daily Forecast Error Trend (MAE & WAPE)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">31-day variation</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily_summaries} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="settlement_date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => val ? val.substring(8, 10) : ''}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  unit=" MW"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  unit="%"
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="mae_mw" name="Daily MAE (MW)" fill="#f59e0b" fillOpacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="wape_percent" name="Daily WAPE (%)" stroke="#ec4899" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic Analytical Insights */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Data-Driven Operational Observations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
};
