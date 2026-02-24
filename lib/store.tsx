"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CareerPlan, ApprovedSubject } from "@/data/curriculum";

interface StoreState {
  activePlanId: string | null;
  plans: CareerPlan[];
  approvedByPlan: Record<string, ApprovedSubject[]>;
}

const EMPTY_STATE: StoreState = {
  activePlanId: null,
  plans: [],
  approvedByPlan: {},
};

const STORAGE_KEY = "curriculum-tracker-v1";

type Action =
  | { type: "IMPORT_PLAN"; plan: CareerPlan; approved: ApprovedSubject[] }
  | { type: "LOAD_PRESET"; plan: CareerPlan; approved: ApprovedSubject[] }
  | { type: "TOGGLE_APPROVED"; planId: string; subjectId: string }
  | { type: "SET_GRADE"; planId: string; subjectId: string; grade: number | null }
  | { type: "SET_APPROVED_LIST"; planId: string; approved: ApprovedSubject[] }
  | { type: "SET_ACTIVE_PLAN"; planId: string }
  | { type: "REMOVE_PLAN"; planId: string }
  | { type: "HYDRATE"; state: StoreState };

function parseState(raw: Record<string, unknown>): StoreState | null {
  const plans = raw.plans as CareerPlan[] | undefined;
  if (!plans || !Array.isArray(plans)) return null;

  const approvedByPlan = (raw.approvedByPlan ?? {}) as Record<string, ApprovedSubject[]>;

  return {
    activePlanId: (raw.activePlanId as string) ?? null,
    plans,
    approvedByPlan,
  };
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "IMPORT_PLAN":
    case "LOAD_PRESET": {
      const exists = state.plans.some((p) => p.id === action.plan.id);
      const plans = exists
        ? state.plans.map((p) => (p.id === action.plan.id ? action.plan : p))
        : [...state.plans, action.plan];
      return {
        ...state,
        activePlanId: action.plan.id,
        plans,
        approvedByPlan: {
          ...state.approvedByPlan,
          [action.plan.id]: action.approved,
        },
      };
    }

    case "TOGGLE_APPROVED": {
      const current = state.approvedByPlan[action.planId] || [];
      const idx = current.findIndex((s) => s.id === action.subjectId);
      const next =
        idx >= 0
          ? current.filter((_, i) => i !== idx)
          : [...current, { id: action.subjectId, grade: null }];
      return {
        ...state,
        approvedByPlan: { ...state.approvedByPlan, [action.planId]: next },
      };
    }

    case "SET_GRADE": {
      const current = state.approvedByPlan[action.planId] || [];
      const next = current.map((s) =>
        s.id === action.subjectId ? { ...s, grade: action.grade } : s
      );
      return {
        ...state,
        approvedByPlan: { ...state.approvedByPlan, [action.planId]: next },
      };
    }

    case "SET_APPROVED_LIST": {
      return {
        ...state,
        approvedByPlan: { ...state.approvedByPlan, [action.planId]: action.approved },
      };
    }

    case "SET_ACTIVE_PLAN": {
      if (!state.plans.some((p) => p.id === action.planId)) return state;
      return { ...state, activePlanId: action.planId };
    }

    case "REMOVE_PLAN": {
      const plans = state.plans.filter((p) => p.id !== action.planId);
      const approvedByPlan = { ...state.approvedByPlan };
      delete approvedByPlan[action.planId];
      const activePlanId =
        state.activePlanId === action.planId
          ? plans[0]?.id ?? null
          : state.activePlanId;
      return { activePlanId, plans, approvedByPlan };
    }

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

interface StoreContextValue {
  hydrated: boolean;
  plans: CareerPlan[];
  activePlan: CareerPlan | null;
  activeApproved: ApprovedSubject[];
  importPlan: (plan: CareerPlan, approved: ApprovedSubject[]) => void;
  loadPreset: (plan: CareerPlan, approved: ApprovedSubject[]) => void;
  toggleApproved: (subjectId: string) => void;
  setGrade: (subjectId: string, grade: number | null) => void;
  setApprovedList: (approved: ApprovedSubject[]) => void;
  setActivePlan: (planId: string) => void;
  removePlan: (planId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const state = parseState(parsed);
        if (state) dispatch({ type: "HYDRATE", state });
      }
    } catch { /* corrupted storage */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* quota exceeded */ }
  }, [state, hydrated]);

  const activePlan = state.plans.find((p) => p.id === state.activePlanId) ?? null;
  const activeApproved = activePlan ? state.approvedByPlan[activePlan.id] ?? [] : [];

  const importPlan = (plan: CareerPlan, approved: ApprovedSubject[]) =>
    dispatch({ type: "IMPORT_PLAN", plan, approved });

  const loadPreset = (plan: CareerPlan, approved: ApprovedSubject[]) =>
    dispatch({ type: "LOAD_PRESET", plan, approved });

  const toggleApproved = (subjectId: string) => {
    if (!state.activePlanId) return;
    dispatch({ type: "TOGGLE_APPROVED", planId: state.activePlanId, subjectId });
  };

  const setGrade = (subjectId: string, grade: number | null) => {
    if (!state.activePlanId) return;
    dispatch({ type: "SET_GRADE", planId: state.activePlanId, subjectId, grade });
  };

  const setApprovedList = (approved: ApprovedSubject[]) => {
    if (!state.activePlanId) return;
    dispatch({ type: "SET_APPROVED_LIST", planId: state.activePlanId, approved });
  };

  const setActivePlan = (planId: string) =>
    dispatch({ type: "SET_ACTIVE_PLAN", planId });

  const removePlan = (planId: string) =>
    dispatch({ type: "REMOVE_PLAN", planId });

  return (
    <StoreContext.Provider
      value={{
        hydrated,
        plans: state.plans,
        activePlan,
        activeApproved,
        importPlan,
        loadPreset,
        toggleApproved,
        setGrade,
        setApprovedList,
        setActivePlan,
        removePlan,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
