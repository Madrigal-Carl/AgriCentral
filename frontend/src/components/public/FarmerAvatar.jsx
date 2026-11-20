import { useState } from "react";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-base",
};

function initialsOf(row) {
  const initials = [row.firstName, row.lastName]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("");
  return (initials || row.fullName?.trim()?.[0] || "?").toUpperCase();
}

// Circular avatar: the uploaded profile image, or initials when there is
// none (or it fails to load, e.g. the asset was removed).
export function FarmerAvatar({ row, size = "md" }) {
  const url = row.profileImage?.url;
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = Boolean(url) && failedUrl !== url;

  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft font-display text-accent ${SIZES[size] ?? SIZES.md}`}>
      {showImage ? (
        <img
          src={url}
          alt={row.fullName ? `${row.fullName} profile photo` : "Farmer profile photo"}
          loading="lazy"
          className="h-full w-full rounded-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(row)}</span>
      )}
    </div>
  );
}
