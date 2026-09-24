import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/useAuth";
import { recoveryApi } from "@/lib/recovery/api";

const KEY = "cyberkent-recovery-progress";

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(KEY, JSON.stringify(ids));
    else localStorage.removeItem(KEY);
  } catch {
    /* Private mode or storage blocked: the ticks last for this visit only. */
  }
}

/**
 * FR60 — which recovery steps this person has done.
 *
 * Signed in, progress is kept on the account and follows them between
 * devices. A guest's ticks stay on this device only; the moment they sign in,
 * those ticks are carried onto the account and the local copy is cleared.
 */
export function useRecoveryProgress() {
  const { user } = useAuth();
  const [done, setDone] = useState<Set<string>>(() => new Set(readLocal()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setDone(new Set(readLocal()));
      return;
    }

    const controller = new AbortController();
    const local = readLocal();

    (local.length ? recoveryApi.mark(local, true).then((result) => (writeLocal([]), result)) : recoveryApi.progress(controller.signal))
      .then(({ completed }) => setDone(new Set(completed.map((row) => row.stepId))))
      .catch(() => undefined);

    return () => controller.abort();
  }, [user]);

  const toggle = useCallback(
    async (stepId: string, value: boolean) => {
      const previous = done;
      const next = new Set(done);
      if (value) next.add(stepId);
      else next.delete(stepId);
      setDone(next);

      if (!user) {
        writeLocal([...next]);
        return;
      }

      setSaving(true);
      try {
        const { completed } = await recoveryApi.mark([stepId], value);
        setDone(new Set(completed.map((row) => row.stepId)));
      } catch {
        setDone(previous);
      } finally {
        setSaving(false);
      }
    },
    [done, user],
  );

  return { done, toggle, saving, onAccount: Boolean(user) };
}
