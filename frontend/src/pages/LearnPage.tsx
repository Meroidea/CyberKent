import { useMemo, useState } from "react";
import { BookOpen, LifeBuoy } from "lucide-react";
import { SearchBox } from "@/components/council/Filters";
import type { LearnArticle } from "@/content/learn";
import { useLibrary } from "@/lib/content/useLibrary";
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
function audienceSegments(articles: LearnArticle[]): readonly Segment<string>[] {
  return [
    { value: "all", label: "Everyone" },
    ...Array.from(new Set(articles.map((article) => article.category))).map((category) => ({ value: category, label: category })),
  ];
}

/**
 * The awareness library.
 *
 * Every guide the service has published, as a grouped list rather than as a
 * grid of covers. The landing page is where a guide is sold; this is the index
 * of them, and an index is read down a column — a reader here already knows
 * they want a guide and is choosing which, which is a scan of titles and
 * reading times, not of artwork.
 */
/**
 * FR57 — everything a guide says, as one lower-cased string to search.
 * Built once; the library is a handful of guides, so a scan is instant and
 * needs no index or server round trip.
 */
function searchText(article: LearnArticle): string {
  const blocks = article.sections.flatMap((section) => [
    section.heading,
    ...section.blocks.map((block) => JSON.stringify(block)),
  ]);
  return [article.title, article.summary, article.audience, article.lede, ...article.takeaways, ...blocks].join(" ").toLowerCase();
}


export function LearnPage() {
  const [audience, setAudience] = useState("all");
  const [query, setQuery] = useState("");
  /* Built-in guides at once; guides published from the admin panel join them. */
  const library = useLibrary();
  const INDEX = useMemo(() => library.map((article) => ({ article, text: searchText(article) })), [library]);
  const AUDIENCE_SEGMENTS = useMemo(() => audienceSegments(library), [library]);

  const guides = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return INDEX.filter(({ article, text }) => (audience === "all" || article.category === audience) && words.every((word) => text.includes(word))).map(({ article }) => article);
  }, [audience, query, INDEX]);

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

      <SearchBox label="Search the guides" value={query} onChange={setQuery} placeholder="Search — for example: gift card, invoice, password" />

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

      {guides.length === 0 ? (
        <p className="-mt-4 px-4 text-[0.9375rem] text-ui-label-2">No guide mentions “{query.trim()}”. Try a shorter word, or ask the CyberSafe Assistant.</p>
      ) : null}

      <SettingsGroup title="If it has already happened">
        <SettingsRow
          icon={LifeBuoy}
          iconClassName="bg-teal-500"
          label="Recovery checklists"
          detail="Steps for your situation, in the order that matters, with your progress saved."
          to={ROUTES.recover}
        />
      </SettingsGroup>
    </ConsoleLayout>
  );
}
