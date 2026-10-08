import type { LucideIcon } from "lucide-react";

export type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, helper, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-icon" aria-hidden="true">
        <Icon size={25} strokeWidth={1.7} />
      </div>
      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <span className="metric-helper">{helper}</span>
      </div>
    </article>
  );
}
