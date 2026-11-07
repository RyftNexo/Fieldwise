/** Decorative rolling hills with field rows. Colour comes from `currentColor`; screen readers skip it. */
export function HillsArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 240"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M0 150 C 180 80, 360 110, 560 140 S 920 200, 1200 110 L1200 240 L0 240 Z"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M0 185 C 220 135, 430 165, 650 182 S 990 145, 1200 172 L1200 240 L0 240 Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path
        d="M0 214 C 260 188, 520 204, 770 212 S 1050 192, 1200 204 L1200 240 L0 240 Z"
        fill="currentColor"
        opacity="0.22"
      />
      <g stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" fill="none">
        <path d="M700 196 Q 790 186 880 190" />
        <path d="M690 205 Q 800 194 905 199" />
        <path d="M120 190 Q 210 176 300 180" />
      </g>
    </svg>
  );
}
