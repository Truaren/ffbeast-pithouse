import {
  AutoProfiles,
  Axes,
  BasePage,
  Buttons,
  Dashboard,
  EffectSettings,
  Monitoring,
  Pedals,
  Pins,
  Protocol,
  Settings,
} from "@pages";
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
  pedals: {
    path: "/pedals",
    title: "Pedals",
    icon: "icon fi fi-sr-brake-warning",
    component: Pedals,
    fullWidth: true,
  },
  effects: {
    path: "/effects",
    title: "Effects",
    icon: "icon fi fi-sr-dial",
    component: EffectSettings,
    fullWidth: true,
  },
  monitoring: {
    path: "/monitoring",
    title: "Monitoring",
    icon: "icon fi fi-sr-dashboard",
    component: Monitoring,
    fullWidth: true,
  },
  protocol: {
    path: "/protocol",
    title: "Protocol",
    icon: "icon fi fi-sr-data-transfer",
    component: Protocol,
    fullWidth: true,
  },
  pins: {
    path: "/pins",
    title: "Pins",
    icon: "icon fi fi-sr-workflow",
    component: Pins,
    fullWidth: true,
  },
  buttons: {
    path: "/buttons",
    title: "Buttons",
    icon: "icon fi fi-sr-menu-dots-vertical",
    component: Buttons,
    fullWidth: true,
  },
  axes: {
    path: "/axes",
    title: "Axes",
    icon: "icon fi fi-sr-arrows-alt-h",
    component: Axes,
    fullWidth: true,
  },
  autoProfiles: {
    path: "/autoprofiles",
    title: "Auto Profiles",
    icon: "icon fi fi-sr-gamepad",
    component: AutoProfiles,
    fullWidth: true,
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
