import {
  AutoProfiles,
  Axes,
  BasePage,
  Buttons,
  Dashboard,
  EffectSettings,
  GameCompatibility,
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
    icon: "icon fi fi-sr-apps",
    component: Dashboard,
    fullWidth: true,
  },
  base: {
    path: "/base",
    title: "Base Settings",
    icon: "icon fi fi-sr-settings-sliders",
    component: BasePage,
    fullWidth: true,
  },
  pedals: {
    path: "/pedals",
    title: "Pedals",
    icon: "icon fi fi-sr-tachometer-fast",
    component: Pedals,
    fullWidth: true,
  },
  compatibility: {
    path: "/compatibility",
    title: "Compatibility",
    icon: "icon fi fi-sr-shield-check",
    component: GameCompatibility,
    fullWidth: false,
  },
  effects: {
    path: "/effects",
    title: "Force Effects",
    icon: "icon fi fi-sr-swatchbook",
    component: EffectSettings,
    fullWidth: true,
  },
  monitoring: {
    path: "/monitoring",
    title: "Live Monitoring",
    icon: "icon fi fi-sr-chart-histogram",
    component: Monitoring,
    fullWidth: true,
  },
  protocol: {
    path: "/protocol",
    title: "Protocol Info",
    icon: "icon fi fi-sr-interrogation",
    component: Protocol,
    fullWidth: true,
  },
  pins: {
    path: "/pins",
    title: "Pin Mapping",
    icon: "icon fi fi-sr-link",
    component: Pins,
    fullWidth: true,
  },
  buttons: {
    path: "/buttons",
    title: "Button Mapper",
    icon: "icon fi fi-sr-keyboard",
    component: Buttons,
    fullWidth: true,
  },
  axes: {
    path: "/axes",
    title: "Axis Setup",
    icon: "icon fi fi-sr-arrows-repeat",
    component: Axes,
    fullWidth: true,
  },
  autoProfiles: {
    path: "/autoprofiles",
    title: "Auto Profiles",
    icon: "icon fi fi-sr-sparkles",
    component: AutoProfiles,
    fullWidth: true,
  },
  settings: {
    path: "/settings",
    title: "App Settings",
    icon: "icon fi fi-sr-settings",
    component: Settings,
    fullWidth: true,
  },
} as const;

export type RouteKey = keyof typeof ROUTES;
