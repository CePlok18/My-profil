"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();

    window.setTimeout(() => {
      setRefreshing(false);
    }, 700);
  }

  return (
    <button
      className="secondary-button"
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
    >
      <RefreshCw className={refreshing ? "spin-icon" : ""} size={17} />
      {refreshing ? "Memuat..." : "Refresh"}
    </button>
  );
}
