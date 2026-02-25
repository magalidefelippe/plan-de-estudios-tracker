import type { NucleusConfig, Subject, ApprovedSubject } from "@/data/curriculum";
import { getIconForIndex } from "@/data/curriculum";

const PALETTE = [
  { accent: "#818CF8", accentSoft: "#818CF814" },
  { accent: "#60A5FA", accentSoft: "#60A5FA14" },
  { accent: "#A78BFA", accentSoft: "#A78BFA14" },
  { accent: "#F472B6", accentSoft: "#F472B614" },
  { accent: "#FB923C", accentSoft: "#FB923C14" },
  { accent: "#34D399", accentSoft: "#34D39914" },
  { accent: "#F87171", accentSoft: "#F8717114" },
  { accent: "#38BDF8", accentSoft: "#38BDF814" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(base: string, existing: Set<string>): string {
  let slug = slugify(base) || "item";
  if (!existing.has(slug)) {
    existing.add(slug);
    return slug;
  }
  let i = 2;
  while (existing.has(`${slug}-${i}`)) i++;
  slug = `${slug}-${i}`;
  existing.add(slug);
  return slug;
}

function parseNum(s: string): number | null {
  const cleaned = s.replace(/\s*hs\.?\s*/gi, "").replace(/[.,\s]+$/, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

interface ColumnMapping {
  credits: number | null;
  weeklyHours: number | null;
  totalHours: number | null;
}

function detectColumns(headerParts: string[]): ColumnMapping {
  const mapping: ColumnMapping = { credits: null, weeklyHours: null, totalHours: null };

  for (let i = 1; i < headerParts.length; i++) {
    const col = headerParts[i].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/creditos?/.test(col)) mapping.credits = i;
    else if (/horas?\s*semanales?/.test(col)) mapping.weeklyHours = i;
    else if (/carga\s*horaria|hs\.?\s*totales?|horas?\s*totales?/.test(col)) mapping.totalHours = i;
  }

  return mapping;
}

function guessNumbers(nums: number[]): { weeklyHours: number; totalHours: number; credits: number } {
  if (nums.length === 0) return { weeklyHours: 4, totalHours: 64, credits: 8 };

  const sorted = [...nums].sort((a, b) => a - b);

  if (sorted.length >= 3) {
    return {
      weeklyHours: sorted[0],
      credits: sorted[Math.floor(sorted.length / 2)],
      totalHours: sorted[sorted.length - 1],
    };
  }

  if (sorted.length === 2) {
    if (sorted[1] > 30) {
      return { weeklyHours: sorted[0], totalHours: sorted[1], credits: sorted[0] * 2 };
    }
    return {
      weeklyHours: Math.min(sorted[0], sorted[1]),
      credits: Math.max(sorted[0], sorted[1]),
      totalHours: Math.max(sorted[0], sorted[1]) * 9,
    };
  }

  const n = sorted[0];
  if (n > 30) return { weeklyHours: 4, totalHours: n, credits: 8 };
  if (n > 12) return { weeklyHours: Math.round(n / 2), totalHours: n * 9, credits: n };
  return { weeklyHours: n, totalHours: n * 16, credits: n * 2 };
}

const ORIENTATION_RE = /^Cursos\s+Orientados?\s+(?:en|de)\s+(.+?)\.?\s*$/i;

const SECTION_PATTERNS: { re: RegExp; getLabel: (m: RegExpMatchArray) => string }[] = [
  {
    re: /^N[uú]cleo\s+(?:de(?:l)?\s+)?(.+?)(?::\s*(\d+)\s*asignaturas?)?\s*[:.]?\s*$/i,
    getLabel: (m) => m[1].replace(/\s*[:.]$/, ""),
  },
  {
    re: /^Ciclo\s+(.+?)(?::\s*(\d+)\s*asignaturas?)?\s*[:.]?\s*$/i,
    getLabel: (m) => `Ciclo ${m[1].replace(/\s*[:.]$/, "")}`,
  },
  {
    re: /^[AÁ]rea\s+(?:de\s+)?(.+?)(?::\s*(\d+)\s*asignaturas?)?\s*[:.]?\s*$/i,
    getLabel: (m) => m[1].replace(/\s*[:.]$/, ""),
  },
  {
    re: /^Cursos\s+Obligatorios\s+(.+?)\.?\s*$/i,
    getLabel: (m) => `Obligatorias — ${m[1].replace(/\s*[:.]$/, "")}`,
  },
  {
    re: /^Cursos\s+Electivos\s*$/i,
    getLabel: () => "Cursos Electivos",
  },
  {
    re: /^Otros\s+requisitos\s+curriculares\s*(.*)$/i,
    getLabel: (m) => {
      const rest = m[1].replace(/^(para\s+(la|el)\s+)?/i, "").replace(/\s*[:.]$/, "").trim();
      return rest ? `Otros Requisitos — ${rest}` : "Otros Requisitos";
    },
  },
];

function extractMinRequired(_label: string, match: RegExpMatchArray): number | null {
  if (match[2]) return parseInt(match[2], 10);
  return null;
}

const COLUMN_HEADER_RE =
  /modalidad|carga\s*horaria|horas?\s*semanales?|cr[eé]ditos?|r[eé]gimen|hs\.?\s*totales?/i;
const SKIP_LINE_RE = /^(total|subtotal)\b/i;
const FOOTNOTE_RE = /^\*/;

function isProse(line: string): boolean {
  if (!line.includes("\t") && !/\s{2,}/.test(line) && line.length > 70) return true;
  if (/\b(los estudiantes|deberán|podrán optar|para alcanzar|comprende un|solo para)\b/i.test(line)) return true;
  const withoutHs = line.replace(/hs\./gi, "");
  if ((withoutHs.match(/\./g) || []).length >= 2) return true;
  return false;
}

function isHeaderRow(parts: string[]): boolean {
  if (parts.length < 2) return false;
  const first = parts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/^(cursos?|asignaturas?|materia|nombre)$/i.test(first)) {
    return parts.slice(1).some((p) => COLUMN_HEADER_RE.test(p));
  }
  return parts.filter((p) => COLUMN_HEADER_RE.test(p)).length >= 2;
}

export interface OrientationGroup {
  label: string;
  options: { nucleusId: string; label: string }[];
}

export interface ParsePlanResult {
  nuclei: NucleusConfig[];
  subjects: Subject[];
  orientations: OrientationGroup[];
  warnings: string[];
  detectedName?: string;
}

/* ── "Plan de Estudios" format (tables with Código / Año / Correlativas / H.Sem / H.Tot) ── */

const PLAN_ESTUDIOS_COLUMN_RE = /C[oó]digo\s+Materia\s+A[nñ]o/i;

function isPlanDeEstudiosFormat(text: string): boolean {
  const norm = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /Codigo\s+Materia\s+Ano\s+Materias?\s+Correlativas?/i.test(norm);
}

function titleCaseCareer(s: string): string {
  const small = new Set([
    "en", "de", "del", "la", "el", "y", "e", "los", "las", "un", "una", "al", "a", "con", "por", "para",
  ]);
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function parsePlanDeEstudios(text: string): ParsePlanResult {
  const lines = text.split("\n");
  const nuclei: NucleusConfig[] = [];
  const subjects: Subject[] = [];
  const warnings: string[] = [];

  // Try to extract career name from "(NNN) - NAME" pattern
  let detectedName: string | undefined;
  const careerMatch = text.match(/\(\d{2,}\)\s*-\s*(.+)/);
  if (careerMatch) {
    detectedName = titleCaseCareer(careerMatch[1].trim());
  }

  // Separate content lines from page-header noise.
  // We start in "header mode" (skip until the first column-header row).
  // A "Fecha de Impresión" line re-enters header mode (page break).
  let inHeader = true;
  const contentLines: string[] = [];
  const PAGE_BREAK_RE = /Fecha\s+de\s+Impresi[oó]n/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (PLAN_ESTUDIOS_COLUMN_RE.test(line)) {
      inHeader = false;
      continue;
    }
    if (PAGE_BREAK_RE.test(line)) {
      inHeader = true;
      continue;
    }
    if (inHeader) continue;

    contentLines.push(line);
  }

  // Regexes for subject parsing
  const CODE_RE = /^(\d{4,5})\s+(.+)$/;
  const DATA_RE = /^(\d)\s+(.+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s*$/;

  interface RawSubject {
    code: string;
    nameParts: string[];
    year: number;
    correlatives: string[];
    weeklyHours: number;
    totalHours: number;
  }

  const rawSubjects: RawSubject[] = [];
  let curCode: string | null = null;
  let curName: string[] = [];

  for (const line of contentLines) {
    // 1. Data line closes current subject
    const dm = line.match(DATA_RE);
    if (dm) {
      if (curCode) {
        const year = parseInt(dm[1], 10);
        const corrStr = dm[2].trim();
        const hSem = parseFloat(dm[3].replace(",", "."));
        const hTot = parseFloat(dm[4].replace(",", "."));

        let correlatives: string[] = [];
        if (corrStr !== "---") {
          correlatives = corrStr.split(/\s+-\s+/).map((c) => c.trim()).filter(Boolean);
        }

        rawSubjects.push({
          code: curCode,
          nameParts: [...curName],
          year,
          correlatives,
          weeklyHours: hSem,
          totalHours: hTot,
        });
        curCode = null;
        curName = [];
      }
      continue;
    }

    // 2. Code line starts a new subject
    const cm = line.match(CODE_RE);
    if (cm) {
      curCode = cm[1];
      curName = [cm[2]];
      continue;
    }

    // 3. Name continuation
    if (curCode) {
      curName.push(line);
    }
  }

  // Build nuclei from years
  const yearSet = new Set<number>();
  for (const s of rawSubjects) yearSet.add(s.year);
  const years = Array.from(yearSet).sort((a, b) => a - b);
  const yearNucleus = new Map<number, NucleusConfig>();

  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    const p = PALETTE[i % PALETTE.length];
    const nucleus: NucleusConfig = {
      id: `year-${y}`,
      label: `Año ${y}`,
      minRequired: null,
      accent: p.accent,
      accentSoft: p.accentSoft,
      icon: getIconForIndex(i),
    };
    nuclei.push(nucleus);
    yearNucleus.set(y, nucleus);
  }

  // Build subjects
  const codeSet = new Set(rawSubjects.map((s) => s.code));
  const seenCodes = new Set<string>();

  for (const raw of rawSubjects) {
    if (seenCodes.has(raw.code)) {
      warnings.push(`Código duplicado ignorado: ${raw.code}`);
      continue;
    }
    seenCodes.add(raw.code);

    const name = raw.nameParts.join(" ").replace(/\s+/g, " ").trim();
    const nucleus = yearNucleus.get(raw.year)!;
    const prerequisites = raw.correlatives.filter((c) => codeSet.has(c));

    if (raw.correlatives.length > 0 && prerequisites.length < raw.correlatives.length) {
      const missing = raw.correlatives.filter((c) => !codeSet.has(c));
      warnings.push(`${name}: correlativas no encontradas en el plan: ${missing.join(", ")}`);
    }

    subjects.push({
      id: raw.code,
      name,
      weeklyHours: raw.weeklyHours,
      totalHours: raw.totalHours,
      credits: Math.round(raw.weeklyHours * 2),
      nucleusId: nucleus.id,
      prerequisites,
    });
  }

  if (subjects.length === 0) warnings.push("No se encontraron materias en el texto pegado.");

  return { nuclei, subjects, orientations: [], warnings, detectedName };
}

export function parsePlan(text: string): ParsePlanResult {
  if (isPlanDeEstudiosFormat(text)) {
    return parsePlanDeEstudios(text);
  }

  const lines = text.split("\n");
  const nuclei: NucleusConfig[] = [];
  const subjects: Subject[] = [];
  const warnings: string[] = [];
  const orientations: OrientationGroup[] = [];
  const slugs = new Set<string>();

  let currentNucleus: NucleusConfig | null = null;
  let nucleusIdx = 0;
  let colMap: ColumnMapping | null = null;
  let currentOrientationGroup: OrientationGroup | null = null;

  function makeNucleus(label: string, minReq: number | null, isOrientation: boolean): NucleusConfig {
    const palette = PALETTE[nucleusIdx % PALETTE.length];
    const nucleus: NucleusConfig = {
      id: uniqueSlug(label, slugs),
      label,
      minRequired: minReq,
      accent: palette.accent,
      accentSoft: palette.accentSoft,
      icon: getIconForIndex(nucleusIdx),
    };
    nuclei.push(nucleus);
    nucleusIdx++;

    if (isOrientation) {
      if (!currentOrientationGroup) {
        currentOrientationGroup = { label: "Orientacion", options: [] };
        orientations.push(currentOrientationGroup);
      }
      currentOrientationGroup.options.push({
        nucleusId: nucleus.id,
        label: label.replace(/^Orientacion\s*[-—:]\s*/i, ""),
      });
    } else {
      currentOrientationGroup = null;
    }

    return nucleus;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || SKIP_LINE_RE.test(line) || FOOTNOTE_RE.test(line) || isProse(line)) continue;

    const parts = line.includes("\t")
      ? line.split("\t").map((p) => p.trim()).filter(Boolean)
      : line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);

    if (isHeaderRow(parts)) {
      colMap = detectColumns(parts);
      continue;
    }

    const orientMatch = line.match(ORIENTATION_RE);
    if (orientMatch) {
      currentNucleus = makeNucleus(`Orientacion — ${orientMatch[1].trim()}`, null, true);
      colMap = null;
      continue;
    }

    let matched = false;
    for (const pat of SECTION_PATTERNS) {
      const m = line.match(pat.re);
      if (m) {
        currentNucleus = makeNucleus(pat.getLabel(m), extractMinRequired(pat.getLabel(m), m), false);
        colMap = null;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (parts.length === 1 && line.length < 80) {
      const hasNums = /\d/.test(line);
      if (!hasNums && (line.endsWith(":") || line.endsWith("."))) {
        const label = line.replace(/\s*[:.]$/, "").trim();
        if (label.length > 2 && label.length < 60) {
          currentNucleus = makeNucleus(label, null, false);
          colMap = null;
          continue;
        }
      }
    }

    if (parts.length === 0) continue;
    const name = parts[0];
    if (!name || name.length < 2) continue;

    const numericCols: { idx: number; val: number }[] = [];
    for (let j = 1; j < parts.length; j++) {
      const n = parseNum(parts[j]);
      if (n !== null && n > 0) numericCols.push({ idx: j, val: n });
    }

    if (numericCols.length === 0) continue;

    if (!currentNucleus) {
      currentNucleus = makeNucleus("General", null, false);
    }

    let weeklyHours: number;
    let totalHours: number;
    let credits: number;

    if (colMap && (colMap.credits !== null || colMap.weeklyHours !== null || colMap.totalHours !== null)) {
      const getCol = (idx: number | null): number | null => {
        if (idx === null) return null;
        const part = parts[idx];
        return part ? parseNum(part) : null;
      };

      const rawCredits = getCol(colMap.credits);
      const rawHours = getCol(colMap.weeklyHours);
      const rawTotal = getCol(colMap.totalHours);

      weeklyHours = rawHours ?? (rawCredits ? Math.round(rawCredits / 2) : 4);
      credits = rawCredits ?? (rawHours ? rawHours * 2 : 8);
      totalHours = rawTotal ?? credits * 9;
    } else {
      const guessed = guessNumbers(numericCols.map((c) => c.val));
      weeklyHours = guessed.weeklyHours;
      totalHours = guessed.totalHours;
      credits = guessed.credits;
    }

    subjects.push({
      id: uniqueSlug(name, slugs),
      name,
      weeklyHours,
      totalHours,
      credits,
      nucleusId: currentNucleus.id,
      prerequisites: [],
    });
  }

  if (subjects.length === 0) warnings.push("No se encontraron materias en el texto pegado.");
  if (nuclei.length === 0) warnings.push("No se detectaron nucleos/ciclos. Se creo uno por defecto.");

  return { nuclei, subjects, orientations, warnings };
}

export interface ParseApprovedResult {
  approved: ApprovedSubject[];
  notFound: string[];
}

const SIU_NAME_RE = /^(.+?)\s*\((\w+)\)\s*$/;
const SIU_GRADE_RE = /(\d+)\s*\([^)]+\)\s*Aprobado/i;

interface SIUEntry {
  name: string;
  code: string;
  grade: number | null;
}

function parseSIUEntries(lines: string[]): SIUEntry[] | null {
  const entries: SIUEntry[] = [];
  let hasSIU = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const nameMatch = line.match(SIU_NAME_RE);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const code = nameMatch[2].trim();
      let grade: number | null = null;

      if (i + 1 < lines.length) {
        const gradeMatch = lines[i + 1].trim().match(SIU_GRADE_RE);
        if (gradeMatch) {
          grade = parseInt(gradeMatch[1], 10);
          i++;
          hasSIU = true;
        }
      }

      entries.push({ name, code, grade });
    }
  }

  return hasSIU ? entries : null;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function findSubject(
  searchName: string,
  searchCode: string | null,
  plan: { id: string; normalized: string }[],
  matched: Set<string>
): string | null {
  const norm = normalize(searchName);
  if (!norm) return null;

  if (searchCode) {
    const byCode = plan.find((s) => s.id === searchCode && !matched.has(s.id));
    if (byCode) return byCode.id;
  }

  const exact = plan.find((s) => s.normalized === norm && !matched.has(s.id));
  if (exact) return exact.id;

  const partial = plan.find(
    (s) => (s.normalized.includes(norm) || norm.includes(s.normalized)) && !matched.has(s.id)
  );
  return partial?.id ?? null;
}

