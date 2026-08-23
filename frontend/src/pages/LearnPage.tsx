import { useMemo, useState } from "react";
import { BookOpen, Hammer, LifeBuoy } from "lucide-react";
import { LEARN_ARTICLES } from "@/content/learn";
import { SegmentedControl, type Segment } from "@/components/settings/SegmentedControl";
import { ROUTES } from "@/config/site";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";

/**
 * Who each guide is for, as the one axis worth filtering on.
 *
 * Derived from the library rather than listed, so publishing a guide for a new
 * audience puts the segment on the control and there is nothing to remember.
 * "Everyone" is prepended because a filter with no way back to the full list
 * is a dead end.
 */
const AUDIENCE_SEGMENTS: readonly Segment<string>[] = [
  { value: "all", label: "Everyone" },
  ...Array.from(new Set(LEARN_ARTICLES.map((article) => article.category))).map((category) => ({
    value: category,
    label: category,
  })),
];

/**
 * The awareness library.
 *
 * Every guide the service has published, as a grouped list rather than as a
 * grid of covers. The landing page is where a guide is sold; this is the index
 * of them, and an index is read down a column — a reader here already knows
 * they want a guide and is choosing which, which is a scan of titles and
 * reading times, not of artwork.
 */
export function LearnPage() {
  const [audience, setAudience] = useState("all");

  const guides = useMemo(
    () =>
      audience === "all"
        ? LEARN_ARTICLES
        : LEARN_ARTICLES.filter((article) => article.category === audience),
    [audience],
  );

  return (
    <ConsoleLayout
      title="Awareness library"
      subtitle="Short, practical guides for residents, small businesses and volunteer-run organisations."
    >
      <header className="-mt-2 flex flex-col items-center pb-1 text-center">
        <span
          aria-hidden="true"
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem] bg-sky-500 text-white"
        >
          <BookOpen className="h-9 w-9" />
        </span>
        <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ui-label-2">
          Each one is written to be read in a sitting and acted on the same day. None of them
          assumes you work in security.
        </p>
      </header>

      <div className="-mt-2">
        <SegmentedControl
          label="Filter guides by who they are written for"
          segments={AUDIENCE_SEGMENTS}
          value={audience}
          onChange={setAudience}
        />
      </div>

      <SettingsGroup
        title={`${guides.length} ${guides.length === 1 ? "guide" : "guides"}`}
        footer="Reading times are for the whole guide. Every one of them opens with what you will leave knowing, so a skim is a fair way to read it."
      >
        <SettingsRows>
          {guides.map((article) => (
            <SettingsRow
              key={article.id}
              to={`${ROUTES.learn}/${article.id}`}
              label={article.title}
              detail={article.summary}
              value={article.readingTime}
            />
          ))}
        </SettingsRows>
      </SettingsGroup>

      {/*
       * Avoid.md §14: the library is specified as searchable and grouped by
       * situation, and it is not yet. Saying so is what keeps the list above
       * readable as the whole of what exists today rather than as a sample of
       * something larger that cannot be found.
       */}
      <SettingsGroup title="Still being built">
        <SettingsRows>
          <SettingsRow
            icon={Hammer}
            iconClassName="bg-amber-500"
            label="Search and grouping"
            detail="Situation-based grouping and a search field over the library."
            value="In development"
          />
          <SettingsRow
            icon={LifeBuoy}
            iconClassName="bg-teal-500"
            label="Recovery checklists"
            detail="Steps you can work through and tick off, with progress saved."
            to={ROUTES.recover}
          />
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
