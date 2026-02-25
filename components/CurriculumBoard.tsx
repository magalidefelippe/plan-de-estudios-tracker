"use client";

import { useMemo, useState, useCallback } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { Subject, NucleusConfig, SubjectState } from "@/data/curriculum";
import { useStore } from "@/lib/store";
import { getApprovedIds, getSubjectState, getSubjectGrade } from "@/lib/utils";
import { NucleusIcon } from "@/lib/icons";

const STATE_STYLES: Record<
  SubjectState,
  { dot: string; cardBg: string; border: string; textPrimary: string; textSecondary: string; badge: string; badgeText: string; hoverBorder: string }
> = {
  approved: {
    dot: "bg-emerald-600 dark:bg-emerald-400",
    cardBg: "bg-emerald-50/80 dark:bg-emerald-500/[0.05]",
    border: "border-emerald-300 dark:border-emerald-500/20",
    textPrimary: "text-emerald-900 dark:text-emerald-200",
    textSecondary: "text-emerald-700 dark:text-emerald-400/60",
    badge: "bg-emerald-100 dark:bg-emerald-500/15",
    badgeText: "text-emerald-800 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500/40",
  },
  available: {
    dot: "bg-amber-600 dark:bg-amber-400",
    cardBg: "bg-amber-50/80 dark:bg-amber-500/[0.05]",
    border: "border-amber-300 dark:border-amber-500/20",
    textPrimary: "text-amber-900 dark:text-amber-200",
    textSecondary: "text-amber-700 dark:text-amber-400/60",
    badge: "bg-amber-100 dark:bg-amber-500/15",
    badgeText: "text-amber-800 dark:text-amber-400",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500/40",
  },
  blocked: {
    dot: "bg-stone-500 dark:bg-slate-600",
    cardBg: "bg-stone-100/50 dark:bg-white/[0.015]",
    border: "border-stone-300/70 dark:border-white/[0.06]",
    textPrimary: "text-stone-600 dark:text-slate-400",
    textSecondary: "text-stone-500 dark:text-slate-600",
    badge: "bg-stone-200/70 dark:bg-slate-700/40",
    badgeText: "text-stone-600 dark:text-slate-500",
    hoverBorder: "hover:border-stone-400 dark:hover:border-white/[0.12]",
  },
};

const STATE_LABELS: Record<SubjectState, string> = {
  approved: "Aprobada",
  available: "Habilitada",
  blocked: "Bloqueada",
};

interface PrereqDisplay {
  name: string;
  met: boolean;
}

interface SubjectCardData {
  subject: Subject;
  state: SubjectState;
  grade: number | null;
  prereqs: PrereqDisplay[];
}

