// Pixora projects demo data — a project groups one client's sessions,
// galleries and invoices around a single job, with a task checklist.

import type { ClientType } from "./demo-data";

export type ProjectStatus = "planning" | "shooting" | "editing" | "delivered" | "completed";

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  type: ClientType;
  status: ProjectStatus;
  startDate: string; // ISO date
  /** Delivery deadline. */
  dueDate: string; // ISO date
  /** Agreed value in USD. */
  value: number;
  sessionIds: string[];
  galleryIds: string[];
  tasks: ProjectTask[];
  notes: string;
  archived: boolean;
  createdAt: string; // ISO date
}

const tasks = (prefix: string, list: [string, boolean][]): ProjectTask[] =>
  list.map(([title, done], i) => ({ id: `${prefix}-t${i + 1}`, title, done }));

export function seedProjects(): Project[] {
  return [
    {
      id: "pr1",
      name: "Sarah & James Wedding",
      clientId: "c1",
      type: "wedding",
      status: "delivered",
      startDate: "2024-10-01",
      dueDate: "2025-05-15",
      value: 4800,
      sessionIds: ["s8", "s10", "s1"],
      galleryIds: ["sarah-james-wedding"],
      tasks: tasks("pr1", [
        ["Contract signed", true],
        ["Deposit paid", true],
        ["Timeline questionnaire returned", true],
        ["Wedding day coverage", true],
        ["Sneak peeks sent", true],
        ["Full gallery delivered", true],
        ["Album design approved", false],
        ["Album printed & shipped", false],
      ]),
      notes: "Album: 30-page lay-flat in linen. Waiting on cover colour choice.",
      archived: false,
      createdAt: "2024-10-01",
    },
    {
      id: "pr2",
      name: "Amber & Oak Product Launch",
      clientId: "c4",
      type: "commercial",
      status: "editing",
      startDate: "2025-03-28",
      dueDate: "2025-04-18",
      value: 1200,
      sessionIds: ["s24", "s11", "s15", "s4", "s19"],
      galleryIds: ["product-shoot"],
      tasks: tasks("pr2", [
        ["Shot list agreed", true],
        ["Props & backdrops sourced", true],
        ["Studio product shoot", true],
        ["Select hero images", true],
        ["Retouch 14 finals", false],
        ["Deliver web-ready exports", false],
      ]),
      notes: "Hero images for the homepage need a warm, amber grade.",
      archived: false,
      createdAt: "2025-03-28",
    },
    {
      id: "pr3",
      name: "Mokoena Family — Autumn 2025",
      clientId: "c6",
      type: "family",
      status: "delivered",
      startDate: "2025-03-20",
      dueDate: "2025-04-30",
      value: 650,
      sessionIds: ["s12", "s18"],
      galleryIds: ["family-portraits"],
      tasks: tasks("pr3", [
        ["Session booked", true],
        ["Wardrobe guide sent", true],
        ["Family session", true],
        ["Gallery delivered", true],
        ["Print order placed", false],
      ]),
      notes: "",
      archived: false,
      createdAt: "2025-03-20",
    },
    {
      id: "pr4",
      name: "Carter Travel — Q2 Campaign",
      clientId: "c2",
      type: "commercial",
      status: "shooting",
      startDate: "2025-04-02",
      dueDate: "2025-05-16",
      value: 900,
      sessionIds: ["s3", "s16", "s6"],
      galleryIds: ["travel-collection"],
      tasks: tasks("pr4", [
        ["Deposit invoiced", true],
        ["Creative brief", true],
        ["Coastal road shoot", false],
        ["Edit & colour grade", false],
        ["Deliver campaign selects", false],
      ]),
      notes: "Retainer: two travel shoots per quarter.",
      archived: false,
      createdAt: "2025-04-02",
    },
    {
      id: "pr5",
      name: "Liam O'Connor Wedding",
      clientId: "c10",
      type: "wedding",
      status: "planning",
      startDate: "2025-03-03",
      dueDate: "2025-11-15",
      value: 3000,
      sessionIds: ["s14", "s17"],
      galleryIds: [],
      tasks: tasks("pr5", [
        ["Contract signed", true],
        ["Deposit paid", true],
        ["Engagement session", false],
        ["Timeline questionnaire", false],
        ["Wedding day coverage", false],
        ["Gallery delivered", false],
      ]),
      notes: "Small wedding, ~40 guests. Family overseas needs a shareable gallery.",
      archived: false,
      createdAt: "2025-03-03",
    },
    {
      id: "pr6",
      name: "Khumalo Events — 2025 Retainer",
      clientId: "c9",
      type: "event",
      status: "shooting",
      startDate: "2025-01-20",
      dueDate: "2025-12-15",
      value: 6000,
      sessionIds: ["s23", "s9", "s13"],
      galleryIds: [],
      tasks: tasks("pr6", [
        ["Retainer agreement", true],
        ["Gala dinner", true],
        ["Corporate awards evening", false],
        ["May conference", false],
      ]),
      notes: "Same-day highlights (10–15 images) after every event.",
      archived: false,
      createdAt: "2025-01-20",
    },
    {
      id: "pr7",
      name: "Wilson Family Session",
      clientId: "c3",
      type: "family",
      status: "shooting",
      startDate: "2025-04-10",
      dueDate: "2025-05-09",
      value: 350,
      sessionIds: ["s2"],
      galleryIds: [],
      tasks: tasks("pr7", [
        ["Session booked", true],
        ["Prep guide sent", true],
        ["Family session", false],
        ["Gallery delivered", false],
      ]),
      notes: "",
      archived: false,
      createdAt: "2025-04-10",
    },
    {
      id: "pr8",
      name: "Johnson Fitness Brand Refresh",
      clientId: "c11",
      type: "commercial",
      status: "planning",
      startDate: "2025-04-15",
      dueDate: "2025-05-30",
      value: 2100,
      sessionIds: ["s21"],
      galleryIds: [],
      tasks: tasks("pr8", [
        ["Proposal accepted", false],
        ["Shot list", false],
        ["Brand shoot", false],
        ["Deliver images", false],
      ]),
      notes: "",
      archived: false,
      createdAt: "2025-04-15",
    },
    {
      id: "pr9",
      name: "Dlamini Architects Portfolio",
      clientId: "c7",
      type: "commercial",
      status: "completed",
      startDate: "2024-10-14",
      dueDate: "2024-12-02",
      value: 3600,
      sessionIds: [],
      galleryIds: [],
      tasks: tasks("pr9", [
        ["Site visits", true],
        ["Exterior shoot", true],
        ["Interior shoot", true],
        ["Deliver portfolio", true],
      ]),
      notes: "Delivered 48 images for the new website.",
      archived: false,
      createdAt: "2024-10-14",
    },
  ];
}
