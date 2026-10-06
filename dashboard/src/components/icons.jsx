/* ============================================================
   Inline SVG icon set — zero external dependencies.
   All icons inherit `currentColor` so CSS controls the glow color.
   ============================================================ */

const base = (props) => ({
  width: props.size || 20,
  height: props.size || 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

/** Hexagon circuit glyph shown on unrevealed tiles */
export const HexIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Golden bullion bar — safe reveal */
export const BullionIcon = (p) => (
  <svg {...base(p)} fill="none">
    <path d="M6 15h12l2 5H4z" />
    <path d="M8 15l1.5-4h5L16 15" />
    <path d="M9.5 11 11 8h2l1.5 3" opacity="0.6" />
  </svg>
);

/** Danger cube with glowing core — mine reveal */
export const MineIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 3 20 7.5v9L12 21 4 16.5v-9z" />
    <path d="M12 8v5" />
    <circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** Bitcoin ₿ motif for the balance widget */
export const BtcIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 8h3.7a2 2 0 0 1 0 4H9.5zM9.5 12h4.2a2 2 0 0 1 0 4H9.5z" />
    <path d="M11 6v2M13 6v2M11 16v2M13 16v2" />
  </svg>
);

/** Pickaxe / drill — CRYPTO CHAIN status */
export const ChainIcon = (p) => (
  <svg {...base(p)}>
    <path d="M4 20l7.5-7.5" />
    <path d="M10 11.5 13 8.5l2.5 2.5L12.5 14z" />
    <path d="M14 4c3 0 6 3 6 6 0 1.5-.6 2.6-1.5 3.5L15 10z" />
  </svg>
);

/** Vault / shield — CRYPTO VAULT BONUS status */
export const VaultIcon = (p) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8v1.5M12 14.5V16M8 12h1.5M14.5 12H16" />
  </svg>
);

/** Signal bars — link/status tracker */
export const SignalIcon = (p) => (
  <svg {...base(p)}>
    <path d="M5 19v-4M10 19v-8M15 19v-11M20 19V5" />
  </svg>
);

/** Sound toggle */
export const SoundIcon = (p) => (
  <svg {...base(p)}>
    <path d="M4 10v4h3l4 4V6L7 10z" />
    <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />
  </svg>
);

/** Brand gem pick for the header badge */
export const GemIcon = (p) => (
  <svg {...base(p)}>
    <path d="M7 3h10l4 6-9 12L3 9z" />
    <path d="M3 9h18M12 21 8.5 9 12 3l3.5 6z" opacity="0.7" />
  </svg>
);
