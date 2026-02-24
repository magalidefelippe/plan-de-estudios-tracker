export type SubjectState = "approved" | "available" | "blocked";

export interface NucleusConfig {
  id: string;
  label: string;
  minRequired: number | null;
  accent: string;
  accentSoft: string;
  icon: string;
}

export interface Subject {
  id: string;
  name: string;
  weeklyHours: number;
  totalHours: number;
  credits: number;
  nucleusId: string;
  prerequisites: string[];
}

export interface ApprovedSubject {
  id: string;
  grade: number | null;
}

export interface CareerPlan {
  id: string;
  name: string;
  nuclei: NucleusConfig[];
  subjects: Subject[];
}

const ICON_CYCLE = [
  "BookOpen",
  "GraduationCap",
  "Sparkles",
  "Languages",
  "Puzzle",
  "Trophy",
];

export function getIconForIndex(idx: number): string {
  return ICON_CYCLE[idx % ICON_CYCLE.length];
}

function makeInformaticaSubjects(): Subject[] {
  const s = (id: string, name: string, wh: number, th: number, cr: number, nuc: string, prereqs: string[]): Subject => ({
    id, name, weeklyHours: wh, totalHours: th, credits: cr, nucleusId: nuc, prerequisites: prereqs,
  });

  const intro = ["80000", "8003N", "80005"];

  return [
    s("80005", "Elementos de Programacion y Logica", 5, 80, 10, "introductorio", []),
    s("80000", "Lectura y Escritura Academica", 5, 80, 10, "introductorio", []),
    s("8003N", "Matematica", 5, 80, 10, "introductorio", []),

    s("01033", "Matematica I", 8, 128, 16, "basico", intro),
    s("00487", "Introduccion a la Programacion", 8, 128, 16, "basico", intro),
    s("01032", "Organizacion de Computadoras", 6, 96, 12, "basico", intro),
    s("01036", "Estructuras de Datos", 8, 128, 16, "basico", [...intro, "00487"]),
    s("01037", "Programacion con Objetos I", 8, 128, 16, "basico", [...intro, "00487"]),
    s("01035", "Bases de Datos", 6, 96, 12, "basico", [...intro, "01033"]),
    s("01038", "Matematica II", 4, 64, 8, "basico", ["01033"]),
    s("01039", "Programacion con Objetos II", 6, 96, 12, "basico", ["01037"]),
    s("01040", "Redes de Computadoras", 6, 96, 12, "basico", ["01032"]),
    s("01041", "Sistemas Operativos", 6, 96, 12, "basico", ["01032", "00487"]),
    s("01042", "Programacion Funcional", 4, 64, 8, "basico", ["01036"]),
    s("01043", "Construccion de Interfaces de Usuario", 6, 96, 12, "basico", ["01039"]),
    s("01044", "Algoritmos", 6, 96, 12, "basico", ["01042"]),
    s("01045", "Estrategias de Persistencia", 6, 96, 12, "basico", ["01039", "01035"]),
    s("01046", "Laboratorio de SO y Redes", 4, 64, 8, "basico", ["01040", "01041"]),
    s("01047", "Analisis Matematico", 6, 96, 12, "basico", ["01038"]),
    s("01048", "Logica y Programacion", 6, 96, 12, "basico", ["01033", "00487"]),
    s("01049", "Elementos de Ingenieria de Software", 6, 96, 12, "basico", ["01039"]),
    s("01050", "Seguridad de la Informacion", 4, 64, 8, "basico", ["01046"]),
    s("01051", "Matematica III", 4, 64, 8, "basico", ["01047"]),
    s("01052", "Programacion Concurrente", 4, 64, 8, "basico", ["01036"]),
    s("01053", "Ingenieria de Requerimientos", 4, 64, 8, "basico", ["01049"]),
    s("01054", "Practica del Desarrollo de Software", 8, 128, 16, "basico", ["01043"]),
    s("01055", "Probabilidad y Estadistica", 6, 96, 12, "basico", ["01051"]),
    s("01056", "Gestion de Proyectos de Desarrollo de Software", 4, 64, 8, "basico", ["01053"]),
    s("01057", "Lenguajes Formales y Automatas", 4, 64, 8, "basico", ["01048"]),

    s("01060", "Programacion con Objetos III", 4, 64, 8, "avanzado", ["01039"]),
    s("01061", "Teoria de la Computacion", 4, 64, 8, "avanzado", ["01057"]),
    s("01062", "Arquitectura de Software I", 6, 96, 12, "avanzado", ["01052", "01054", "01056", "01050"]),
    s("01063", "Sistemas Distribuidos", 4, 64, 8, "avanzado", ["01052", "01046"]),
    s("01064", "Caracteristicas de Lenguajes de Programacion", 4, 64, 8, "avanzado", ["01048"]),
    s("01065", "Arquitectura de Software II", 6, 96, 12, "avanzado", ["01062", "01063"]),
    s("01066", "Arquitectura de Computadoras", 4, 64, 8, "avanzado", ["01046"]),
    s("01067", "Parseo y Generacion de Codigo", 4, 64, 8, "avanzado", ["01057", "01064"]),
    s("01068", "Aspectos Legales y Sociales", 4, 64, 8, "avanzado", []),

    s("80010", "Ingles I", 3, 48, 6, "idiomas", []),
    s("80011", "Ingles II", 3, 48, 6, "idiomas", ["80010"]),
    s("80020", "Taller de Trabajo Intelectual", 2, 32, 4, "idiomas", []),
    s("80021", "Taller de Trabajo Universitario", 2, 32, 4, "idiomas", []),

    s("01070", "Participacion y Gestion en Proyectos de Software Libre", 4, 64, 8, "complementario", []),
    s("01071", "Introduccion a la Bioinformatica", 4, 64, 8, "complementario", []),
    s("01072", "Politicas Publicas en la Sociedad de la Informacion", 4, 64, 8, "complementario", []),
    s("01073", "Seminarios", 4, 64, 8, "complementario", []),
    s("01074", "Introduccion al Desarrollo de Videojuegos", 4, 64, 8, "complementario", []),
    s("01075", "Bases de Datos II", 4, 64, 8, "complementario", ["01035"]),
    s("01076", "Sistemas de Informacion Geografica", 4, 64, 8, "complementario", []),
    s("01077", "Derechos de Autor y Derechos de Copia en la Era Digital", 4, 64, 8, "complementario", []),
    s("01078", "Ludificacion", 4, 64, 8, "complementario", []),
    s("01079", "Semantica de Lenguajes de Programacion", 4, 64, 8, "complementario", []),
    s("01080", "Redes Neuronales", 4, 64, 8, "complementario", []),
    s("01081", "Programacion Funcional Avanzada", 4, 64, 8, "complementario", []),
    s("01082", "Introduccion a la Programacion Cuantica", 4, 64, 8, "complementario", ["01051", "01064"]),
    s("01083", "Ciencia de Datos", 4, 64, 8, "complementario", []),
    s("01084", "Ciencia Ciudadana y Colaboracion Abierta", 4, 64, 8, "complementario", []),
    s("01085", "Calidad del Software", 4, 64, 8, "complementario", []),

    s("01090", "Seminario Final", 8, 128, 20, "seminario", []),
  ];
}

export function getInformaticaPreset(): CareerPlan {
  return {
    id: "informatica-unq",
    name: "Lic. Informatica — UNQ",
    nuclei: [
      { id: "introductorio", label: "Ciclo Introductorio", minRequired: null, accent: "#818CF8", accentSoft: "#818CF814", icon: "BookOpen" },
      { id: "basico", label: "Nucleo Basico Obligatorio", minRequired: null, accent: "#60A5FA", accentSoft: "#60A5FA14", icon: "GraduationCap" },
      { id: "avanzado", label: "Nucleo Avanzado Obligatorio", minRequired: null, accent: "#A78BFA", accentSoft: "#A78BFA14", icon: "Sparkles" },
      { id: "idiomas", label: "Idiomas y Humanistico", minRequired: null, accent: "#F472B6", accentSoft: "#F472B614", icon: "Languages" },
      { id: "complementario", label: "Nucleo Complementario", minRequired: 4, accent: "#FB923C", accentSoft: "#FB923C14", icon: "Puzzle" },
      { id: "seminario", label: "Seminario Final", minRequired: null, accent: "#34D399", accentSoft: "#34D39914", icon: "Trophy" },
    ],
    subjects: makeInformaticaSubjects(),
  };
}

