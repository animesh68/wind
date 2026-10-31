import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { api } from '../services/api';
import type { ForecastEvolutionResponse } from '../types';
import { Calendar, GitCommit, Loader2 } from 'lucide-react';

interface ForecastEvolutionProps {
  cutoffTime: string;
}

export const ForecastEvolution: React.FC<ForecastEvolutionProps> = ({ cutoffTime }) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-15');
  const [selectedSp, setSelectedSp] = useState<number>(24);
  const [evolutionData, setEvolutionData] = useState<ForecastEvolutionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAvailableDates().then(dates => {
      setAvailableDates(dates);
      if (dates.length > 0 && !dates.includes(selectedDate)) {
        setSelectedDate(dates[14] || dates[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedSp) return;
    setLoading(true);
    setError(null);
    api.getForecastEvolution(selectedDate, selectedSp, cutoffTime)
      .then(res => {
        setEvolutionData(res);
      })
      .catch(err => {
        setError(err.message || 'Failed to load forecast evolution');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDate, selectedSp, cutoffTime]);

  return (
    <div className="space-y-6">
      {/* Title & Delivery Target Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
            Forecast Evolution & Revision Dynamics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trace how numerical weather predictions evolved across successive Elexon WINDFOR publications before delivery.
          </p>
        </div>

        {/* Target Selectors */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono self-start sm:self-auto">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-3">
            <span className="text-slate-400">Settlement Period:</span>
            <select
              value={selectedSp}
              onChange={(e) => setSelectedSp(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-cyan-300 font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>SP {i + 1} ({String(Math.floor(i / 2)).padStart(2, '0')}:{i % 2 === 0 ? '00' : '30'})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center space-y-2">
          <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
        </div>
      ) : error || !evolutionData ? (
        <div className="p-6 rounded-lg bg-rose-950/20 border border-rose-800/40 text-center text-rose-300 text-xs">
          {error || 'No evolution data available for the chosen delivery interval'}
        </div>
      ) : (
        <>
          {/* Milestone Cards: Evolution Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold">1. Earliest Forecast</span>
              <div className="text-lg font-bold text-slate-300 mt-1">
                {evolutionData.earliest_forecast_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Initial Horizon</div>
            </div>

            <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 to-cyan-950/20 p-4 shadow-sm shadow-cyan-950/30">
              <span className="text-[10px] text-cyan-400 uppercase font-bold">2. Day-Ahead Decision</span>
              <div className="text-lg font-bold text-cyan-300 mt-1">
                {evolutionData.decision_forecast_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-cyan-400/70 mt-0.5">At {cutoffTime} Cutoff</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] text-purple-400 uppercase font-bold">3. Latest Pre-Delivery</span>
              <div className="text-lg font-bold text-purple-300 mt-1">
                {evolutionData.latest_forecast_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Shortest Lead Time</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">4. Delivered Actual</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {evolutionData.actual_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">National Grid Outturn</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] text-amber-400 uppercase font-bold">5. Revision Spread</span>
              <div className="text-lg font-bold text-amber-300 mt-1">
                {evolutionData.revision_spread_mw.toFixed(0)} MW
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Max - Min Version</div>
            </div>
          </div>

          {/* Narrative Callout */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-300">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Evolution Trajectory Analysis</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {evolutionData.explanation}
            </p>
          </div>

          {/* Main Evolution Trajectory Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Forecast Trajectory vs Lead Time
                </h3>
                <p className="text-xs text-slate-400">
                  Left to right represents time advancing toward delivery (lead time decreasing).
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                Target: {evolutionData.start_time}
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData.points} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="lead_time_hours"
                    type="number"
                    reversed
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    unit=" hrs"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    unit=" MW"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                    labelFormatter={(lead) => `Lead Time: ${lead} hours before delivery`}
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {evolutionData.actual_mw !== null && (
                    <ReferenceLine
                      y={evolutionData.actual_mw}
                      label={{ value: `Actual: ${evolutionData.actual_mw.toLocaleString()} MW`, fill: '#10b981', fontSize: 11, position: 'top' }}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="generation_mw"
                    name="Forecast Publication (MW)"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0284c7' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sequential Publications Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Sequential Forecast Publications (Ascending Publication Order)
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Publish Time</th>
                    <th className="py-2.5 px-3">Lead Time</th>
                    <th className="py-2.5 px-3">Forecast (MW)</th>
                    <th className="py-2.5 px-3">Cutoff Status</th>
                    <th className="py-2.5 px-3">Selection</th>
                    <th className="py-2.5 px-3">Deviation vs Outturn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {evolutionData.points.map((pt, idx) => {
                    return (
                      <tr
                        key={idx}
                        className={`transition ${
                          pt.is_decision_forecast
                            ? 'bg-cyan-950/40 text-cyan-200 font-semibold'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3">{pt.publish_time}</td>
                        <td className="py-2.5 px-3 text-slate-400">{pt.lead_time_hours} hrs</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100">{pt.generation_mw.toLocaleString()} MW</td>
                        <td className="py-2.5 px-3">
                          {pt.is_before_cutoff ? (
                            <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px]">
                              Before Cutoff
                            </span>
                          ) : (
                            <span className="text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px]">
                              Post-Cutoff Revision
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {pt.is_decision_forecast ? (
                            <span className="text-slate-950 bg-cyan-400 font-bold px-2 py-0.5 rounded text-[10px]">
                              DA PROCUREMENT BASELINE
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {pt.error_vs_actual_mw !== null ? (
                            <span className={pt.error_vs_actual_mw > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                              {pt.error_vs_actual_mw > 0 ? `+${pt.error_vs_actual_mw.toFixed(0)}` : pt.error_vs_actual_mw.toFixed(0)} MW
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
