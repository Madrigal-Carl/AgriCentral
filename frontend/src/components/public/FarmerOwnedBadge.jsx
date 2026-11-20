// Marks a crop the farmer owns (not government stock) wherever farm crops are listed.
export function FarmerOwnedBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning ${className}`}
    >
      Farmer-owned
    </span>
  );
}
