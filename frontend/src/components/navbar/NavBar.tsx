"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./NavBar.css";

const LINKS = [
    { href: "/", label: "Home" },
    { href: "/globe", label: "Globe" },
];

export default function NavBar() {
    const pathname = usePathname();

    return (
        <nav className="nav">
            {LINKS.map((l) => (
                <Link
                    key={l.href}
                    href={l.href}
                    className={
                        pathname === l.href ? "nav__link nav__link--active" : "nav__link"
                    }
                >
                    {l.label}
                </Link>
            ))}
        </nav>
    );
}