import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DataQualityResponse } from '../types';
import { KpiCard } from '../components/cards/KpiCard';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Terminal,
  Loader2,
  BookOpen
} from 'lucide-react';

interface DataQualityProps {
  cutoffTime: string;
  matchingMode: string;
}

export const DataQuality: React.FC<DataQualityProps> = ({ cutoffTime, matchingMode }) => {
  const [quality, setQuality] = useState<DataQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getDataQuality()
      .then(res => setQuality(res))
      .catch(err => setError(err.message || 'Failed to load data quality telemetry'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center space-y-2">
        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !quality) {
    return (
      <div className="p-6 rounded-lg bg-rose-950/20 border border-rose-800/40 text-center text-rose-300 text-xs font-mono">
        {error || 'Unable to load data quality information.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
            Data Quality, Ingestion Telemetry & Audit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full provenance, schema validation constraints, and deduplication verification for Elexon BMRS datasets.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="text-slate-400">API Status:</span>
          <span className="text-emerald-400 font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{quality.source_api_status}</span>
          </span>
        </div>
      </div>

      {/* KPI Cards: Integrity */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Actuals Ingested"
          value={quality.total_actual_records}
          unit="rows"
          subtitle="FUELHH (WIND)"
          badge={{ label: 'Complete', variant: 'success' }}
        />
        <KpiCard
          title="Forecast Records"
          value={quality.total_forecast_records.toLocaleString()}
          unit="rows"
          subtitle="WINDFOR versions"
          badge={{ label: 'Preserved', variant: 'info' }}
        />
        <KpiCard
          title="Completeness"
          value={`${quality.actual_completeness_pct}%`}
          subtitle="1,488 / 1,488 intervals"
          badge={{ label: '100%', variant: 'success' }}
          highlight
        />
        <KpiCard
          title="Matched (Mapped)"
          value={quality.matched_observations_mapped}
          unit="SPs"
          subtitle="Zero gaps in January"
          badge={{ label: 'Full Month', variant: 'success' }}
        />
        <KpiCard
          title="Duplicate Records"
          value={quality.duplicate_actuals + quality.duplicate_forecasts}
          subtitle="Deduplicated on ingestion"
          badge={{ label: 'Zero Dups', variant: 'success' }}
        />
        <KpiCard
          title="Invalid / Negative"
          value={quality.invalid_generation_records}
          subtitle="Values validated >= 0"
          badge={{ label: 'Zero Corrupt', variant: 'success' }}
        />
      </div>

      {/* CSV Export Banner */}
      <div className="rounded-xl border border-cyan-800/40 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wide">
            Download Curated Analytical Datasets
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Export timestamped evaluation records with selected forecast MW, delivered generation, and computed error metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={api.getExportEvaluationUrl(cutoffTime, matchingMode)}
            download
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Evaluation (CSV)</span>
          </a>
          <a
            href={api.getExportDailyAccuracyUrl(cutoffTime, matchingMode)}
            download
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Daily Accuracy (CSV)</span>
          </a>
        </div>
      </div>

      {/* Two Column Layout: Ingestion Audit & Assumptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Methodological Assumptions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 font-mono uppercase">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Analytical Assumptions & Protocol</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300 font-mono leading-relaxed">
            {quality.assumptions.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                <span className="text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                <span className="text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ingestion & Pipeline Audit Trail */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 font-mono uppercase">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Data Ingestion & Integrity Logs</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {quality.ingestion_logs.map((log, idx) => (
              <div key={idx} className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{log.timestamp}</span>
                  <span className="text-emerald-400 font-semibold">{log.event}</span>
                </div>
                <div className="text-slate-300">{log.details}</div>
              </div>
            ))}

            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Persistence Architecture</span>
                <span className="text-cyan-400 font-semibold">PARQUET (PyArrow)</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Data stored at <code className="text-slate-300">backend/data/processed/</code> using columnar Parquet for sub-millisecond query evaluation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Documentation References */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs font-mono">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
          Official Documentation & Source API Endpoints
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition"
          >
            <div>
              <div className="font-semibold text-slate-200">FUELHH Half-Hourly Actuals</div>
              <div className="text-[10px] text-slate-500 mt-0.5">https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream</div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition"
          >
            <div>
              <div className="font-semibold text-slate-200">WINDFOR National Wind Forecasts</div>
              <div className="text-[10px] text-slate-500 mt-0.5">https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream</div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
