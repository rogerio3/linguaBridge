"use client";
interface Props { size?: number; spinning?: boolean; className?: string }
export function GlobeIcon({ size = 28, spinning, className = "" }: Props) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${spinning ? "animate-spin" : ""} ${className}`}
      style={spinning ? { animationDuration: "3s" } : undefined}
    >
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.5"/>
      <ellipse cx="16" cy="16" rx="5.5" ry="14.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1.5" y1="16" x2="30.5" y2="16" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3"   y1="10" x2="29"   y2="10" stroke="currentColor" strokeWidth="1" opacity=".5"/>
      <line x1="3"   y1="22" x2="29"   y2="22" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    </svg>
  );
}
