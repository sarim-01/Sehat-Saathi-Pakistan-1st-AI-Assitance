/** Minimal clinical SVG icons (no emoji). Stroke-based for scaling. */

export function SvgRiskHigh({ size = 22, stroke = "#dc2626" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L3 21h18L12 3z"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10v5M12 18h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SvgRiskMedium({ size = 22, stroke = "#d97706" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke={stroke} strokeWidth="1.75" />
      <path d="M12 9v6M12 17h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SvgRiskLow({ size = 22, stroke = "#16a34a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke={stroke} strokeWidth="1.75" />
      <path d="M8 12.5l2.8 2.5L17 10" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SvgRiskUnknown({ size = 22, stroke = "#6b7280" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke={stroke} strokeWidth="1.75" />
      <path d="M9.5 9.5c.5-1 1.5-2 3-2 2 0 3.5 1.8 3.5 4 0 2-2.5 3-2.7 5M12 18h.01" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  )
}

export function SvgDangerCard({ size = 18 }) {
  const s = "#dc2626"
  return <SvgRiskHigh size={size} stroke={s} />
}

export function SvgHospitalCard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V8l4-4h8l4 4v12" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16M9 20v-5h6v5M12 13v7" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.35" fill="#d97706" />
    </svg>
  )
}

export function SvgSpeechCard({ size = 18, stroke = "currentColor" }) {
  const s = stroke
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-6l-4 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z"
        stroke={s}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SvgCalendarCard({ size = 18 }) {
  const s = "#475569"
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="6" width="15" height="14" rx="2" stroke={s} strokeWidth="1.6" />
      <path d="M8 10V4M16 10V4M5 13h14" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function SvgHospitalBuilding({ size = 20, stroke = "#d97706" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V8l4-4h8l4 4v12" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16M9 20v-5h6v5M12 13v7" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.35" fill={stroke} />
    </svg>
  )
}

export function SvgPhone({ size = 18, stroke = "#dc2626" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke={stroke}
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SvgDownload({ size = 18, stroke = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v13M8 13l4 5 4-5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
