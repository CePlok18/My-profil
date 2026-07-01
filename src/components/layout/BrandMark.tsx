import { ShieldCheck } from "lucide-react";

export function BrandMark() {
  return (
    <div className="brand-mark">
      <span className="brand-icon" aria-hidden="true">
        <ShieldCheck size={21} />
      </span>
      <span>Smart Loker</span>
    </div>
  );
}