function SubjectCard({ subject, state, grade, prereqs }: SubjectCardData) {
  const s = STATE_STYLES[state];

  return (
    <div
      className={`
        group relative rounded-xl border transition-all duration-200
        ${s.cardBg} ${s.border} ${s.hoverBorder}
        ${state === "blocked" ? "opacity-50 hover:opacity-70" : ""}
      `}
      style={{ boxShadow: "var(--th-shadow-sm)" }}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={`text-sm font-medium leading-snug font-body ${s.textPrimary} flex-1`}>
            {subject.name}
          </p>
          {grade !== null && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded-lg font-heading tabular-nums">
              {grade}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium font-heading uppercase tracking-wider text-[10px] ${s.badge} ${s.badgeText}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {STATE_LABELS[state]}
          </span>
          <span className={`${s.textSecondary} tabular-nums font-body`}>{subject.credits} cr</span>
          <span className={`${s.textSecondary} tabular-nums font-body`}>{subject.weeklyHours}h/sem</span>
        </div>

        {prereqs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-th-border/40">
            {prereqs.map((p, i) => (
              <span
                key={i}
                className={`text-[10px] leading-tight rounded px-1.5 py-0.5 font-body ${
                  p.met
                    ? "text-emerald-700/60 dark:text-emerald-400/40 bg-emerald-500/[0.07] dark:bg-emerald-500/[0.06]"
                    : "text-th-ink-3 bg-th-hover/80"
                }`}
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface NucleusSectionProps {
  config: NucleusConfig;
  cards: SubjectCardData[];
  totalCards: number;
  totalApproved: number;
  defaultOpen?: boolean;
}

function NucleusSection({ config, cards, totalCards, totalApproved, defaultOpen = true }: NucleusSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasCap = config.minRequired !== null;
  const requiredTotal = hasCap ? config.minRequired! : totalCards;
  const progressApproved = hasCap ? Math.min(totalApproved, config.minRequired!) : totalApproved;
  const pct = requiredTotal > 0 ? Math.round((progressApproved / requiredTotal) * 100) : 0;

  return (
    <section>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-1 py-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: config.accentSoft }}>
          <NucleusIcon name={config.icon} size={18} color={config.accent} strokeWidth={1.8} />
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-heading text-[15px] font-semibold tracking-tight truncate" style={{ color: config.accent }}>
              {config.label}
            </h2>
            <span className="text-xs text-th-ink-3 font-body tabular-nums whitespace-nowrap">
              {progressApproved}/{requiredTotal}
            </span>
            {hasCap && (
              <span className="text-[11px] text-th-ink-3 font-body whitespace-nowrap">
                (min. {config.minRequired} requeridas — {totalCards} disponibles)
              </span>
            )}
          </div>
          <div className="w-full max-w-[200px] h-1 bg-th-hover rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: config.accent, opacity: 0.7 }}
            />
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-th-ink-3 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-1.5 mb-7 animate-fade-in">
          {cards.map((card) => (
            <SubjectCard key={card.subject.id} {...card} />
          ))}
        </div>
      )}
    </section>
  );
}

type FilterState = "all" | SubjectState;

const FILTER_OPTIONS: { value: FilterState; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "approved", label: "Aprobadas" },
  { value: "available", label: "Habilitadas" },
  { value: "blocked", label: "Bloqueadas" },
];

export default function CurriculumBoard() {
  const { activePlan, activeApproved } = useStore();
  const [filter, setFilter] = useState<FilterState>("all");
  const [search, setSearch] = useState("");

  const cardsByNucleus = useMemo(() => {
    if (!activePlan) return [];
    const approvedIds = getApprovedIds(activeApproved);
    const subjectMap = new Map(activePlan.subjects.map((s) => [s.id, s]));

    const grouped = new Map<string, SubjectCardData[]>();
    for (const n of activePlan.nuclei) grouped.set(n.id, []);

    for (const subject of activePlan.subjects) {
      const state = getSubjectState(subject, approvedIds);
      const grade = getSubjectGrade(subject.id, activeApproved);
      const prereqs = subject.prerequisites.map((pid) => ({
        name: subjectMap.get(pid)?.name ?? pid,
        met: approvedIds.has(pid),
      }));
      grouped.get(subject.nucleusId)?.push({ subject, state, grade, prereqs });
    }

    return activePlan.nuclei
      .filter((n) => (grouped.get(n.id)?.length ?? 0) > 0)
      .map((n) => ({ config: n, cards: grouped.get(n.id)! }));
  }, [activePlan, activeApproved]);

  const currentNucleusId = useMemo(() => {
    let currentId: string | null = null;

    for (const { config, cards } of cardsByNucleus) {
      const approved = cards.filter((c) => c.state === "approved").length;
      const required = config.minRequired ?? cards.length;
      const capped = config.minRequired !== null ? Math.min(approved, config.minRequired) : approved;
      if (capped > 0 && capped < required) currentId = config.id;
    }

    if (!currentId) {
      for (const { config, cards } of cardsByNucleus) {
        if (cards.some((c) => c.state === "available")) { currentId = config.id; break; }
      }
    }

    return currentId ?? cardsByNucleus[0]?.config.id ?? null;
  }, [cardsByNucleus]);

  const filteredByNucleus = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cardsByNucleus
      .map(({ config, cards }) => {
        const totalCards = cards.length;
        const totalApproved = cards.filter((c) => c.state === "approved").length;
        let filtered = cards;
        if (filter !== "all") filtered = filtered.filter((c) => c.state === filter);
        if (q) filtered = filtered.filter((c) => c.subject.name.toLowerCase().includes(q));
        return { config, cards: filtered, totalCards, totalApproved };
      })
      .filter(({ cards }) => cards.length > 0);
  }, [cardsByNucleus, filter, search]);

  const totals = useMemo(() => {
    const all = cardsByNucleus.flatMap((g) => g.cards);
    return {
      all: all.length,
      approved: all.filter((c) => c.state === "approved").length,
      available: all.filter((c) => c.state === "available").length,
      blocked: all.filter((c) => c.state === "blocked").length,
    };
  }, [cardsByNucleus]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), []);

  if (!activePlan) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 md:px-6 pt-4 pb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-ink-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar materia..."
            className="w-full bg-th-surface border border-th-border rounded-xl text-base text-th-ink placeholder:text-th-ink-3 pl-10 pr-3 py-2.5 font-body focus:outline-none focus:border-th-border-em focus:ring-1 focus:ring-th-border-em transition-all duration-200"
            style={{ boxShadow: "var(--th-shadow-sm)" }}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.value;
            const count = totals[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`text-xs font-medium px-3.5 py-2 rounded-xl font-body transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? "bg-th-ink text-th-base border border-transparent shadow-sm"
                    : "bg-th-surface text-th-ink-2 border border-th-border hover:bg-th-hover hover:text-th-ink"
                }`}
              >
                {opt.label}
                <span className={`tabular-nums text-[11px] ${active ? "opacity-60" : "text-th-ink-3"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 custom-scroll">
        {filteredByNucleus.length > 0 ? (
          <div className="space-y-1">
            {filteredByNucleus.map(({ config, cards, totalCards, totalApproved }) => (
              <NucleusSection
                key={config.id}
                config={config}
                cards={cards}
                totalCards={totalCards}
                totalApproved={totalApproved}
                defaultOpen={filter !== "all" || search.length > 0 || config.id === currentNucleusId}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <div className="w-14 h-14 rounded-2xl bg-th-hover flex items-center justify-center mb-4">
              <Search size={24} strokeWidth={1.5} className="text-th-ink-3" />
            </div>
            <p className="text-base text-th-ink-2 font-body">No se encontraron materias</p>
            <p className="text-sm text-th-ink-3 font-body mt-1">Intenta con otro filtro o busqueda</p>
          </div>
        )}
        <p className="text-xs text-th-ink-3 font-body pt-4 pb-2">
          🇦🇷 Hecho por Magali Defelippe
        </p>
      </div>
    </div>
  );
}
