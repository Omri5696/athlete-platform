export const APP_NAME = "קשב";

/** Small mark — an open ear / listening curve. */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5a5 5 0 1 1 8.5 3.5c-1.2 1.2-1.6 2-1.6 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="1.7" fill="currentColor" />
    </svg>
  );
}
