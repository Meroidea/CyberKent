import {
  Accessibility,
  Bell,
  BookOpen,
  FileText,
  Flag,
  LifeBuoy,
  Lock,
  MapPinned,
  ScanSearch,
  Scale,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ConsoleIcon } from "@/config/console";

/** Maps the icon keys held in `config/console` to concrete components. */
export const CONSOLE_ICONS: Record<ConsoleIcon, LucideIcon> = {
  scan: ScanSearch,
  flag: Flag,
  bell: Bell,
  map: MapPinned,
  recover: LifeBuoy,
  learn: BookOpen,
  documents: FileText,
  signIn: UserRound,
  register: UserPlus,
  privacy: Lock,
  accessibility: Accessibility,
  terms: Scale,
};