export function parseApproved(text: string, planSubjects: Subject[]): ParseApprovedResult {
  const approved: ApprovedSubject[] = [];
  const notFound: string[] = [];
  const matched = new Set<string>();

  const normalizedPlan = planSubjects.map((s) => ({
    id: s.id,
    normalized: normalize(s.name),
  }));

  const lines = text.split("\n");
  const siuEntries = parseSIUEntries(lines);

  if (siuEntries) {
    for (const entry of siuEntries) {
      const foundId = findSubject(entry.name, entry.code, normalizedPlan, matched);
      if (foundId) {
        matched.add(foundId);
        approved.push({ id: foundId, grade: entry.grade });
      } else {
        notFound.push(entry.name);
      }
    }
    return { approved, notFound };
  }

  const entries = lines.flatMap((line) => line.split(",")).map((s) => s.trim()).filter(Boolean);

  for (const entry of entries) {
    const codeMatch = entry.match(SIU_NAME_RE);
    const searchName = codeMatch ? codeMatch[1].trim() : entry;
    const searchCode = codeMatch ? codeMatch[2].trim() : null;

    const foundId = findSubject(searchName, searchCode, normalizedPlan, matched);
    if (foundId) {
      matched.add(foundId);
      approved.push({ id: foundId, grade: null });
    } else if (normalize(searchName)) {
      notFound.push(searchName);
    }
  }

  return { approved, notFound };
}
