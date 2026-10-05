/**
 * CryptoMines brand mark — a hexagon outline with a center dot.
 *
 * Rendered as inline SVG (NOT lucide-react) on purpose: the 25 closed tiles
 * each show this symbol, and plain static markup keeps first paint and
 * tile re-renders as cheap as possible (section 24/25 performance rules).
 */
export default function CryptoSymbol({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5Z" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
