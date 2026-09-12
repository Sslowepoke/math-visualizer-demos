export const THEME_STORAGE_KEY: string;

export type ThemeName = "dark" | "light";

export type Palette = {
  background: number;
  background_dim: number;
  grey: number;
  red: number;
  yellow: number;
  green: number;
  blue: number;
  purple: number;
  fg: number;
  statusline: number;
  edge: number;
};

export const palettes: Record<ThemeName, Palette>;

export function getTheme(): ThemeName;
export function applyDocumentTheme(theme?: ThemeName): void;
export function setTheme(theme: ThemeName): void;
export function toggleTheme(): void;
export function palette(): Palette;
export function hexColor(color: number): string;
export function createThemeToggle(): HTMLButtonElement;
