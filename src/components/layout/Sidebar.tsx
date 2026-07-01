"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandMark } from "./BrandMark";

export function Sidebar() {
  const pathname = usePathname();
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Data User", href: "/admin/users", icon: Users },
    { label: "Profile Akun", href: "/admin/profile", icon: UserCircle }
  ];

  return (
    <aside className="sidebar">
      <BrandMark />
      <nav className="nav-list" aria-label="Menu admin">
        {navItems.map((item) => (
          <Link
            className={`nav-item${pathname === item.href ? " active" : ""}`}
            href={item.href}
            key={item.label}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <LogoutButton />
      </div>
    </aside>
  );
}
