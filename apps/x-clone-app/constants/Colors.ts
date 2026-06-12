const xBlack = "#000000";
const xWhite = "#FFFFFF";

const Colors = {
  light: {
    text: "#0F1419",
    background: "#FFFFFF",
    tint: xBlack,
    icon: "#536471",
    tabIconDefault: "#333333",
    tabIconSelected: "#0F1419",
    border: "#EFF3F4",
    card: "#FFFFFF",
    cardElevated: "#F7F9F9",
    surface: "#F7F9F9",
    secondaryText: "#536471",
    mutedText: "#536471",
    placeholder: "#8B98A5",
    overlay: "rgba(15, 20, 25, 0.08)",
    danger: "#F4212E",
    success: "#00BA7C",
    warning: "#FFD400",
  },
  dark: {
    text: "#E7E9EA",
    background: "#000000",
    tint: xWhite,
    icon: "#71767B",
    tabIconDefault: "hsla(0, 0%, 100%, 0.70)",
    tabIconSelected: "#E7E9EA",
    border: "#2F3336",
    card: "#000000",
    cardElevated: "#16181C",
    surface: "#16181C",
    secondaryText: "#71767B",
    mutedText: "#71767B",
    placeholder: "#71767B",
    overlay: "rgba(231, 233, 234, 0.10)",
    danger: "#F4212E",
    success: "#00BA7C",
    warning: "#FFD400",
  },
} as const;

export default Colors;
