import { Link2, Lock, LockOpen, QrCode } from "lucide-react";
import { analyseLink, type ParsedLink } from "@/lib/scam/links";
import { RowSeparator, SettingsGroup } from "@/components/settings/SettingsGroup";
import { cn } from "@/lib/cn";

/**
 * Every link in the message, taken apart where the reader can see it.
 *
 * The Lecturer's feedback was that links must not be treated as plain text, and
 * that applies to how they are shown as much as to how they are scored. A link
 * printed back as a string invites the same glance that the scam was designed
 * for. Shown as parts — the domain that actually owns it set apart from
 * everything dressed up around it — the deception is visible without having to
 * be explained.
 *
 * Nothing here is clickable, and every address is defanged (`hxxps`, `[.]`)
 * so it cannot be auto-linked by a mail client once a report is copied out.
 */
export function LinkBreakdown({ links, qrCodes }: { links: ParsedLink[]; qrCodes: string[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <SettingsGroup
      title={`Where the links really go — ${links.length}`}
      footer="Every address is taken apart by the browser's own URL parser. The domain shown in bold is the one that actually owns the link. Nothing here is clickable, and addresses are written hxxps / [.] so they cannot turn back into links when copied."
    >
      <ul className="flex flex-col">
        {links.map((link, index) => {
          /* Each card shows what is wrong with *this* link, recomputed from the
             same pure rules rather than filtered out of the combined list. */
          const flags = analyseLink(link);
          const fromQr = qrCodes.includes(link.raw);
          const secure = link.scheme === "https" && link.schemeGiven;

          return (
            <li key={link.href}>
              {index > 0 ? <RowSeparator /> : null}
              <div className="flex items-start gap-2.5 px-4 py-3">
                {fromQr ? (
                  <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-label="Found in a QR code" />
                ) : (
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[0.75rem] text-ui-label-2">
                    {fromQr ? "QR code opens" : "Registered to"}
                  </p>
                  <p
                    className={cn(
                      "break-all font-mono text-sm font-semibold",
                      flags.some((flag) => flag.weight === "high")
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-ui-label",
                    )}
                  >
                    {link.registrableDomain || link.scheme}
                  </p>
                  <p className="mt-1 break-all font-mono text-[0.6875rem] leading-relaxed text-ui-label-2">
                    {link.defanged}
                  </p>

                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-ui-label-2">
                    <div className="flex items-center gap-1">
                      {secure ? (
                        <Lock className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <LockOpen className="h-3 w-3" aria-hidden="true" />
                      )}
                      <dt className="sr-only">Scheme</dt>
                      <dd>{link.schemeGiven ? link.scheme : "no scheme given"}</dd>
                    </div>
                    {link.subdomain ? (
                      <div className="flex gap-1">
                        <dt>prefix</dt>
                        <dd className="break-all font-mono">{link.subdomain}</dd>
                      </div>
                    ) : null}
                    {link.path && link.path !== "/" ? (
                      <div className="flex min-w-0 gap-1">
                        <dt>path</dt>
                        <dd className="break-all font-mono">{link.path}</dd>
                      </div>
                    ) : null}
                    {link.isOfficial ? (
                      <div>
                        <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                          government or education domain
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {flags.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Problems with this link">
                      {flags.map((flag) => (
                        <li
                          key={flag.id}
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[0.625rem] font-semibold",
                            flag.weight === "high"
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : flag.weight === "medium"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
                          )}
                        >
                          {flag.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SettingsGroup>
  );
}
