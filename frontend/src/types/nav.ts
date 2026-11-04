// src/types/nav.ts
export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavConfig {
  brand: {
    title: string;
    href: string;
  };
  items: NavItem[];
}