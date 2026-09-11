import {
  Bell,
  BookOpen,
  Bot,
  ClipboardList,
  FileCheck2,
  Flag,
  Layers,
  ListChecks,
  MapPinned,
  Milestone,
  ScanSearch,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { NavResource } from "@/config/site";
import type { DocumentIcon } from "@/content/documents";

/** Maps the icon keys held in config to concrete components. */
export const RESOURCE_ICONS: Record<NavResource["icon"], LucideIcon> = {
  scan: ScanSearch,
  flag: Flag,
  bell: Bell,
  map: MapPinned,
  book: BookOpen,
  bot: Bot,
};

/** The same arrangement for the published project documents. */
export const DOCUMENT_ICONS: Record<DocumentIcon, LucideIcon> = {
  requirements: ClipboardList,
  architecture: Layers,
  interim: ScrollText,
  midproject: Milestone,
  srs: FileCheck2,
  features: ListChecks,
};
