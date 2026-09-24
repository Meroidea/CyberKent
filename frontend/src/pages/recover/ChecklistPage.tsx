import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Cloud, Flag, HardDrive, SearchX } from "lucide-react";
import { useLoad } from "@/components/council/useLoad";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { ROUTES } from "@/config/site";
import { recommendedGuides } from "@/lib/recommend";
import { recoveryApi } from "@/lib/recovery/api";
import { useRecoveryProgress } from "@/lib/recovery/useProgress";
import { cn } from "@/lib/cn";

/** FR58, FR60 — one checklist, worked step by step, with progress kept. */
export function ChecklistPage() {
  const { slug = "" } = useParams();
  const { data: checklists } = useLoad(() => recoveryApi.checklists(), "checklists");
  const { done, toggle, onAccount } = useRecoveryProgress();
  const checklist = checklists?.find((entry) => entry.slug === slug);

  const back = (
    <Link to={ROUTES.recover} className="inline-flex items-center gap-1 self-start text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      All checklists
    </Link>
  );

  if (checklists && !checklist) {
    return (
      <ConsoleLayout title="Checklist not found">
        {back}
        <ConsoleHero icon={SearchX} tint="bg-slate-500"><p>There is no checklist at that address.</p></ConsoleHero>
      </ConsoleLayout>
    );
  }

  const complete = checklist ? checklist.steps.filter((step) => done.has(step.id)).length : 0;
  const total = checklist?.steps.length ?? 0;
  const guides = recommendedGuides(checklist?.categories[0]);

  return (
    <ConsoleLayout title={checklist?.title ?? "Recovery checklist"} subtitle={checklist?.situation}>
      {back}

      <div className="rounded-ui bg-ui-card px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <p className="text-[0.9375rem] font-medium text-ui-label" aria-live="polite">
            {total ? (complete === total ? "Every step done. Well done — that was the hard part." : `${complete} of ${total} steps done`) : "Loading…"}
          </p>
          <p className="flex items-center gap-1 text-[0.75rem] text-ui-label-3">
            {onAccount ? <Cloud aria-hidden="true" className="h-3.5 w-3.5" /> : <HardDrive aria-hidden="true" className="h-3.5 w-3.5" />}
            {onAccount ? "Saved to your account" : "Saved on this device"}
          </p>
        </div>
        <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-ui-fill">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${total ? (complete / total) * 100 : 0}%` }} />
        </div>
      </div>

      <SettingsGroup footer={onAccount ? undefined : <><Link to={ROUTES.signIn} className="font-medium text-ui-tint">Sign in</Link> to keep your progress across devices. Your ticks here will come with you.</>}>
        {!checklist ? (
          <div className="flex flex-col gap-3 p-4">{[0, 1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-lg bg-ui-fill" />)}</div>
        ) : (
          <ol className="divide-y divide-ui-separator">
            {checklist.steps.map((step) => {
              const ticked = done.has(step.id);
              return (
                <li key={step.id}>
                  <label className="flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-ui-card-hover">
                    <input type="checkbox" checked={ticked} onChange={(event) => void toggle(step.id, event.target.checked)} className="peer sr-only" />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[0.75rem] font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ui-tint peer-focus-visible:ring-offset-2",
                        ticked ? "border-emerald-500 bg-emerald-500 text-white" : "border-ui-fill-strong text-ui-label-3",
                      )}
                    >
                      {ticked ? <Check className="h-3.5 w-3.5" /> : step.position}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[1rem] font-medium leading-snug", ticked ? "text-ui-label-2 line-through decoration-ui-label-3" : "text-ui-label")}>{step.title}</span>
                      <span className="mt-1 block text-[0.875rem] leading-relaxed text-ui-label-2">{step.detail}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
        )}
      </SettingsGroup>

      <SettingsGroup title="Also useful">
        <SettingsRows inset={60}>
          <SettingsRow icon={Flag} iconClassName="bg-rose-500" label="Report it to Council" detail="So officers can warn others in Hume. Your details are never published." to={ROUTES.reportScam} />
          {guides.map((guide) => (
            <SettingsRow key={guide.id} label={guide.title} detail={guide.summary} value={guide.readingTime} to={`${ROUTES.learn}/${guide.id}`} />
          ))}
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
