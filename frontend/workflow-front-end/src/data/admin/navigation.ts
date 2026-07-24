export interface NavLeaf {
  key: string;
  label: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: "dashboard" | "content" | "approvals" | "surveys" | "helpdesk" | "users" | "operations" | "timesheet" | "production" | "settings";
  path?: string;
  children?: NavLeaf[];
}

export const NAV_GROUPS: NavGroup[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", path: "/admin" },
  {
    key: "content", label: "Content Management", icon: "content",
    children: [
      { key: "/admin/announcements", label: "Announcements / News" },
      { key: "/admin/documents", label: "Documents & Policies" },
      { key: "/admin/training", label: "Training Materials" },
    ],
  },
  {
    key: "approvals", label: "Approvals", icon: "approvals",
    children: [
      { key: "/admin/leave-approvals", label: "Leave Requests" },
      { key: "/admin/overtime-approvals", label: "Overtime Requests" },
    ],
  },
  { key: "surveys", label: "Survey Management", icon: "surveys", path: "/admin/surveys" },
  { key: "helpdesk", label: "IT Helpdesk", icon: "helpdesk", path: "/admin/helpdesk" },
  {
    key: "user-access", label: "User & Access", icon: "users",
    children: [
      { key: "/admin/employees", label: "Employee Directory" },
      { key: "/admin/org-structure", label: "Org Structure" },
    ],
  },
  {
    key: "operations", label: "Meal & Shift Ops", icon: "operations",
    children: [
      { key: "/admin/canteen", label: "Canteen Menu" },
      { key: "/admin/shift-roster", label: "Shift Roster" },
    ],
  },
  { key: "timesheet", label: "Timesheet & Attendance", icon: "timesheet", path: "/admin/timesheet" },
  { key: "production-kpi", label: "Production KPI Mgmt", icon: "production", path: "/admin/production-kpi" },
  { key: "settings", label: "Settings", icon: "settings", path: "/admin/settings" },
];

export const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/announcements": "Announcements / News",
  "/admin/documents": "Documents & Policies",
  "/admin/training": "Training Materials",
  "/admin/leave-approvals": "Leave Requests",
  "/admin/overtime-approvals": "Overtime Requests",
  "/admin/surveys": "Survey Management",
  "/admin/helpdesk": "IT Helpdesk",
  "/admin/employees": "Employee Directory",
  "/admin/org-structure": "Org Structure",
  "/admin/canteen": "Canteen Menu",
  "/admin/shift-roster": "Shift Roster",
  "/admin/timesheet": "Timesheet & Attendance",
  "/admin/production-kpi": "Production KPI Mgmt",
  "/admin/settings": "Settings",
};
