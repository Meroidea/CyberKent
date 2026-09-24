import { Accessibility, Lock, Scale } from "lucide-react";
import { ConsoleHero } from "@/components/settings/ConsoleHero";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { LEGAL, type LegalDocument } from "@/content/legal";
import { formatDate } from "@/lib/report/labels";

const ICON = { privacy: Lock, accessibility: Accessibility, terms: Scale } as const;

/** The privacy, accessibility and terms statements, each a stack of short sections. */
export function LegalPage({ slug }: { slug: LegalDocument["slug"] }) {
  const document = LEGAL[slug];

  return (
    <ConsoleLayout title={document.title} subtitle={document.summary}>
      <ConsoleHero icon={ICON[slug]} tint="bg-slate-600">
        <p>Last updated {formatDate(document.updated)}.</p>
        <p className="mt-1 text-[0.8125rem] text-ui-label-3">Prepared for Hume City Council; pending review by Council's privacy officer before public launch.</p>
      </ConsoleHero>

      {document.sections.map((section) => (
        <SettingsGroup key={section.heading} title={section.heading}>
          <div className="flex flex-col gap-3 px-4 py-3.5 text-[0.9375rem] leading-relaxed text-ui-label">
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.list ? (
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ui-label-3">
                {section.list.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </div>
        </SettingsGroup>
      ))}
    </ConsoleLayout>
  );
}
