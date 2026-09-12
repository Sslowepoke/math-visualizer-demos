export const THEME_STORAGE_KEY = "math-demos-theme";

export const palettes = {
  dark: {
    background: 0x232a2e,
    background_dim: 0x2c3337,
    grey: 0x7a8478,
    red: 0xe67e80,
    yellow: 0xdbbc7f,
    green: 0xa7c080,
    blue: 0x7fbbb3,
    purple: 0xd699b6,
    fg: 0xd3c6aa,
    statusline: 0xa7c080,
    edge: 0xffffff,
  },
  light: {
    background: 0xfdf6e3,
    background_dim: 0xefebd4,
    grey: 0xa6b0a0,
    red: 0xf85552,
    yellow: 0xdfa000,
    green: 0x8da101,
    blue: 0x3a94c5,
    purple: 0xdf69ba,
    fg: 0x5c6a72,
    statusline: 0x93b259,
    edge: 0x5c6a72,
  },
};

export function getTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore unavailable storage
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyDocumentTheme(theme = getTheme()) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore unavailable storage
  }

  applyDocumentTheme(theme);
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

export function palette() {
  return palettes[getTheme()];
}

export function hexColor(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function createThemeToggle() {
  const param = new URLSearchParams(location.search).get("theme");
  if (param === "light" || param === "dark") {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, param);
    } catch {
      // ignore unavailable storage
    }
  }

  applyDocumentTheme();

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";

  const sync = () => {
    const theme = getTheme();
    button.dataset.theme = theme;
    button.textContent = theme === "dark" ? "Light" : "Dark";
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
  };

  sync();
  button.addEventListener("click", () => {
    toggleTheme();
    sync();
  });
  window.addEventListener("themechange", sync);
  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyDocumentTheme(getTheme());
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme: getTheme() } }),
    );
  });

  document.body.appendChild(button);
  return button;
}
