/** Sunrise mark + "מוקד בוקר" wordmark. */
export function Wordmark({ who }: { who?: string }) {
  return (
    <div className="wordmark">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 14.5h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4.5 14.5a5.5 5.5 0 0 1 11 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10 2v2.4M3.6 4.9l1.5 1.7M16.4 4.9l-1.5 1.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="name">מוקד בוקר</span>
      {who && (
        <span className="who">
          מחובר כ־<b>{who}</b>
        </span>
      )}
    </div>
  );
}
