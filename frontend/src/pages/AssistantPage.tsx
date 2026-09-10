import { Bot, LifeBuoy, Phone, ScanSearch } from "lucide-react";
import { ROUTES } from "@/config/site";
import { AssistantChat } from "@/components/ai/AssistantChat";
import { ConsoleLayout } from "@/components/settings/ConsoleLayout";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsRow, SettingsRows } from "@/components/settings/SettingsRow";

/** Where the assistant hands people on to when a conversation is not enough. */
const HANDOFFS = [
  { Icon: ScanSearch, tint: "bg-indigo-500", label: "Check the message itself", detail: "Paste it into the scam checker for a scored, explained result.", to: ROUTES.checkMessage },
  { Icon: LifeBuoy, tint: "bg-teal-500", label: "Money has already moved", detail: "Call your bank on the number on your card, then follow the first-hour checklist.", to: `${ROUTES.learn}/first-hour` },
  { Icon: Phone, tint: "bg-slate-500", label: "Identity documents taken", detail: "IDCARE gives free, confidential support on 1800 595 160.", href: "https://www.idcare.org" },
];

/**
 * The CyberSafe Assistant page, inside the same console frame as every other
 * service page — the conversation is the page, and the hand-offs beneath it
 * are where the assistant sends people when a chat is not the right tool.
 */
export function AssistantPage() {
  return (
    <ConsoleLayout
      title="CyberSafe Assistant"
      subtitle="Plain answers about suspicious messages, what to do after being targeted, and keeping your accounts safe."
    >
      <header className="-mt-2 flex flex-col items-center pb-1 text-center">
        <span
          aria-hidden="true"
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem] bg-gradient-to-br from-indigo-600 to-cyan-500 text-white"
        >
          <Bot className="h-9 w-9" />
        </span>
        <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-ui-label-2">
          For residents, small businesses and community groups in Hume. The assistant is an AI and can be
          wrong; it never needs your passwords, codes or card numbers.
        </p>
      </header>

      <AssistantChat />

      <SettingsGroup title="When a chat is not enough">
        <SettingsRows inset={60}>
          {HANDOFFS.map(({ Icon, tint, label, detail, to, href }) => (
            <SettingsRow key={label} icon={Icon} iconClassName={tint} label={label} detail={detail} to={to} href={href} chevron />
          ))}
        </SettingsRows>
      </SettingsGroup>
    </ConsoleLayout>
  );
}
