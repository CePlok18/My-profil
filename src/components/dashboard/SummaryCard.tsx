import type { LucideIcon } from "lucide-react";

type SummaryCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <Icon size={20} color="var(--brand)" aria-hidden="true" />
    </article>
  );
}
