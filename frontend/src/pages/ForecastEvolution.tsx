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
      {/* Title & Delivery Target Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E5DE] gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#29332E] tracking-tight font-heading">
            Forecast Evolution & Revision Dynamics
          </h2>
          <p className="text-xs text-[#68736C] mt-1">
            Trace how numerical weather predictions evolved across successive Elexon WINDFOR publications before delivery.
          </p>
        </div>

        {/* Target Selectors */}
        <div className="flex items-center space-x-3 bg-white border border-[#E2E5DE] p-2 rounded-lg text-xs font-mono self-start sm:self-auto shadow-xs">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#285C46]" />
            <span className="text-[#68736C]">Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E] font-bold px-2 py-0.5 rounded cursor-pointer hover:border-[#658A70]"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-[#E2E5DE] pl-3">
            <span className="text-[#68736C]">SP:</span>
            <select
              value={selectedSp}
              onChange={(e) => setSelectedSp(Number(e.target.value))}
              className="bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E] font-bold px-2 py-0.5 rounded cursor-pointer hover:border-[#658A70]"
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
          <Loader2 className="w-7 h-7 text-[#285C46] animate-spin" />
        </div>
      ) : error || !evolutionData ? (
        <div className="p-6 rounded-lg bg-[#FDF2F2] border border-[#B95D55]/30 text-center text-[#B95D55] text-xs font-mono">
          {error || 'No evolution data available for the chosen delivery interval'}
        </div>
      ) : (
        <>
          {/* Milestone Cards: Evolution Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 shadow-xs">
              <span className="text-[10px] text-[#89928A] uppercase font-bold">1. Earliest Forecast</span>
              <div className="text-lg font-bold text-[#29332E] mt-1">
                {evolutionData.earliest_forecast_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-[#89928A] mt-0.5">Initial Horizon</div>
            </div>

            <div className="rounded-xl border border-[#285C46]/40 bg-[#EAF1EB]/50 p-4 shadow-xs">
              <span className="text-[10px] text-[#285C46] uppercase font-bold">2. Day-Ahead Decision</span>
              <div className="text-lg font-bold text-[#285C46] mt-1">
                {evolutionData.decision_forecast_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-[#658A70] mt-0.5">At {cutoffTime} Cutoff</div>
            </div>

            <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 shadow-xs">
              <span className="text-[10px] text-[#68736C] uppercase font-bold">3. Latest Pre-Delivery</span>
              <div className="text-lg font-bold text-[#29332E] mt-1">
                {evolutionData.latest_forecast_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-[#89928A] mt-0.5">Shortest Lead Time</div>
            </div>

            <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 shadow-xs">
              <span className="text-[10px] text-[#285C46] uppercase font-bold">4. Delivered Actual</span>
              <div className="text-lg font-bold text-[#285C46] mt-1">
                {evolutionData.actual_mw?.toLocaleString() ?? 'N/A'} MW
              </div>
              <div className="text-[10px] text-[#89928A] mt-0.5">National Grid Outturn</div>
            </div>

            <div className="rounded-xl border border-[#E2E5DE] bg-white p-4 shadow-xs">
              <span className="text-[10px] text-[#C58B38] uppercase font-bold">5. Revision Spread</span>
              <div className="text-lg font-bold text-[#C58B38] mt-1">
                {evolutionData.revision_spread_mw.toFixed(0)} MW
              </div>
              <div className="text-[10px] text-[#89928A] mt-0.5">Max - Min Version</div>
            </div>
          </div>

          {/* Narrative Callout */}
          <div className="rounded-lg border-l-4 border-l-[#285C46] border border-[#E2E5DE] bg-white p-4 space-y-1 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#285C46]">
              <GitCommit className="w-4 h-4 text-[#285C46]" />
              <span>Evolution Trajectory Analysis</span>
            </div>
            <p className="text-xs text-[#29332E] leading-relaxed font-mono">
              {evolutionData.explanation}
            </p>
          </div>

          {/* Main Evolution Trajectory Chart */}
          <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                  Forecast Trajectory vs Lead Time
                </h3>
                <p className="text-xs text-[#68736C]">
                  Left to right represents time advancing toward delivery (lead time decreasing).
                </p>
              </div>
              <div className="text-xs font-mono text-[#29332E] bg-[#F5F5F0] px-2.5 py-1 rounded border border-[#E2E5DE]">
                Target: {evolutionData.start_time}
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData.points} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                  <XAxis
                    dataKey="lead_time_hours"
                    type="number"
                    reversed
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#68736C', fontSize: 10 }}
                    unit=" hrs"
                    axisLine={{ stroke: '#E2E5DE' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#68736C', fontSize: 10 }}
                    unit=" MW"
                    axisLine={{ stroke: '#E2E5DE' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(lead) => `Lead Time: ${lead} hours before delivery`}
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {evolutionData.actual_mw !== null && (
                    <ReferenceLine
                      y={evolutionData.actual_mw}
                      label={{ value: `Actual: ${evolutionData.actual_mw.toLocaleString()} MW`, fill: '#285C46', fontSize: 11, position: 'top' }}
                      stroke="#285C46"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="generation_mw"
                    name="Forecast Publication (MW)"
                    stroke="#729C86"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#285C46' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sequential Publications Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#68736C] font-bold">
              Sequential Forecast Publications (Ascending Publication Order)
            </h3>
            <div className="overflow-x-auto border border-[#E2E5DE] rounded-lg bg-white shadow-xs">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#F5F5F0] text-[#68736C] border-b border-[#E2E5DE]">
                  <tr>
                    <th className="py-2.5 px-3">Publish Time</th>
                    <th className="py-2.5 px-3">Lead Time</th>
                    <th className="py-2.5 px-3">Forecast (MW)</th>
                    <th className="py-2.5 px-3">Cutoff Status</th>
                    <th className="py-2.5 px-3">Selection</th>
                    <th className="py-2.5 px-3">Deviation vs Outturn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E9E3]">
                  {evolutionData.points.map((pt, idx) => {
                    return (
                      <tr
                        key={idx}
                        className={`transition ${
                          pt.is_decision_forecast
                            ? 'bg-[#EAF1EB] text-[#285C46] font-semibold border-l-4 border-l-[#285C46]'
                            : 'hover:bg-[#F5F5F0]/60 text-[#29332E]'
                        }`}
                      >
                        <td className="py-2.5 px-3">{pt.publish_time}</td>
                        <td className="py-2.5 px-3 text-[#68736C]">{pt.lead_time_hours} hrs</td>
                        <td className="py-2.5 px-3 font-semibold text-[#29332E]">{pt.generation_mw.toLocaleString()} MW</td>
                        <td className="py-2.5 px-3">
                          {pt.is_before_cutoff ? (
                            <span className="text-[#285C46] bg-[#EAF1EB] border border-[#285C46]/25 px-2 py-0.5 rounded text-[10px]">
                              Before Cutoff
                            </span>
                          ) : (
                            <span className="text-[#68736C] bg-[#F5F5F0] border border-[#E2E5DE] px-2 py-0.5 rounded text-[10px]">
                              Post-Cutoff Revision
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {pt.is_decision_forecast ? (
                            <span className="text-white bg-[#285C46] font-bold px-2 py-0.5 rounded text-[10px]">
                              DA PROCUREMENT BASELINE
                            </span>
                          ) : (
                            <span className="text-[#89928A] text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {pt.error_vs_actual_mw !== null ? (
                            <span className={pt.error_vs_actual_mw > 0 ? 'text-[#C58B38]' : 'text-[#658A70]'}>
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
