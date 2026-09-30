// Auto-generated. Do not edit directly.

export const themeColors = {
  "good": "#57a83b",
  "bad": "#9e3925",
  "bgDark": "#0d0c0a",
  "bgPanel": "#151618",
  "textHeader": "#c1c1cf",
  "textHighlight": "#e0d2d0",
  "textAccent": "#c5b6b4",
  "textDefault": "#a6b3c4",
  "textMuted": "#778da6",
  "textGood": "color-mix(in srgb,\r\n\t\t\tvar(--col-textDefault) 80%,\r\n\t\t\tvar(--col-good))",
  "textBad": "color-mix(in srgb,\r\n\t\t\tvar(--col-textDefault) 80%,\r\n\t\t\tvar(--col-bad))",
  "shadow": "rgba(0, 0, 0, 0.5)",
  "border": "#778da6",
  "borderGood": "color-mix(in srgb,\r\n\t\t\tvar(--col-border) 60%,\r\n\t\t\tvar(--col-good))",
  "borderBad": "color-mix(in srgb,\r\n\t\t\tvar(--col-border) 60%,\r\n\t\t\tvar(--col-bad))",
  "bgBtn": "var(--col-bgPanel)",
  "bgBtnHover": "color-mix(in srgb,\r\n\t\t\tvar(--col-bgBtn) 90%,\r\n\t\t\twhite)",
  "tile-light": "#272e3b",
  "tile-dark": "#1d222b",
  "tile-border": "#1d2831",
  "tile-highlight": "#1d2831",
  "tile-highlight2": "#204c45",
  "tile-house1": "#73291b",
  "tile-house2": "#9e3925",
  "tile-house3": "#cf4a31",
  "tile-road1": "#151533",
  "tile-road2": "#222252",
  "tile-bridge": "#182850",
  "tile-water": "#1a4a71",
  "tile-grass": "#2b6228",
  "tile-tree1": "#40943d"
} as const;

export type ThemeColorName = keyof typeof themeColors;
