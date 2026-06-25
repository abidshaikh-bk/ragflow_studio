export type AppNavItem = {
  href: string;
  label: string;
  matchMode?: "exact" | "prefix";
};

const baseNavItems: AppNavItem[] = [
  { href: "/chat", label: "Chat", matchMode: "prefix" },
  { href: "/documents", label: "Documents", matchMode: "prefix" },
  { href: "/history", label: "History", matchMode: "prefix" },
  { href: "/settings", label: "Settings", matchMode: "prefix" }
];

export function getPrimaryNavItems(isAdmin: boolean): AppNavItem[] {
  if (!isAdmin) {
    return baseNavItems;
  }

  return [...baseNavItems, { href: "/admin", label: "Admin", matchMode: "prefix" }];
}

export function isNavItemActive(pathname: string, item: AppNavItem) {
  if (item.matchMode === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
