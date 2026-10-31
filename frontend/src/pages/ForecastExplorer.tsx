import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import type { DayForecastExplorerResponse, ForecastIntervalDetail } from '../types';
import { Badge } from '../components/shared/Badge';
import { Calendar, Layers, Loader2, CheckCircle } from 'lucide-react';

interface ForecastExplorerProps {
  cutoffTime: string;
}

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({ cutoffTime }) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-15');
  const [dayData, setDayData] = useState<DayForecastExplorerResponse | null>(null);
  const [selectedSp, setSelectedSp] = useState<number>(24);
  const [intervalDetail, setIntervalDetail] = useState<ForecastIntervalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available dates
  useEffect(() => {
    api.getAvailableDates().then(dates => {
      setAvailableDates(dates);
      if (dates.length > 0 && !dates.includes(selectedDate)) {
        setSelectedDate(dates[14] || dates[0]);
      }
    });
  }, []);

  // Load day data when date or cutoff changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    api.getDayForecasts(selectedDate, cutoffTime)
      .then(res => {
        setDayData(res);
      })
      .catch(err => {
        setError(err.message || 'Failed to load day forecasts');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDate, cutoffTime]);

  // Load selected interval versions
  useEffect(() => {
    if (!selectedDate || !selectedSp) return;
    api.getIntervalVersions(selectedDate, selectedSp, cutoffTime)
      .then(res => {
        setIntervalDetail(res);
      })
      .catch(err => {
        console.error('Error fetching interval versions:', err);
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
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E5DE] gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#29332E] tracking-tight font-heading">
            Forecast Explorer — Settlement Period Granularity
          </h2>
          <p className="text-xs text-[#68736C] mt-1">
            Audit day-ahead procurement decisions for every half-hour against all Elexon WINDFOR publications.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2 bg-white border border-[#E2E5DE] rounded-lg p-1.5 self-start sm:self-auto shadow-xs">
          <Calendar className="w-4 h-4 text-[#285C46] ml-1.5" />
          <span className="text-xs font-mono text-[#68736C]">Delivery Date:</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#F5F5F0] text-[#29332E] font-mono font-bold text-xs px-2.5 py-1 rounded border border-[#E2E5DE] focus:outline-none cursor-pointer hover:border-[#658A70]"
          >
            {availableDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center space-y-2">
          <Loader2 className="w-7 h-7 text-[#285C46] animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-[#FDF2F2] border border-[#B95D55]/30 text-center text-[#B95D55] text-xs font-mono">
          {error}
        </div>
      ) : dayData ? (
        <>
          {/* Day Metrics Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-white border border-[#E2E5DE] p-3 rounded-lg shadow-xs">
              <span className="text-[#68736C]">Daily Actual:</span>
              <span className="ml-2 font-bold text-[#285C46]">
                {dayData.day_metrics.total_actual_mwh.toLocaleString()} MWh
              </span>
            </div>
            <div className="bg-white border border-[#E2E5DE] p-3 rounded-lg shadow-xs">
              <span className="text-[#68736C]">Daily DA Forecast:</span>
              <span className="ml-2 font-bold text-[#29332E]">
                {dayData.day_metrics.total_forecast_mwh.toLocaleString()} MWh
              </span>
            </div>
            <div className="bg-white border border-[#E2E5DE] p-3 rounded-lg shadow-xs">
              <span className="text-[#68736C]">Day MAE:</span>
              <span className="ml-2 font-bold text-[#C58B38]">
                {dayData.day_metrics.mae_mw.toFixed(1)} MW
              </span>
            </div>
            <div className="bg-white border border-[#E2E5DE] p-3 rounded-lg shadow-xs">
              <span className="text-[#68736C]">Derived Accuracy:</span>
              <span className="ml-2 font-bold text-[#285C46]">
                {dayData.day_metrics.accuracy_indicator_percent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 48 Settlement Periods Chart */}
          <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#29332E] uppercase tracking-wider font-mono">
                  {selectedDate} — All 48 Settlement Periods
                </h3>
                <p className="text-xs text-[#68736C]">
                  Click on any point or bar in the chart to inspect its full forecast publication audit trail below.
                </p>
              </div>

              <div className="text-xs font-mono text-[#285C46] bg-[#EAF1EB] px-2.5 py-1 rounded border border-[#285C46]/20 font-semibold">
                Active SP: {selectedSp} ({String(Math.floor((selectedSp - 1) / 2)).padStart(2, '0')}:{(selectedSp - 1) % 2 === 0 ? '00' : '30'} UTC)
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dayData.intervals}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const sp = e.activePayload[0].payload?.settlement_period;
                      if (sp) setSelectedSp(sp);
                    }
                  }}
                  margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E9E3" vertical={false} />
                  <XAxis
                    dataKey="settlement_period"
                    tick={{ fill: '#68736C', fontSize: 10 }}
                    tickFormatter={(sp) => `SP${sp}`}
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
                    labelFormatter={(sp) => `Settlement Period ${sp} on ${selectedDate}`}
                    formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="actual_mw"
                    name="Delivered Actual (MW)"
                    fill="#285C46"
                    fillOpacity={0.8}
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="decision_forecast_mw"
                    name={`Decision Forecast @ ${cutoffTime} Cutoff`}
                    stroke="#729C86"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="latest_forecast_mw"
                    name="Latest Historical Forecast (Pre-Delivery)"
                    stroke="#89928A"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SP Selector Buttons Grid (1-48) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#68736C]">
              <span>Select Settlement Period (SP 1 to 48):</span>
              <span className="text-[11px] text-[#89928A]">30-min delivery intervals</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-1">
              {dayData.intervals.map((inv) => {
                const isSelected = inv.settlement_period === selectedSp;
                const err = inv.error_mw ?? 0;
                return (
                  <button
                    key={inv.settlement_period}
                    onClick={() => setSelectedSp(inv.settlement_period)}
                    className={`p-1.5 rounded text-center font-mono text-[11px] border transition shadow-xs ${
                      isSelected
                        ? 'bg-[#285C46] text-white font-bold border-[#285C46] shadow-sm'
                        : 'bg-white text-[#29332E] border-[#E2E5DE] hover:border-[#658A70]'
                    }`}
                  >
                    <div>{inv.settlement_period}</div>
                    <div className={`text-[9px] ${isSelected ? 'text-white/80' : err > 0 ? 'text-[#C58B38]' : 'text-[#658A70]'}`}>
                      {Math.abs(err) > 0 ? `${err > 0 ? '+' : ''}${Math.round(err / 1000)}k` : '-'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Interval Audit & Publication Version Table */}
          {intervalDetail && (
            <div className="rounded-xl border border-[#E2E5DE] bg-white p-5 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E5DE] gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-[#EAF1EB] border border-[#285C46]/20 flex items-center justify-center text-[#285C46]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#29332E] font-mono">
                      Settlement Period {intervalDetail.settlement_period} Audit Trail
                    </h4>
                    <span className="text-xs text-[#68736C] font-mono">
                      Target Time: {intervalDetail.start_time} (GMT)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  <div className="bg-[#F5F5F0] px-3 py-1.5 rounded border border-[#E2E5DE]">
                    <span className="text-[#68736C]">Day-Ahead Cutoff: </span>
                    <span className="text-[#285C46] font-semibold">{intervalDetail.cutoff_time}</span>
                  </div>
                  <div className="bg-[#F5F5F0] px-3 py-1.5 rounded border border-[#E2E5DE]">
                    <span className="text-[#68736C]">Total Versions: </span>
                    <span className="text-[#29332E] font-semibold">{intervalDetail.versions.length}</span>
                  </div>
                </div>
              </div>

              {/* Interval KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-[#F5F5F0] p-3 rounded-lg border border-[#E2E5DE]">
                  <div className="text-[#68736C] uppercase text-[10px]">Actual Delivered</div>
                  <div className="text-base font-bold text-[#285C46] mt-1">
                    {intervalDetail.actual_mw?.toLocaleString() ?? 'N/A'} MW
                  </div>
                </div>

                <div className="bg-[#F5F5F0] p-3 rounded-lg border border-[#E2E5DE]">
                  <div className="text-[#68736C] uppercase text-[10px]">Decision-Time Forecast</div>
                  <div className="text-base font-bold text-[#29332E] mt-1">
                    {intervalDetail.decision_forecast_mw?.toLocaleString() ?? 'N/A'} MW
                  </div>
                  <div className="text-[10px] text-[#89928A] mt-0.5">
                    Published: {intervalDetail.selected_publish_time?.substring(11, 16) ?? 'None'}
                  </div>
                </div>

                <div className="bg-[#F5F5F0] p-3 rounded-lg border border-[#E2E5DE]">
                  <div className="text-[#68736C] uppercase text-[10px]">Forecast Error</div>
                  <div className={`text-base font-bold mt-1 ${
                    (intervalDetail.error_mw ?? 0) > 0 ? 'text-[#C58B38]' : 'text-[#658A70]'
                  }`}>
                    {intervalDetail.error_mw !== null ? `${intervalDetail.error_mw > 0 ? '+' : ''}${intervalDetail.error_mw.toFixed(1)} MW` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-[#89928A] mt-0.5">
                    {intervalDetail.error_mw !== null && intervalDetail.error_mw > 0 ? 'Overforecast' : 'Underforecast'}
                  </div>
                </div>

                <div className="bg-[#F5F5F0] p-3 rounded-lg border border-[#E2E5DE]">
                  <div className="text-[#68736C] uppercase text-[10px]">Latest Pre-Delivery Forecast</div>
                  <div className="text-base font-bold text-[#68736C] mt-1">
                    {intervalDetail.latest_forecast_mw?.toLocaleString() ?? 'N/A'} MW
                  </div>
                  <div className="text-[10px] text-[#89928A] mt-0.5">
                    Revision from DA: {intervalDetail.latest_forecast_mw && intervalDetail.decision_forecast_mw ? `${(intervalDetail.latest_forecast_mw - intervalDetail.decision_forecast_mw).toFixed(1)} MW` : '-'}
                  </div>
                </div>
              </div>

              {/* Version History Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#29332E] font-semibold uppercase">Publication History</span>
                  <span className="text-[#89928A] text-[11px]">Strictly highlights latest version published on or before cutoff</span>
                </div>

                <div className="overflow-x-auto border border-[#E2E5DE] rounded-lg">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#F5F5F0] text-[#68736C] border-b border-[#E2E5DE]">
                      <tr>
                        <th className="py-2.5 px-3">Publish Time (UTC)</th>
                        <th className="py-2.5 px-3">Lead Time</th>
                        <th className="py-2.5 px-3">Forecast (MW)</th>
                        <th className="py-2.5 px-3">Cutoff Eligibility</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Error vs Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E9E3]">
                      {intervalDetail.versions.map((ver, idx) => {
                        const err = intervalDetail.actual_mw !== null ? ver.generation_mw - intervalDetail.actual_mw : null;
                        return (
                          <tr
                            key={idx}
                            className={`transition ${
                              ver.is_selected
                                ? 'bg-[#EAF1EB] text-[#285C46] font-semibold border-l-4 border-l-[#285C46]'
                                : 'hover:bg-[#F5F5F0]/60 text-[#29332E]'
                            }`}
                          >
                            <td className="py-2.5 px-3 flex items-center space-x-1.5">
                              {ver.is_selected && <CheckCircle className="w-3.5 h-3.5 text-[#285C46] shrink-0" />}
                              <span>{ver.publish_time}</span>
                            </td>
                            <td className="py-2.5 px-3 text-[#68736C]">{ver.lead_time_hours} hrs</td>
                            <td className="py-2.5 px-3 font-semibold text-[#29332E]">{ver.generation_mw.toLocaleString()} MW</td>
                            <td className="py-2.5 px-3">
                              {ver.is_eligible ? (
                                <Badge label="Eligible (<= Cutoff)" variant="success" />
                              ) : (
                                <Badge label="Ineligible (Post-Cutoff)" variant="warning" />
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {ver.is_selected ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#285C46] text-white">
                                  SELECTED FOR PROCUREMENT
                                </span>
                              ) : (
                                <span className="text-[#89928A] text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {err !== null ? (
                                <span className={err > 0 ? 'text-[#C58B38]' : 'text-[#658A70]'}>
                                  {err > 0 ? `+${err.toFixed(0)}` : err.toFixed(0)} MW
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
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
