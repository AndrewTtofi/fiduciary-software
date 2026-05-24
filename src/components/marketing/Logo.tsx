import Link from "next/link";

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const wordSize = size === "lg" ? "text-[32px]" : size === "sm" ? "text-[18px]" : "text-[22px]";
  const taglineSize = size === "lg" ? "text-[10px]" : "text-[9px]";
  return (
    <Link href={href} className="group inline-flex items-baseline gap-3">
      <span
        className={`font-display ${wordSize} leading-none tracking-[-0.025em] text-ink transition-colors duration-500 group-hover:text-accent-deep`}
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50', fontWeight: 400 }}
      >
        ORO
      </span>
      <span className={`font-mono ${taglineSize} tracking-[0.28em] uppercase text-muted hidden sm:inline`}>
        Private Counsel
      </span>
    </Link>
  );
}
