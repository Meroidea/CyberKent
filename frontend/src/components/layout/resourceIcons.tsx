import { Bell, BookOpen, Flag, MapPinned, ScanSearch, type LucideIcon } from "lucide-react";
import type { NavResource } from "@/config/site";

/** Maps the icon keys held in config to concrete components. */
export const RESOURCE_ICONS: Record<NavResource["icon"], LucideIcon> = {
  scan: ScanSearch,
  flag: Flag,
  bell: Bell,
  map: MapPinned,
  book: BookOpen,
};
