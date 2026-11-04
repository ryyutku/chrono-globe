// src/lib/config/nav.ts
import { NavConfig } from "@/types/nav";

export const navConfig: NavConfig = {
  brand: {
    title: "ChronoWorld",
    href: "/",
  },
  items: [
    { label: "World Clocks", href: "/clocks" },
    { label: "Meeting Planner", href: "/planner" },
    { label: "Timezones", href: "/zones" },
  ],
};