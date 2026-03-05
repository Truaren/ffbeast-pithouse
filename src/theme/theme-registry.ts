export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: {
    accent: string;
    bg: string;
    text: string;
    border: string;
  };
}

export const THEMES = [
  /* ======================
     DARK
     ====================== */

  {
    id: "dark",
    name: "Dark",
    description: "High-contrast dark theme with red accent",
    preview: {
      accent: "#e63f39",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-orange",
    name: "Dark Orange",
    description: "Dark theme with orange accent",
    preview: {
      accent: "#e46008",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-blue",
    name: "Dark Blue",
    description: "Dark theme with blue accent",
    preview: {
      accent: "#3b82f6",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-green",
    name: "Dark Green",
    description: "Dark theme with green accent",
    preview: {
      accent: "#22c55e",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-purple",
    name: "Dark Purple",
    description: "Dark theme with purple accent",
    preview: {
      accent: "#a855f7",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-teal",
    name: "Dark Teal",
    description: "Dark theme with teal accent",
    preview: {
      accent: "#14b8a6",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-rose",
    name: "Dark Rose",
    description: "Dark theme with rose accent",
    preview: {
      accent: "#f43f5e",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-slate",
    name: "Dark Slate",
    description: "Dark theme with slate accent",
    preview: {
      accent: "#64748b",
      bg: "#0e0e0e",
      border: "#ffffff12",
      text: "#ffffff",
    },
  },
  {
    id: "dark-carbon",
    name: "Dark Carbon",
    description: "Minimal dark theme with neutral accent",
    preview: {
      accent: "#9ca3af",
      bg: "#111111",
      border: "#ffffff12",
      text: "#f3f4f6",
    },
  },

  /* ======================
     OLED
     ====================== */

  {
    id: "oled",
    name: "OLED Black",
    description: "True black theme optimized for OLED displays",
    preview: {
      accent: "#e63f39",
      bg: "#000000",
      border: "#ffffff18",
      text: "#ffffff",
    },
  },
  {
    id: "oled-blue",
    name: "OLED Blue",
    description: "True black theme with blue accent",
    preview: {
      accent: "#3b82f6",
      bg: "#000000",
      border: "#ffffff18",
      text: "#ffffff",
    },
  },

  /* ======================
     LIGHT
     ====================== */

  {
    id: "light",
    name: "Light",
    description: "Clean light theme with balanced contrast",
    preview: {
      accent: "#e63f39",
      bg: "#ffffff",
      border: "#e0e0e0",
      text: "#111111",
    },
  },
  {
    id: "light-warm",
    name: "Light Warm",
    description: "Warm light theme with soft beige tones",
    preview: {
      accent: "#b45309",
      bg: "#fdf6ee",
      border: "#e5dccf",
      text: "#1f2937",
    },
  },

  /* ======================
     SOFT / MUTED LIGHT
     ====================== */

  {
    id: "light-soft",
    name: "Soft Light",
    description: "Low-contrast light theme for long sessions",
    preview: {
      accent: "#e63f39",
      bg: "#fafafa",
      border: "#dddddd",
      text: "#1a1a1a",
    },
  },
  {
    id: "light-muted",
    name: "Muted Light",
    description: "Muted light theme with reduced eye strain",
    preview: {
      accent: "#6b7280",
      bg: "#f5f5f5",
      border: "#d4d4d4",
      text: "#262626",
    },
  },
  {
    id: "light-sage",
    name: "Light Sage",
    description: "Soft light theme with sage accent",
    preview: {
      accent: "#4d7c6f",
      bg: "#f6faf8",
      border: "#d8e3dd",
      text: "#1f2937",
    },
  },
] as const satisfies readonly ThemeDefinition[];

export type Theme = (typeof THEMES)[number]["id"];
