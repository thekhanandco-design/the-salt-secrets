"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SiteThemeContextValue = {
  dark: boolean;
  toggle: () => void;
};

const SiteThemeContext = createContext<SiteThemeContextValue>({ dark: false, toggle: () => undefined });

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("salt-site-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : preferred;
    setDark(next);
    document.documentElement.classList.toggle("site-dark", next);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("salt-site-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("site-dark", next);
  }

  return <SiteThemeContext.Provider value={{ dark, toggle }}>{children}</SiteThemeContext.Provider>;
}

export function useSiteTheme() {
  return useContext(SiteThemeContext);
}
