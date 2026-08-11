type StatusBadgeProps = {
  label: string;
  tone: "active" | "inactive" | "neutral";
};

const TONE_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-700/15",
  inactive: "bg-black/5 text-black/55 ring-black/10",
  neutral: "bg-amber-50 text-amber-800 ring-amber-700/15",
} as const;

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${TONE_STYLES[tone]}`}
    >
      {label}
    </span>
  );
}
