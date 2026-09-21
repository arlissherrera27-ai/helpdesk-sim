export const COLORS = {
  appBg: "#0b0f14",
  panel: "rgba(255,255,255,0.03)",
  panelSoft: "rgba(255,255,255,0.02)",
  border: "#2a2a2a",

  text: "#f5f7fb",
  body: "#d1d5db",
  muted: "#9aa4b2",

  primary: "#a78bfa",
  primaryStrong: "#6d4aff",

  success: "#22c55e",
  successDark: "#1f7a3a",

  practice: "#22c55e",
  practiceStrong: "#1f7a3a",

  assessment: "#93c5fd",
  assessmentStrong: "#60a5fa",
};

export const TEXT = {
  label: "12px",
  detail: "13px",
  body: "14px",
  section: "20px",
  title: "24px",
  hero: "56px",
};

export const SPACE = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "22px",
  xl: "28px",
  xxl: "40px",
};

export const RADIUS = {
  button: "8px",
  chip: "10px",
  card: "12px",
  pill: "999px",
};

export const CARD = {
  base: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.card,
    background: COLORS.panel,
  },
};

export const BUTTON = {
  secondary: {
    fontFamily: "monospace",
    padding: "10px 14px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.button,
    background: "transparent",
    color: COLORS.text,
    cursor: "pointer",
  },

  primary: {
    fontFamily: "monospace",
    padding: "10px 14px",
    border: `1px solid ${COLORS.primaryStrong}`,
    borderRadius: RADIUS.button,
    background: "rgba(109, 74, 255, 0.18)",
    color: COLORS.text,
    cursor: "pointer",
  },
};