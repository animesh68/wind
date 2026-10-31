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
        <Loader2 className="w-8 h-8 text-[#285C46] animate-spin" />
        <span className="text-sm font-mono text-[#68736C]">Loading January 2026 Market Analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-xl border border-[#E2E5DE] shadow-xs">
        <div className="text-[#B95D55] font-mono text-sm font-semibold">Error Loading Data</div>
        <p className="text-xs text-[#68736C]">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-md bg-[#285C46] hover:bg-[#1E4534] text-xs font-mono font-medium text-white inline-flex items-center space-x-2 transition"
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
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E2E5DE] gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#29332E] tracking-tight font-heading">
            Market Overview — January 2026
          </h2>
          <p className="text-xs text-[#68736C] mt-1">
            National wind generation forecast performance based strictly on Elexon FUELHH actuals and WINDFOR forecasts.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#68736C] bg-white border border-[#E2E5DE] rounded-lg px-3 py-1.5 self-start md:self-auto shadow-xs">
          <span>Evaluated Intervals:</span>
          <span className="text-[#285C46] font-bold">{metrics.matched_intervals}</span>
          <span className="text-[#E2E5DE]">|</span>
          <span>D-1 Cutoff:</span>
          <span className="text-[#29332E] font-semibold">{cutoffTime} Europe/London</span>
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
        <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-mono text-[#68736C] uppercase">Mean Bias Error (MBE)</div>
            <div className="text-xl font-bold font-mono text-[#29332E] mt-1">
              {metrics.mbe_mw > 0 ? `+${metrics.mbe_mw.toFixed(1)}` : metrics.mbe_mw.toFixed(1)} MW
            </div>
            <div className="text-[11px] text-[#89928A] mt-0.5">
              {metrics.mbe_mw > 0 ? 'Overforecasting bias' : 'Underforecasting bias'}
            </div>
          </div>
          <span className={`text-xs font-mono px-2 py-1 rounded border ${metrics.mbe_mw > 0 ? 'bg-[#FAF4EB] text-[#C58B38] border-[#C58B38]/30' : 'bg-[#EAF1EB] text-[#285C46] border-[#285C46]/30'}`}>
            {metrics.mbe_mw > 0 ? 'OVER' : 'UNDER'}
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-mono text-[#68736C] uppercase">Overforecasting Ratio</div>
            <div className="text-xl font-bold font-mono text-[#C58B38] mt-1">
              {metrics.overforecasting_pct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[#89928A] mt-0.5">Forecast exceeded delivered generation</div>
          </div>
          <span className="text-xs font-mono text-[#68736C] bg-[#F5F5F0] px-2 py-0.5 rounded border border-[#E2E5DE]">
            {Math.round((metrics.overforecasting_pct / 100) * metrics.matched_intervals)} intervals
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-mono text-[#68736C] uppercase">Underforecasting Ratio</div>
            <div className="text-xl font-bold font-mono text-[#658A70] mt-1">
              {metrics.underforecasting_pct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[#89928A] mt-0.5">Delivered generation exceeded forecast</div>
          </div>
          <span className="text-xs font-mono text-[#68736C] bg-[#F5F5F0] px-2 py-0.5 rounded border border-[#E2E5DE]">
            {Math.round((metrics.underforecasting_pct / 100) * metrics.matched_intervals)} intervals
          </span>
        </div>
      </div>

      {/* Main Interactive Time-Series Chart */}
      <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
              National Generation & Day-Ahead Forecast Profile
            </h3>
            <p className="text-xs text-[#68736C] mt-0.5">
              Continuous 30-minute time-series: Actual WIND (FUELHH) vs Selected Forecast (WINDFOR at {cutoffTime} Cutoff)
            </p>
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex items-center space-x-1 bg-[#F5F5F0] p-1 rounded-lg border border-[#E2E5DE] text-xs font-mono">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'all' ? 'bg-white text-[#285C46] font-semibold shadow-xs border border-[#E2E5DE]' : 'text-[#68736C] hover:text-[#29332E]'}`}
            >
              Full Month
            </button>
            <button
              onClick={() => setDateFilter('w1')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w1' ? 'bg-white text-[#285C46] font-semibold shadow-xs border border-[#E2E5DE]' : 'text-[#68736C] hover:text-[#29332E]'}`}
            >
              W1 (1-7)
            </button>
            <button
              onClick={() => setDateFilter('w2')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w2' ? 'bg-white text-[#285C46] font-semibold shadow-xs border border-[#E2E5DE]' : 'text-[#68736C] hover:text-[#29332E]'}`}
            >
              W2 (8-14)
            </button>
            <button
              onClick={() => setDateFilter('w3')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w3' ? 'bg-white text-[#285C46] font-semibold shadow-xs border border-[#E2E5DE]' : 'text-[#68736C] hover:text-[#29332E]'}`}
            >
              W3 (15-21)
            </button>
            <button
              onClick={() => setDateFilter('w4')}
              className={`px-2.5 py-1 rounded transition ${dateFilter === 'w4' ? 'bg-white text-[#285C46] font-semibold shadow-xs border border-[#E2E5DE]' : 'text-[#68736C] hover:text-[#29332E]'}`}
            >
              W4 (22-31)
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredSeries} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
              <XAxis
                dataKey="start_time"
                tick={{ fill: '#68736C', fontSize: 10 }}
                tickFormatter={(val) => {
                  if (!val) return '';
                  return val.substring(5, 10);
                }}
                minTickGap={40}
                axisLine={{ stroke: '#E2E5DE' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#68736C', fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
                domain={['auto', 'auto']}
                axisLine={{ stroke: '#E2E5DE' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
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
                stroke="#285C46"
                fill="#285C46"
                fillOpacity={0.08}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecast_mw"
                name={`Day-Ahead Forecast @ ${cutoffTime} (MW)`}
                stroke="#729C86"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="error_mw"
                name="Error (Forecast - Actual) MW"
                stroke="#C58B38"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Visualizations: Daily Profile & WAPE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Generation Comparison */}
        <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
              Daily Energy Volume (MWh)
            </h3>
            <span className="text-[11px] font-mono text-[#89928A]">Sum of (MW × 0.5h)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_summaries} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                <XAxis
                  dataKey="settlement_date"
                  tick={{ fill: '#68736C', fontSize: 10 }}
                  tickFormatter={(val) => val ? val.substring(8, 10) : ''}
                  axisLine={{ stroke: '#E2E5DE' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#68736C', fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MWh"
                  axisLine={{ stroke: '#E2E5DE' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MWh`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="actual_mwh" name="Actual Delivered MWh" fill="#285C46" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
                <Bar dataKey="forecast_mwh" name="Forecasted MWh" fill="#729C86" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily WAPE and MAE Trend */}
        <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
              Daily Forecast Error Trend (MAE & WAPE)
            </h3>
            <span className="text-[11px] font-mono text-[#89928A]">31-day variation</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily_summaries} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                <XAxis
                  dataKey="settlement_date"
                  tick={{ fill: '#68736C', fontSize: 10 }}
                  tickFormatter={(val) => val ? val.substring(8, 10) : ''}
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
                  domain={[0, 'auto']}
                  axisLine={{ stroke: '#E2E5DE' }}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="mae_mw" name="Daily MAE (MW)" fill="#C58B38" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="wape_percent" name="Daily WAPE (%)" stroke="#285C46" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic Analytical Insights */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#68736C] font-bold">
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
