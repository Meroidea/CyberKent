import { NAV_RESOURCES } from "@/config/site";
import { DOCUMENTS } from "@/content/documents";
import { DOCUMENT_ICONS, RESOURCE_ICONS } from "@/components/layout/resourceIcons";
import type { NavDropdownItem } from "@/components/layout/NavDropdown";

/**
 * The navigation menus, resolved once.
 *
 * Built here rather than inside each renderer because the desktop dropdown and
 * the mobile menu show the same two menus; mapping config to icons in both
 * places is exactly the duplication Rule 1.3 rules out, and it is the kind that
 * drifts silently — one menu gains an item and the other does not.
 */

export const SERVICE_MENU: NavDropdownItem[] = NAV_RESOURCES.map((resource) => ({
  label: resource.label,
  href: resource.href,
  description: resource.description,
  Icon: RESOURCE_ICONS[resource.icon],
}));

/**
 * Derived from the document register rather than restated, so publishing a
 * document puts it in the navigation and there is only one list to maintain.
 *
 * The menu is the register: every document is one click from here, so it
 * carries no entry for a page that would only list again what this list
 * already shows.
 */
export const DOCUMENT_MENU: NavDropdownItem[] = DOCUMENTS.map((document) => ({
  label: document.title,
  href: document.href,
  description: document.navDescription,
  Icon: DOCUMENT_ICONS[document.icon],
}));
