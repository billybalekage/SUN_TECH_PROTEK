import {
  FolderKanban,
  FolderPlus,
  KeyRound,
  LayoutDashboard,
} from "lucide-react";
import { ROLES } from "./roles";

export const NAVIGATION = [
  {
    labelKey: "nav.sections.general",
    items: [
      {
        labelKey: "nav.dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: [ROLES.ELECTRICIEN],
      },
      {
        labelKey: "nav.projects",
        path: "/projects",
        icon: FolderKanban,
        roles: [ROLES.ELECTRICIEN],
      },
      {
        labelKey: "nav.newProject",
        path: "/projects/new",
        icon: FolderPlus,
        roles: [ROLES.ELECTRICIEN],
      },
    ],
  },
  {
    labelKey: "nav.sections.settings",
    items: [
      {
        labelKey: "nav.changePassword",
        path: "/password/change",
        icon: KeyRound,
        roles: [ROLES.ELECTRICIEN],
      },
    ],
  },
];

export const NAVIGATION_LABELS_FR = {
  "nav.sections.general": "Espace",
  "nav.sections.settings": "Compte",
  "nav.dashboard": "Dashboard",
  "nav.projects": "Projets",
  "nav.newProject": "Nouveau projet",
  "nav.changePassword": "Sécurité",
};
