"use client";

import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export function LogoutButton({
  className = "logout-button",
  label = "Log Out"
}: LogoutButtonProps) {
  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    window.location.href = "/login";
  }

  return (
    <button className={className} type="button" onClick={handleLogout}>
      <LogOut size={18} />
      {label}
    </button>
  );
}
