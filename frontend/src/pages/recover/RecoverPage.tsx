import { Link } from "react-router-dom";
import { LifeBuoy, Phone } from "lucide-react";
import { useLoad } from "@/components/council/useLoad";
import { FormAlert } from "@/components/forms/fields";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ROUTES } from "@/config/site";
import { recoveryApi } from "@/lib/recovery/api";
import { useRecoveryProgress } from "@/lib/recovery/useProgress";

/**
 * FR58 — pick the situation, then work the steps.
 *
 * Each checklist is named for what happened, in the words someone would use
 * about it, because a person who has just been scammed is not going to parse
 * a taxonomy. The bank call is repeated at the very top: if money has moved,
 * it is the only step that cannot wait for them to finish reading.
 */
export function RecoverPage() {
  const { data: checklists, error, reload } = useLoad(() => recoveryApi.checklists(), "checklists");
  const { done } = useRecoveryProgress();

  return (
    <ConsoleLayout title="Recovery checklists" subtitle="Step-by-step, in the order that matters">
      <ConsoleHero icon={LifeBuoy} tint="bg-gradient-to-br from-teal-500 to-emerald-500">
        <p>Being scammed is not your fault, and it happens to careful people. Pick what happened and work through the steps. Your ticks are saved as you go.</p>
      </ConsoleHero>

      <div className="flex items-start gap-3 rounded-ui border-l-4 border-rose-500 bg-rose-500/10 px-4 py-3.5">
        <Phone aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
        <p className="text-[0.9375rem] leading-snug text-ui-label">
          <strong>If money has left your account, call your bank first</strong> — on the number on the back of your card, not one from a message. Then come back here. In an emergency, call 000.
        </p>
      </div>

      {error ? (
        <FormAlert>
          {error.message}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </FormAlert>
      ) : null}

      <SettingsGroup title="What happened?">
        {!checklists ? (
          <div className="flex flex-col gap-3 p-4">{[0, 1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-lg bg-ui-fill" />)}</div>
        ) : (
          <ul className="divide-y divide-ui-separator">
            {checklists.map((checklist) => {
              const complete = checklist.steps.filter((step) => done.has(step.id)).length;
              const ratio = checklist.steps.length ? complete / checklist.steps.length : 0;

              return (
                <li key={checklist.slug}>
                  <Link to={`${ROUTES.recover}/${checklist.slug}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-ui-card-hover">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1rem] font-medium text-ui-label">{checklist.title}</span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ui-label-2">{checklist.situation}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[0.75rem] tabular-nums text-ui-label-3">
                        {complete ? `${complete} of ${checklist.steps.length} done` : `${checklist.steps.length} steps`}
                      </span>
                      <span aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-ui-fill">
                        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${ratio * 100}%` }} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsGroup>

      <SettingsGroup title="Free, independent help" footer="These services are free. Anyone who asks you for a fee to recover scammed money is running another scam.">
        <ul className="divide-y divide-ui-separator text-[0.9375rem]">
          <li className="px-4 py-3"><strong className="text-ui-label">IDCARE</strong> <span className="text-ui-label-2">— identity and cyber support, 1800 595 160</span></li>
          <li className="px-4 py-3"><strong className="text-ui-label">ReportCyber</strong> <span className="text-ui-label-2">— report to police at cyber.gov.au</span></li>
          <li className="px-4 py-3"><strong className="text-ui-label">Scamwatch</strong> <span className="text-ui-label-2">— the National Anti-Scam Centre at scamwatch.gov.au</span></li>
          <li className="px-4 py-3"><strong className="text-ui-label">Police Assistance Line</strong> <span className="text-ui-label-2">— 131 444, for non-urgent matters</span></li>
        </ul>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
