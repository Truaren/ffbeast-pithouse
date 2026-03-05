import { BasePage, Dashboard, EffectSettings, License, Settings } from "@pages";
import type { ComponentType } from "react";

export interface RouteConfig {
  path: string;
  title: string;
  icon?: string;
  component: ComponentType;
  fullWidth?: boolean;
}

export const ROUTES: Record<string, RouteConfig> = {
  dashboard: {
    path: "/",
    title: "Dashboard",
    icon: "icon fi fi-sr-home",
    component: Dashboard,
    fullWidth: true,
  },
  base: {
    path: "/base",
    title: "Base",
    icon: "icon fi fi-sr-computer",
    component: BasePage,
    fullWidth: true,
  },

  effects: {
    path: "/effects",
    title: "Effects",
    icon: "icon fi fi-sr-dial",
    component: EffectSettings,
    fullWidth: true,
  },

  license: {
    path: "/license",
    title: "License",
    icon: "icon fi fi-sr-key",
    component: License,
  },
  settings: {
    path: "/settings",
    title: "Settings",
    icon: "icon fi fi-rr-settings",
    component: Settings,
    fullWidth: true,
  },
} as const;

export type RouteKey = keyof typeof ROUTES;
