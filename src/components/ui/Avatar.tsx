const PALETTE = [
  { bg: "#EEF2FF", fg: "#4F46E5" },
  { bg: "#ECFDF5", fg: "#10B981" },
  { bg: "#FFFBEB", fg: "#F59E0B" },
  { bg: "#FEF2F2", fg: "#EF4444" },
  { bg: "#F0F9FF", fg: "#0EA5E9" },
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const initial = name.trim()[0]?.toUpperCase() || "?";
  const { bg, fg } = colorFor(name || "?");
  const dim = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${dim}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initial}
    </span>
  );
}
