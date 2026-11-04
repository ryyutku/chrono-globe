// src/components/layout/Nav.tsx

import Link from "next/link";
import { navConfig } from "@/lib/config/nav";
import { Container } from "@/components/layout/Container";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        {/* Brand */}
        <Link 
          href={navConfig.brand.href} 
          className="text-lg font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
        >
          {navConfig.brand.title}
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-6">
          {navConfig.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}