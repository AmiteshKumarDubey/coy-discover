"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar">
      {tabs.map(({ href, label, icon: Icon }) => {
        // Exact match for "/" so Home is never active on /discover
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} className={`tab-item${isActive ? " active" : ""}`}>
            <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="tab-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
