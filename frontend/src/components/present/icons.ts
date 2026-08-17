import {
  Bell,
  Database,
  Eye,
  Gauge,
  HeartHandshake,
  Flag,
  Languages,
  Lock,
  Plus,
  ScanSearch,
  Scale,
  SearchCheck,
  Settings2,
  ShieldAlert,
  Siren,
  Split,
  Store,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The one place a content key becomes a component.
 *
 * `content/presentation.ts` names its icons as strings so it stays free of JSX,
 * the same arrangement `config/site.ts` uses for the navigation resources.
 */
export const DECK_ICONS: Record<string, LucideIcon> = {
  bell: Bell,
  database: Database,
  eye: Eye,
  flag: Flag,
  gauge: Gauge,
  heart: HeartHandshake,
  languages: Languages,
  lock: Lock,
  plus: Plus,
  scale: Scale,
  scan: ScanSearch,
  searchCheck: SearchCheck,
  settings: Settings2,
  shieldAlert: ShieldAlert,
  siren: Siren,
  split: Split,
  store: Store,
  trend: TrendingUp,
  users: Users,
};
