import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Flag, LifeBuoy, Loader2, ScanSearch, SearchX } from "lucide-react";
import { AlertCard } from "@/components/alerts/AlertCard";
import { SubscribeCard } from "@/components/alerts/SubscribeCard";
import { useCheckModal } from "@/components/check/useCheckModal";
import { useLoad } from "@/components/council/useLoad";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";
import { ROUTES, SITE } from "@/config/site";
import { alertsApi } from "@/lib/alerts/api";

/** One alert, with what to do about it. */
export function AlertDetailPage() {
  const { reference = "" } = useParams();
  const { open: openChecker } = useCheckModal();
  const { data, error } = useLoad((signal) => alertsApi.get(reference, signal).then((result) => result.alert), reference);

  const back = (
    <Link to={ROUTES.alerts} className="inline-flex items-center gap-1 self-start text-[0.9375rem] font-medium text-ui-tint hover:opacity-70">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Community alerts
    </Link>
  );

  if (error) {
    return (
      <ConsoleLayout title="Alert not found" subtitle={reference}>
        {back}
        <ConsoleHero icon={SearchX} tint="bg-slate-500">
          <p>There is no published alert with that reference.</p>
        </ConsoleHero>
      </ConsoleLayout>
    );
  }

  return (
    <ConsoleLayout title={data?.headline ?? "Community alert"} subtitle={reference}>
      {back}
      {data ? (
        <AlertCard alert={data} full />
      ) : (
        <ConsoleHero tile={<Loader2 className="h-9 w-9 animate-spin" />} tint="bg-slate-400">
          <p>Loading…</p>
        </ConsoleHero>
      )}

      <SettingsGroup title="If you have had a message like this" footer={`CyberKent is an advisory service. If you are in immediate danger call 000. Council's CyberSafe team: ${SITE.supportPhone}.`}>
        <SettingsRows inset={60}>
          <SettingsRow icon={LifeBuoy} iconClassName="bg-teal-500" label="I paid or shared details" detail="Call your bank first, then work through the first-hour checklist." to={ROUTES.recover} />
          <SettingsRow icon={Flag} iconClassName="bg-rose-500" label="Report it to Council" detail="It helps Council see how far it has spread." to={ROUTES.reportScam} />
          <SettingsRow icon={ScanSearch} iconClassName="bg-indigo-500" label="Check a different message" detail="Instant, private, free." onClick={openChecker} chevron />
        </SettingsRows>
      </SettingsGroup>

      <SubscribeCard defaultCategoryId={data?.category?.id} defaultSuburbId={data?.suburb?.id} />
    </ConsoleLayout>
  );
}
