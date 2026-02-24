"use client";

import { X } from "lucide-react";
import type { Stats } from "@/lib/utils";

interface StatsPanelProps {
  stats: Stats;
  planName: string;
  onClose: () => void;
  compact?: boolean;
}

function ProgressBar({ value, max, gradient = "progress-green" }: { value: number; max: number; gradient?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-th-hover rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${gradient}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl p-3 bg-th-subtle border border-th-border" style={{ boxShadow: "var(--th-shadow-sm)" }}>
      <p className="text-2xl font-heading font-bold tabular-nums" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-th-ink-3 mt-0.5 font-body truncate">{label}</p>
    </div>
  );
}

export default function StatsPanel({ stats, planName, onClose, compact }: StatsPanelProps) {
  const pctApproved = stats.totalSubjects > 0 ? Math.round((stats.approved / stats.totalSubjects) * 100) : 0;
  const pctCredits = stats.totalCredits > 0 ? Math.round((stats.approvedCredits / stats.totalCredits) * 100) : 0;

  return (
    <div className={`h-full flex flex-col font-body ${compact ? "bg-th-surface max-h-[75vh]" : "bg-th-surface/95 backdrop-blur-xl"}`}>
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold text-th-ink tracking-tight">Tu progreso</h2>
          <p className="text-xs text-th-ink-3 mt-0.5">{planName}</p>
        </div>
        <button onClick={onClose} className="text-th-ink-3 hover:text-th-ink transition-colors p-1 -mr-1 -mt-0.5">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
        <div className="flex gap-2">
          <StatCard value={stats.approved} label="Aprobadas" accent="#059669" />
          <StatCard value={stats.available} label="Habilitadas" accent="#d97706" />
          <StatCard value={stats.blocked} label="Bloqueadas" accent="#78716c" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-th-ink-2">Materias</span>
              <span className="text-th-ink font-medium tabular-nums">
                {stats.approved}/{stats.totalSubjects}
                <span className="text-th-ink-3 ml-1">({pctApproved}%)</span>
              </span>
            </div>
            <ProgressBar value={stats.approved} max={stats.totalSubjects} gradient="progress-green" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-th-ink-2">Creditos</span>
              <span className="text-th-ink font-medium tabular-nums">
                {stats.approvedCredits}/{stats.totalCredits}
                <span className="text-th-ink-3 ml-1">({pctCredits}%)</span>
              </span>
            </div>
            <ProgressBar value={stats.approvedCredits} max={stats.totalCredits} gradient="progress-blue" />
          </div>

          <div
            className="flex items-center justify-between bg-th-subtle rounded-xl px-3 py-2.5 border border-th-border"
            style={{ boxShadow: "var(--th-shadow-sm)" }}
          >
            <span className="text-xs text-th-ink-2">Promedio</span>
            <span className="font-heading text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "\u2014"}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-th-ink mb-3 tracking-wide">Por nucleo</h3>
          <div className="space-y-2.5">
            {stats.byNucleus.map((ns) => {
              if (ns.total === 0) return null;
              const pct = Math.round((ns.approved / ns.total) * 100);
              return (
                <div key={ns.nucleusId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-th-ink-2 truncate mr-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ns.accent }} />
                      {ns.label}
                      {ns.minRequired !== null && (
                        <span className="text-th-ink-3 text-[11px]">(min. {ns.minRequired})</span>
                      )}
                    </span>
                    <span className="text-th-ink-3 whitespace-nowrap tabular-nums">
                      {ns.approved}/{ns.total}
                      <span className="text-th-ink-4 ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-th-hover rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: ns.accent, opacity: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {stats.availableSubjects.length > 0 && (
          <div>
            <h3 className="font-heading text-sm font-semibold text-th-ink mb-3 tracking-wide">
              Podes cursar
              <span className="text-th-ink-3 font-normal ml-1.5">({stats.availableSubjects.length})</span>
            </h3>
            <div className="space-y-1.5">
              {stats.availableSubjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs
                             bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-300/70 dark:border-amber-500/10 rounded-lg
                             px-3 py-2.5 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/[0.1]"
                >
                  <span className="text-amber-800 dark:text-amber-200/90 truncate mr-2">{s.name}</span>
                  <span className="text-amber-700 dark:text-amber-500/60 whitespace-nowrap tabular-nums text-[11px]">
                    {s.weeklyHours} hs/sem
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
