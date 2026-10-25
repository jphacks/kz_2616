/** アイコンの共通の枠。線の色は文字の色（currentColor）に合わせる */
function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** マイク */
export function MicIcon() {
  return (
    <IconBase>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </IconBase>
  );
}

/** 雪の結晶（雪記号） */
export function SnowflakeIcon() {
  return (
    <IconBase>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3.6" y1="7" x2="20.4" y2="17" />
      <line x1="3.6" y1="17" x2="20.4" y2="7" />
      <polyline points="9 3.5 12 6 15 3.5" />
      <polyline points="9 20.5 12 18 15 20.5" />
    </IconBase>
  );
}
