"use client";

import { useState, useMemo, type ReactNode } from "react";
import { X, Search, Check, GraduationCap, FileText, CheckCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { parsePlan, parseApproved } from "@/lib/parser";
import { getInformaticaPreset } from "@/data/curriculum";
import { getApprovedIds, getSubjectState } from "@/lib/utils";

type Step = "choose" | "paste" | "manage";

interface ImportModalProps {
  onClose: () => void;
  initialStep?: Step;
}

const INPUT_CLS = `w-full bg-th-surface border border-th-border rounded-xl
  text-sm text-th-ink placeholder:text-th-ink-3 px-3 py-2.5 font-body
  focus:outline-none focus:border-th-border-em focus:ring-1 focus:ring-th-border-em
  transition-all duration-200`;

const TEXTAREA_CLS = `${INPUT_CLS} font-mono leading-relaxed resize-none`;

export default function ImportModal({ onClose, initialStep = "choose" }: ImportModalProps) {
  const { importPlan, loadPreset, activePlan } = useStore();
  const [step, setStep] = useState<Step>(initialStep);
  const [manageSearch, setManageSearch] = useState("");
  const [planText, setPlanText] = useState("");
  const [careerName, setCareerName] = useState("");
  const [approvedText, setApprovedText] = useState("");
  const [selectedOrientations, setSelectedOrientations] = useState<Record<number, string>>({});

  const parsed = useMemo(() => {
    if (!planText.trim()) return null;
    return parsePlan(planText);
  }, [planText]);

  const orientations = parsed?.orientations ?? [];

  const effectiveSubjects = useMemo(() => {
    if (!parsed) return [];
    if (orientations.length === 0) return parsed.subjects;

    const allOrientationIds = new Set<string>();
    const selectedIds = new Set<string>();
    for (let i = 0; i < orientations.length; i++) {
      for (const opt of orientations[i].options) allOrientationIds.add(opt.nucleusId);
      if (selectedOrientations[i]) selectedIds.add(selectedOrientations[i]);
    }

    return parsed.subjects.filter((s) => !allOrientationIds.has(s.nucleusId) || selectedIds.has(s.nucleusId));
  }, [parsed, orientations, selectedOrientations]);

  const effectiveNuclei = useMemo(() => {
    if (!parsed) return [];
    if (orientations.length === 0) return parsed.nuclei;

    const allOrientationIds = new Set<string>();
    const selectedIds = new Set<string>();
    for (let i = 0; i < orientations.length; i++) {
      for (const opt of orientations[i].options) allOrientationIds.add(opt.nucleusId);
      if (selectedOrientations[i]) selectedIds.add(selectedOrientations[i]);
    }

    return parsed.nuclei.filter((n) => !allOrientationIds.has(n.id) || selectedIds.has(n.id));
  }, [parsed, orientations, selectedOrientations]);

  const approvedParsed = useMemo(() => {
    if (!approvedText.trim() || effectiveSubjects.length === 0) return null;
    return parseApproved(approvedText, effectiveSubjects);
  }, [approvedText, effectiveSubjects]);

  const handleLoadPreset = () => {
    loadPreset(getInformaticaPreset(), []);
    onClose();
  };

  const handleImport = () => {
    if (!parsed || effectiveSubjects.length === 0) return;
    const name = careerName.trim() || "Mi Carrera";
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    importPlan({ id, name, nuclei: effectiveNuclei, subjects: effectiveSubjects }, approvedParsed?.approved ?? []);
    onClose();
  };

  const orientationsComplete = orientations.length === 0 || orientations.every((_, i) => selectedOrientations[i]);
  const canImport = parsed && effectiveSubjects.length > 0 && orientationsComplete;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-th-overlay backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 bg-th-surface border border-th-border rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ boxShadow: "var(--th-shadow-lg)" }}
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-heading text-lg font-semibold text-th-ink tracking-tight">
              {step === "choose" ? "Plan de Estudios" : step === "paste" ? "Pegar Plan" : "Actualizar aprobadas"}
            </h2>
            <p className="text-xs text-th-ink-3 mt-0.5">
              {step === "choose"
                ? "Importar plan o actualizar materias aprobadas"
                : step === "paste"
                ? "Pega la tabla del plan y las aprobadas (SIU Guarani o lista simple)"
                : "Toca una materia para marcarla o desmarcarla"}
            </p>
          </div>
          <button onClick={onClose} className="text-th-ink-3 hover:text-th-ink transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {step === "choose" && (
            <div className="space-y-3 mt-2">
              <OptionButton
                icon={<GraduationCap size={20} strokeWidth={1.5} />}
                iconBg="bg-indigo-100 dark:bg-indigo-500/10"
                iconColor="#818CF8"
                title="Lic. Informatica — UNQ"
                subtitle="Cargar plan pre-configurado con 60 materias"
                onClick={handleLoadPreset}
              />
              <OptionButton
                icon={<FileText size={20} strokeWidth={1.5} />}
                iconBg="bg-emerald-100 dark:bg-emerald-500/10"
                iconColor="#34D399"
                title="Pegar plan de otra carrera"
                subtitle="Copia la tabla del plan desde la web de la universidad"
                onClick={() => setStep("paste")}
              />
              {activePlan && (
                <OptionButton
                  icon={<CheckCircle size={20} strokeWidth={1.5} />}
                  iconBg="bg-amber-100 dark:bg-amber-500/10"
                  iconColor="#FBBF24"
                  title="Actualizar aprobadas"
                  subtitle="Marcar o desmarcar materias como aprobadas"
                  onClick={() => { setManageSearch(""); setStep("manage"); }}
                />
              )}
            </div>
          )}

          {step === "paste" && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-xs text-th-ink-2 font-medium mb-1.5">Nombre de la carrera</label>
                <input type="text" value={careerName} onChange={(e) => setCareerName(e.target.value)} placeholder="Ej: Lic. en Artes Digitales — UNQ" className={INPUT_CLS} />
              </div>

              <div>
                <label className="block text-xs text-th-ink-2 font-medium mb-1.5">Plan de estudios (pegar tabla de la web)</label>
                <textarea
                  value={planText}
                  onChange={(e) => { setPlanText(e.target.value); setSelectedOrientations({}); }}
                  placeholder={"Nucleo de Asignaturas Obligatorias\nCurso\tCreditos\tHoras semanales\tHs. Totales\nMatematica I\t10\t5 hs.\t90 hs.\n..."}
                  rows={8}
                  className={TEXTAREA_CLS}
                />
              </div>

              {orientations.length > 0 && (
                <div className="space-y-3">
                  {orientations.map((group, gi) => (
                    <div key={gi}>
                      <label className="block text-xs text-th-ink-2 font-medium mb-1.5">{group.label} — elegi una</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {group.options.map((opt) => {
                          const selected = selectedOrientations[gi] === opt.nucleusId;
                          const count = parsed ? parsed.subjects.filter((s) => s.nucleusId === opt.nucleusId).length : 0;
                          return (
                            <button
                              key={opt.nucleusId}
                              onClick={() => setSelectedOrientations((prev) => ({ ...prev, [gi]: opt.nucleusId }))}
                              className={`text-left px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                                selected
                                  ? "bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                                  : "bg-th-subtle border border-th-border text-th-ink-2 hover:bg-th-hover"
                              }`}
                            >
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-[11px] ml-2 opacity-60">{count} materia{count !== 1 ? "s" : ""}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs text-th-ink-2 font-medium mb-1.5">
                  Materias aprobadas (opcional — pegar desde SIU Guarani o una por linea)
                </label>
                <textarea
                  value={approvedText}
                  onChange={(e) => setApprovedText(e.target.value)}
                  placeholder={"Formato SIU Guarani:\nMatematica I (01033)\nRegularidad - 7 (Siete) Aprobado 15/07/2024 - Detalle\n\nO lista simple:\nMatematica I\nProgramacion"}
                  rows={5}
                  className={TEXTAREA_CLS}
                />
              </div>

              {parsed && parsed.subjects.length > 0 && (
                <div className="rounded-xl bg-th-subtle border border-th-border p-3 space-y-1.5">
                  <p className="text-xs text-th-ink font-medium">
                    Detectado: {parsed.nuclei.length} nucleo{parsed.nuclei.length !== 1 ? "s" : ""}, {parsed.subjects.length} materia{parsed.subjects.length !== 1 ? "s" : ""}
                  </p>
                  {orientations.length > 0 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      {orientations.length} grupo{orientations.length !== 1 ? "s" : ""} de orientacion detectado{orientations.length !== 1 ? "s" : ""}
                      {orientationsComplete ? ` — ${effectiveSubjects.length} materias con orientacion elegida` : " — elegi una orientacion para continuar"}
                    </p>
                  )}
                  {approvedParsed && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {approvedParsed.approved.length} aprobada{approvedParsed.approved.length !== 1 ? "s" : ""} encontrada{approvedParsed.approved.length !== 1 ? "s" : ""}
                      {approvedParsed.approved.filter((a) => a.grade !== null).length > 0 &&
                        ` (${approvedParsed.approved.filter((a) => a.grade !== null).length} con nota)`}
                    </p>
                  )}
                  {parsed.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>
                  ))}
                  {approvedParsed?.notFound.map((name, i) => (
                    <p key={`nf-${i}`} className="text-xs text-amber-600 dark:text-amber-400">No encontrada: &ldquo;{name}&rdquo;</p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => setStep("choose")} className="text-xs text-th-ink-2 hover:text-th-ink px-3 py-2 transition-colors">Volver</button>
                <button
                  onClick={handleImport}
                  disabled={!canImport}
                  className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Importar Plan
                </button>
              </div>
            </div>
          )}

          {step === "manage" && activePlan && <ManageStep search={manageSearch} onSearchChange={setManageSearch} onBack={() => setStep("choose")} onDone={onClose} />}
        </div>
      </div>
    </div>
  );
}

function OptionButton({ icon, iconBg, iconColor, title, subtitle, onClick }: {
  icon: ReactNode; iconBg: string; iconColor: string; title: string; subtitle: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-th-subtle border border-th-border hover:bg-th-hover hover:border-th-border-em transition-all group"
      style={{ boxShadow: "var(--th-shadow-sm)" }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`} style={{ color: iconColor }}>
          {icon}
        </div>
        <div>
          <p className="text-base font-medium text-th-ink">{title}</p>
          <p className="text-xs text-th-ink-3 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function ManageStep({ search, onSearchChange, onBack, onDone }: {
  search: string; onSearchChange: (v: string) => void; onBack: () => void; onDone: () => void;
}) {
  const { activePlan, activeApproved, setApprovedList } = useStore();
  const [localApproved, setLocalApproved] = useState(() => [...activeApproved]);

  if (!activePlan) return null;

  const approvedIds = getApprovedIds(localApproved);
  const approvedCount = localApproved.length;
  const q = search.toLowerCase().trim();
  const subjects = q
    ? activePlan.subjects.filter((s) => s.name.toLowerCase().includes(q))
    : activePlan.subjects;

  const toggleLocal = (subjectId: string) => {
    setLocalApproved((prev) => {
      const idx = prev.findIndex((s) => s.id === subjectId);
      return idx >= 0 ? prev.filter((_, i) => i !== idx) : [...prev, { id: subjectId, grade: null }];
    });
  };

  const setLocalGrade = (subjectId: string, grade: number | null) => {
    setLocalApproved((prev) => prev.map((s) => (s.id === subjectId ? { ...s, grade } : s)));
  };

  const handleDone = () => {
    setApprovedList(localApproved);
    onDone();
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-ink-3 pointer-events-none" />
        <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar materia..." className={`${INPUT_CLS} pl-10`} />
      </div>

      <p className="text-xs text-th-ink-3">
        {approvedCount} aprobada{approvedCount !== 1 ? "s" : ""} de {activePlan.subjects.length}
      </p>

      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scroll -mx-1 px-1">
        {subjects.map((subject) => {
          const isApproved = approvedIds.has(subject.id);
          const state = getSubjectState(subject, approvedIds);
          const isBlocked = state === "blocked";
          const grade = localApproved.find((s) => s.id === subject.id)?.grade ?? null;

          return (
            <div
              key={subject.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                isApproved
                  ? "bg-emerald-50 dark:bg-emerald-500/[0.06] border-emerald-200/70 dark:border-emerald-500/20"
                  : isBlocked
                  ? "bg-th-subtle border-th-border-muted opacity-40"
                  : "bg-th-subtle border-th-border hover:bg-th-hover hover:border-th-border-em"
              }`}
            >
              <button
                onClick={() => { if (!isBlocked || isApproved) toggleLocal(subject.id); }}
                disabled={isBlocked && !isApproved}
                className="shrink-0 disabled:cursor-not-allowed"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isApproved ? "bg-emerald-500 border-emerald-500" : "border-th-ink-3"}`}>
                  {isApproved && <Check size={12} color="white" strokeWidth={3} />}
                </div>
              </button>

              <button
                onClick={() => { if (!isBlocked || isApproved) toggleLocal(subject.id); }}
                disabled={isBlocked && !isApproved}
                className="flex-1 min-w-0 text-left disabled:cursor-not-allowed"
              >
                <p className={`text-sm font-body truncate ${isApproved ? "text-emerald-800 dark:text-emerald-200" : isBlocked ? "text-th-ink-3" : "text-th-ink"}`}>
                  {subject.name}
                </p>
              </button>

              {isApproved ? (
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={grade ?? ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") { setLocalGrade(subject.id, null); return; }
                    const n = parseInt(v, 10);
                    if (n >= 1 && n <= 10) setLocalGrade(subject.id, n);
                  }}
                  className="w-10 text-center text-xs font-bold tabular-nums shrink-0
                    bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400
                    border border-emerald-200 dark:border-emerald-500/20 rounded-lg py-1 font-heading
                    focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500/40
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              ) : (
                <span className="text-[11px] tabular-nums shrink-0 text-th-ink-3">{subject.credits} cr</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={onBack} className="text-xs text-th-ink-2 hover:text-th-ink px-3 py-2 transition-colors">Volver</button>
        <button onClick={handleDone} className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200">
          Listo
        </button>
      </div>
    </div>
  );
}
