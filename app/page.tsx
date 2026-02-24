"use client";

import { useMemo, useState, useEffect } from "react";
import { Sun, Moon, ChevronDown, X, Pencil, BarChart3 } from "lucide-react";
import CurriculumBoard from "@/components/CurriculumBoard";
import StatsPanel from "@/components/StatsPanel";
import ImportModal from "@/components/ImportModal";
import WelcomeScreen from "@/components/WelcomeScreen";
import { StoreProvider, useStore } from "@/lib/store";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { calculateStats } from "@/lib/utils";

/* ─── Theme Toggle ─── */

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-xl bg-th-hover hover:bg-th-medium
                 flex items-center justify-center transition-all duration-300
                 border border-th-border"
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
    >
      <Sun
        size={18}
        className={`absolute text-amber-500 transition-all duration-300
          ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}
      />
      <Moon
        size={18}
        className={`absolute text-indigo-400 transition-all duration-300
          ${theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}
      />
    </button>
  );
}

/* ─── Main Content ─── */

function HomeContent() {
  const { activePlan, activeApproved, plans, setActivePlan, removePlan, hydrated } = useStore();
  const [showStats, setShowStats] = useState(false);
  const [showImport, setShowImport] = useState<false | "choose" | "paste">(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (mounted && !isMobile && activePlan) setShowStats(true);
  }, [mounted, isMobile, activePlan]);

  const stats = useMemo(() => {
    if (!activePlan) return null;
    return calculateStats(activePlan, activeApproved);
  }, [activePlan, activeApproved]);

  const isEmpty = hydrated && !activePlan;

  const pctApproved =
    stats && stats.totalSubjects > 0
      ? Math.round((stats.approved / stats.totalSubjects) * 100)
      : 0;

  if (!hydrated) {
    return (
      <main className="h-dvh w-screen flex items-center justify-center bg-th-base bg-ambient">
        <div className="text-th-ink-3 text-sm font-body">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="h-dvh w-screen flex flex-col bg-th-base bg-ambient overflow-hidden">
      {/* ─── Header ─── */}
      <header className="relative z-20 glass-strong px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 relative">
          <h1 className="font-heading text-base md:text-lg font-semibold text-th-ink tracking-tight truncate">
            Plan de Estudios
          </h1>
          {plans.length > 1 ? (
            <button
              onClick={() => setShowPlanPicker(!showPlanPicker)}
              className="flex items-center gap-1.5 text-xs md:text-sm text-th-ink-2 font-body truncate
                         hover:text-th-ink transition-colors group"
            >
              {activePlan ? activePlan.name : "Sin plan cargado"}
              {stats && (
                <span className="hidden sm:inline text-th-ink-3">
                  — {stats.approved}/{stats.totalSubjects} ({pctApproved}%)
                </span>
              )}
              <ChevronDown
                size={14}
                className={`shrink-0 text-th-ink-3 group-hover:text-th-ink transition-transform duration-200 ${showPlanPicker ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <p className="text-xs md:text-sm text-th-ink-2 font-body truncate">
              {activePlan ? activePlan.name : "Sin plan cargado"}
              {stats && (
                <span className="hidden sm:inline text-th-ink-3 ml-2">
                  {stats.approved}/{stats.totalSubjects} materias (
                  {pctApproved}%)
                </span>
              )}
            </p>
          )}

          {/* Plan picker dropdown */}
          {showPlanPicker && plans.length > 1 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowPlanPicker(false)} />
              <div
                className="absolute top-full left-0 mt-2 z-40 min-w-[240px] bg-th-surface border border-th-border rounded-xl overflow-hidden animate-fade-in"
                style={{ boxShadow: "var(--th-shadow-lg)" }}
              >
                {plans.map((p) => {
                  const isActive = p.id === activePlan?.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2.5 px-4 py-3 transition-colors cursor-pointer
                        ${isActive ? "bg-th-hover" : "hover:bg-th-hover"}`}
                      onClick={() => { setActivePlan(p.id); setShowPlanPicker(false); }}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : "bg-th-ink-4"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-body truncate ${isActive ? "text-th-ink font-medium" : "text-th-ink-2"}`}>
                          {p.name}
                        </p>
                        <p className="text-[11px] text-th-ink-3 tabular-nums">
                          {p.subjects.length} materias
                        </p>
                      </div>
                      {!isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Eliminar "${p.name}"?`)) {
                              removePlan(p.id);
                              if (plans.length <= 2) setShowPlanPicker(false);
                            }
                          }}
                          className="text-th-ink-4 hover:text-red-500 transition-colors p-1 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowImport("choose")}
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl
                       bg-th-hover hover:bg-th-medium border border-th-border
                       text-th-ink-2 hover:text-th-ink transition-all duration-200"
          >
            <Pencil size={15} />
            <span className="hidden sm:inline">Editar</span>
          </button>

          {activePlan && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl
                         bg-th-hover hover:bg-th-medium border border-th-border
                         text-th-ink-2 hover:text-th-ink transition-all duration-200"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">
                {showStats ? "Ocultar" : "Progreso"}
              </span>
            </button>
          )}

          {mounted && <ThemeToggle />}
        </div>
      </header>

      {/* ─── Content ─── */}
      <div className="flex-1 flex relative overflow-hidden">
        {activePlan && (
          <div className="flex-1 relative z-10 overflow-hidden">
            <CurriculumBoard />
          </div>
        )}

        {isEmpty && (
          <WelcomeScreen onImportCustom={() => setShowImport("paste")} />
        )}

        {/* Desktop sidebar */}
        {showStats && !isMobile && mounted && stats && activePlan && (
          <div className="hidden md:block w-[340px] border-l border-th-border animate-slide-in-right shrink-0">
            <StatsPanel
              stats={stats}
              planName={activePlan.name}
              onClose={() => setShowStats(false)}
            />
          </div>
        )}

        {/* Mobile bottom sheet */}
        {showStats && isMobile && mounted && stats && activePlan && (
          <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
            <div
              className="absolute inset-0 bg-th-overlay backdrop-blur-sm"
              onClick={() => setShowStats(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] animate-slide-up rounded-t-2xl overflow-hidden">
              <div className="pt-3 pb-1 bg-th-surface rounded-t-2xl border-t border-x border-th-border">
                <div className="sheet-handle" />
              </div>
              <StatsPanel
                stats={stats}
                planName={activePlan.name}
                onClose={() => setShowStats(false)}
                compact
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Import Modal ─── */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          initialStep={showImport === "paste" ? "paste" : "choose"}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <HomeContent />
      </StoreProvider>
    </ThemeProvider>
  );
}
