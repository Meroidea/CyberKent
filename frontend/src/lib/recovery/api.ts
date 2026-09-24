import { apiRequest } from "@/lib/api/client";

export interface RecoveryStep {
  id: string;
  position: number;
  title: string;
  detail: string;
}

export interface RecoveryChecklist {
  id: string;
  slug: string;
  title: string;
  situation: string;
  categories: string[];
  steps: RecoveryStep[];
}

let cache: Promise<RecoveryChecklist[]> | null = null;

/** `/api/recovery` — FR58–FR60. The checklists are fetched once per page load. */
export const recoveryApi = {
  checklists(): Promise<RecoveryChecklist[]> {
    cache ??= apiRequest<{ checklists: RecoveryChecklist[] }>("/api/recovery")
      .then((result) => result.checklists)
      .catch((error: unknown) => {
        cache = null;
        throw error;
      });
    return cache;
  },
  progress(signal?: AbortSignal) {
    return apiRequest<{ completed: { stepId: string; completedAt: string }[] }>("/api/recovery/progress", { signal });
  },
  mark(stepIds: string[], done: boolean) {
    return apiRequest<{ completed: { stepId: string; completedAt: string }[] }>("/api/recovery/progress", { method: "PUT", body: { stepIds, done } });
  },
};
