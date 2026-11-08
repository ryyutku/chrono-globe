// src/lib/config/nav.ts

export interface NavItem {
  label: string;
  href: string;
}

export const navConfig = {
  brand: "TimeSpot",
  items: [
    { label: "Home", href: "/" },
    { label: "World Clocks", href: "/clocks" },
    { label: "Meeting Planner", href: "/planner" },
    { label: "Timezones", href: "/zones" },
  ],
};