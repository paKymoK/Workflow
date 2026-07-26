export const B_BLUE = "#1565C0";
export const B_CYAN = "#29ABE2";

export const attendanceTrend = [
  { month: "Jan", rate: 92.1 }, { month: "Feb", rate: 90.8 },
  { month: "Mar", rate: 93.5 }, { month: "Apr", rate: 95.2 },
  { month: "May", rate: 94.1 }, { month: "Jun", rate: 94.8 },
];

export const productionOutput = [
  { line: "Line A", output: 12400, target: 13000 },
  { line: "Line B", output: 11200, target: 11500 },
  { line: "Line C", output: 9800, target: 10000 },
  { line: "Line D", output: 13100, target: 12800 },
  { line: "Line E", output: 10500, target: 11000 },
];

export const leaveDist = [
  { name: "Annual", value: 40, color: B_BLUE },
  { name: "Medical", value: 25, color: B_CYAN },
  { name: "Emergency", value: 15, color: "#F59E0B" },
  { name: "Maternity", value: 12, color: "#8B5CF6" },
  { name: "Others", value: 8, color: "#94A3B8" },
];

export const engagementData = [
  { name: "Announcements", rate: 74 },
  { name: "Surveys", rate: 61 },
  { name: "Training", rate: 88 },
  { name: "Policy Reads", rate: 53 },
];

export const headcountByDept = [
  { dept: "Line A", count: 142 },
  { dept: "Line B", count: 128 },
  { dept: "Line C", count: 115 },
  { dept: "Line D", count: 98 },
  { dept: "Logistics", count: 67 },
  { dept: "QC", count: 45 },
  { dept: "Admin", count: 25 },
  { dept: "Finance", count: 22 },
  { dept: "HR", count: 18 },
  { dept: "IT", count: 12 },
];

export const headcountTrend = [
  { month: "Aug '24", count: 812 }, { month: "Sep", count: 819 },
  { month: "Oct", count: 825 },    { month: "Nov", count: 830 },
  { month: "Dec", count: 826 },    { month: "Jan '25", count: 818 },
  { month: "Feb", count: 821 },    { month: "Mar", count: 828 },
  { month: "Apr", count: 834 },    { month: "May", count: 839 },
  { month: "Jun", count: 843 },    { month: "Jul", count: 847 },
];

export const defectRate = [
  { line: "Line A", rate: 1.8 },
  { line: "Line B", rate: 2.4 },
  { line: "Line C", rate: 3.1 },
  { line: "Line D", rate: 1.2 },
  { line: "Line E", rate: 2.7 },
];

export const dailyOutputTrend = [
  { day: "Jun 10", actual: 4180, target: 4500 }, { day: "Jun 12", actual: 4320, target: 4500 },
  { day: "Jun 14", actual: 4250, target: 4500 }, { day: "Jun 16", actual: 4410, target: 4500 },
  { day: "Jun 18", actual: 4280, target: 4500 }, { day: "Jun 20", actual: 4360, target: 4500 },
  { day: "Jun 22", actual: 4490, target: 4500 }, { day: "Jun 24", actual: 4420, target: 4500 },
  { day: "Jun 26", actual: 4380, target: 4500 }, { day: "Jun 28", actual: 4460, target: 4500 },
  { day: "Jun 30", actual: 4510, target: 4500 }, { day: "Jul 2",  actual: 4390, target: 4500 },
  { day: "Jul 4",  actual: 4450, target: 4500 }, { day: "Jul 6",  actual: 4480, target: 4500 },
  { day: "Jul 8",  actual: 4520, target: 4500 },
];

export const leaveTrend = [
  { month: "Feb", annual: 28, medical: 18, emergency: 8,  maternity: 5,  others: 4 },
  { month: "Mar", annual: 32, medical: 22, emergency: 10, maternity: 8,  others: 6 },
  { month: "Apr", annual: 35, medical: 20, emergency: 12, maternity: 10, others: 5 },
  { month: "May", annual: 42, medical: 25, emergency: 9,  maternity: 12, others: 7 },
  { month: "Jun", annual: 38, medical: 28, emergency: 15, maternity: 12, others: 8 },
  { month: "Jul", annual: 15, medical: 12, emergency: 7,  maternity: 5,  others: 3 },
];

export const absenteeRate = [
  { dept: "Line C",    rate: 5.8 },
  { dept: "Line B",    rate: 4.1 },
  { dept: "Logistics", rate: 3.5 },
  { dept: "Line A",    rate: 3.2 },
  { dept: "Line D",    rate: 2.9 },
  { dept: "QC",        rate: 2.1 },
  { dept: "HQ",        rate: 1.8 },
];

export const surveyByDept = [
  { dept: "HQ",      rate: 92 },
  { dept: "QC",      rate: 84 },
  { dept: "Line C",  rate: 71 },
  { dept: "Logistics", rate: 67 },
  { dept: "Line A",  rate: 62 },
  { dept: "Line B",  rate: 58 },
  { dept: "Line D",  rate: 55 },
];

export const ticketByCategory = [
  { name: "Hardware", value: 32, color: B_BLUE },
  { name: "Software", value: 28, color: B_CYAN },
  { name: "Network",  value: 18, color: "#8B5CF6" },
  { name: "Access",   value: 15, color: "#F59E0B" },
  { name: "Others",   value: 7,  color: "#94A3B8" },
];

export const ticketResolutionTrend = [
  { month: "Feb", hours: 28.4 }, { month: "Mar", hours: 24.2 },
  { month: "Apr", hours: 22.8 }, { month: "May", hours: 20.1 },
  { month: "Jun", hours: 19.4 }, { month: "Jul", hours: 18.5 },
];

export const leaveRequestsInit = [
  { id: 1, employee: "Nguyen Thi Lan", dept: "HR", type: "Annual", from: "Jul 10", to: "Jul 14", days: 5, submitted: "Jul 1", status: "pending" },
  { id: 2, employee: "Tran Van Minh", dept: "IT", type: "Medical", from: "Jul 8", to: "Jul 9", days: 2, submitted: "Jul 7", status: "pending" },
  { id: 3, employee: "Vo Thi Kim Anh", dept: "Line A", type: "Emergency", from: "Jul 6", to: "Jul 6", days: 1, submitted: "Jul 6", status: "approved" },
  { id: 4, employee: "Le Van Duc", dept: "QC", type: "Annual", from: "Jul 15", to: "Jul 19", days: 5, submitted: "Jul 2", status: "pending" },
  { id: 5, employee: "Pham Thi Huong", dept: "Finance", type: "Maternity", from: "Jul 20", to: "Oct 20", days: 90, submitted: "Jun 28", status: "approved" },
  { id: 6, employee: "Do Van Thanh", dept: "Logistics", type: "Annual", from: "Jul 7", to: "Jul 8", days: 2, submitted: "Jul 3", status: "rejected" },
  { id: 7, employee: "Bui Thi Thu", dept: "Admin", type: "Medical", from: "Jul 11", to: "Jul 12", days: 2, submitted: "Jul 9", status: "pending" },
  { id: 8, employee: "Hoang Van Nam", dept: "Line B", type: "Annual", from: "Jul 21", to: "Jul 25", days: 5, submitted: "Jul 5", status: "pending" },
  { id: 9, employee: "Dang Thi Mai", dept: "Line C", type: "Emergency", from: "Jul 9", to: "Jul 9", days: 1, submitted: "Jul 9", status: "approved" },
  { id: 10, employee: "Nguyen Van Long", dept: "Warehouse", type: "Annual", from: "Jul 28", to: "Aug 1", days: 5, submitted: "Jul 6", status: "pending" },
];

export const overtimeInit = [
  { id: 1, employee: "Vo Thi Kim Anh", dept: "Line A", date: "Jul 5", hours: 3, reason: "Urgent shipment completion", submitted: "Jul 4", status: "approved" },
  { id: 2, employee: "Le Van Duc", dept: "QC", date: "Jul 6", hours: 2, reason: "Quality inspection backlog", submitted: "Jul 5", status: "pending" },
  { id: 3, employee: "Hoang Van Nam", dept: "Line B", date: "Jul 7", hours: 4, reason: "Export order deadline", submitted: "Jul 6", status: "pending" },
  { id: 4, employee: "Tran Thi Bich", dept: "Line D", date: "Jul 5", hours: 3, reason: "Machine breakdown recovery", submitted: "Jul 4", status: "approved" },
  { id: 5, employee: "Nguyen Van Long", dept: "Warehouse", date: "Jul 8", hours: 2, reason: "Container loading delay", submitted: "Jul 7", status: "pending" },
  { id: 6, employee: "Dao Van Khanh", dept: "Line A", date: "Jul 9", hours: 3, reason: "Urgent buyer revision", submitted: "Jul 8", status: "rejected" },
  { id: 7, employee: "Phan Thi Loan", dept: "Line C", date: "Jul 10", hours: 2, reason: "Sample prep for FOB", submitted: "Jul 9", status: "pending" },
  { id: 8, employee: "Ly Van Hung", dept: "Line B", date: "Jul 10", hours: 4, reason: "Monthly quota catch-up", submitted: "Jul 9", status: "pending" },
];

export const ticketsInit = [
  { id: "TK-2061", employee: "Nguyen Thi Lan", category: "Software", priority: "medium", status: "open", assignedTo: "Tran Van Minh", created: "Jul 8", desc: "Excel not opening files from shared drive — error code 0x800CCC0F." },
  { id: "TK-2060", employee: "Le Van Duc", category: "Hardware", priority: "high", status: "in-progress", assignedTo: "IT Team", created: "Jul 7", desc: "Barcode scanner on Production Line C not reading QR codes after firmware update." },
  { id: "TK-2059", employee: "Pham Van Duc", category: "Access", priority: "high", status: "open", assignedTo: "Unassigned", created: "Jul 7", desc: "Unable to access ERP after password reset. Account appears locked." },
  { id: "TK-2058", employee: "Bui Thi Thu", category: "Network", priority: "low", status: "open", assignedTo: "Unassigned", created: "Jul 6", desc: "WiFi in admin block (Room 204) drops every 2 hours." },
  { id: "TK-2057", employee: "Do Van Thanh", category: "Hardware", priority: "medium", status: "in-progress", assignedTo: "Tran Van Minh", created: "Jul 5", desc: "Printer in Logistics room jamming on every third print job." },
  { id: "TK-2056", employee: "Hoang Van Nam", category: "Software", priority: "low", status: "closed", assignedTo: "Tran Van Minh", created: "Jul 3", desc: "Attendance app crashing on login — resolved after cache clear." },
  { id: "TK-2055", employee: "Dang Thi Mai", category: "Access", priority: "urgent", status: "open", assignedTo: "Unassigned", created: "Jul 9", desc: "New employee requires ERP + Attendance system access setup." },
  { id: "TK-2054", employee: "Vo Thi Kim Anh", category: "Hardware", priority: "medium", status: "closed", assignedTo: "IT Team", created: "Jul 1", desc: "Laptop screen flickering — replaced display cable." },
];

export const employees = [
  { id: 1, name: "Nguyen Thi Lan", dept: "Human Resources", position: "HR Manager", role: "Manager", status: "active", line: "HQ" },
  { id: 2, name: "Tran Van Minh", dept: "Information Technology", position: "IT Lead", role: "Admin", status: "active", line: "HQ" },
  { id: 3, name: "Le Thi Hoa", dept: "Production Line A", position: "Line Supervisor", role: "Manager", status: "active", line: "Factory 1" },
  { id: 4, name: "Pham Van Duc", dept: "Quality Control", position: "QC Supervisor", role: "Manager", status: "active", line: "Factory 1" },
  { id: 5, name: "Hoang Thi Mai", dept: "Finance", position: "Finance Manager", role: "Manager", status: "active", line: "HQ" },
  { id: 6, name: "Do Van Long", dept: "Logistics", position: "Logistics Coordinator", role: "Employee", status: "active", line: "Warehouse" },
  { id: 7, name: "Bui Thi Thu", dept: "Administration", position: "Admin Officer", role: "Employee", status: "active", line: "HQ" },
  { id: 8, name: "Vo Van Nam", dept: "Production Line B", position: "Sewing Operator", role: "Employee", status: "active", line: "Factory 1" },
  { id: 9, name: "Dang Thi Loan", dept: "Production Line C", position: "Cutting Operator", role: "Employee", status: "active", line: "Factory 2" },
  { id: 10, name: "Dao Van Khanh", dept: "Production Line A", position: "Iron Operator", role: "Employee", status: "active", line: "Factory 1" },
  { id: 11, name: "Ly Van Hung", dept: "Production Line D", position: "Packing Supervisor", role: "Manager", status: "active", line: "Factory 2" },
  { id: 12, name: "Phan Thi Bich", dept: "Human Resources", position: "HR Officer", role: "Employee", status: "inactive", line: "HQ" },
  { id: 13, name: "Nguyen Van Quan", dept: "Finance", position: "Accountant", role: "Employee", status: "active", line: "HQ" },
  { id: 14, name: "Tran Thi Kim Chi", dept: "Quality Control", position: "QC Inspector", role: "Employee", status: "active", line: "Factory 2" },
  { id: 15, name: "Mai Van Phuc", dept: "Administration", position: "IT Admin Officer", role: "Admin", status: "active", line: "HQ" },
];

export const surveysData = [
  { id: 1, title: "Q2 Employee Satisfaction Survey", created: "Jun 15", closes: "Jun 30", responses: 312, total: 847, status: "closed" },
  { id: 2, title: "Canteen Food Quality Feedback", created: "Jul 1", closes: "Jul 15", responses: 178, total: 847, status: "active" },
  { id: 3, title: "New Uniform Feedback", created: "Jun 28", closes: "Jul 10", responses: 89, total: 847, status: "active" },
  { id: 4, title: "Remote Work Policy Assessment", created: "Jul 5", closes: "Jul 20", responses: 41, total: 420, status: "active" },
  { id: 5, title: "H1 2025 Engagement Pulse Check", created: "May 10", closes: "May 25", responses: 503, total: 847, status: "closed" },
  { id: 6, title: "Safety Training Effectiveness Review", created: "Jul 8", closes: "Jul 25", responses: 12, total: 847, status: "draft" },
];

export const trainingData = [
  { id: 1, title: "New Employee Onboarding Guide", type: "Onboarding", format: "PDF", duration: "45 min", uploaded: "Jan 10, 2025", status: "active" },
  { id: 2, title: "Machine Safety Operation — Line A", type: "Safety", format: "Video", duration: "32 min", uploaded: "Mar 5, 2025", status: "active" },
  { id: 3, title: "Fire Drill & Emergency Procedures", type: "Safety", format: "PDF + Video", duration: "20 min", uploaded: "Feb 15, 2025", status: "active" },
  { id: 4, title: "Quality Control Inspection Techniques", type: "Skills", format: "Video", duration: "60 min", uploaded: "Apr 1, 2025", status: "active" },
  { id: 5, title: "Customer Communication for Buyer Visits", type: "Skills", format: "PDF", duration: "25 min", uploaded: "May 20, 2025", status: "active" },
  { id: 6, title: "Ergonomics & Posture at Sewing Workstations", type: "Safety", format: "Video", duration: "18 min", uploaded: "Jun 10, 2025", status: "active" },
];

export const departments = [
  { id: 1, name: "Production Line A", head: "Le Thi Hoa", count: 142, factory: "Factory 1" },
  { id: 2, name: "Production Line B", head: "Vo Van Nam", count: 128, factory: "Factory 1" },
  { id: 3, name: "Production Line C", head: "Pham Thi Bich", count: 115, factory: "Factory 2" },
  { id: 4, name: "Production Line D", head: "Ly Van Hung", count: 98, factory: "Factory 2" },
  { id: 5, name: "Quality Control", head: "Pham Van Duc", count: 45, factory: "Both" },
  { id: 6, name: "Human Resources", head: "Nguyen Thi Lan", count: 18, factory: "HQ" },
  { id: 7, name: "Information Technology", head: "Tran Van Minh", count: 12, factory: "HQ" },
  { id: 8, name: "Finance", head: "Hoang Thi Mai", count: 22, factory: "HQ" },
  { id: 9, name: "Logistics & Warehouse", head: "Do Van Long", count: 67, factory: "Warehouse" },
  { id: 10, name: "Administration", head: "Bui Thi Thu", count: 25, factory: "HQ" },
];

export const canteenWeek: Record<string, Record<string, string>> = {
  Monday: { breakfast: "Pho Bo, Banh Mi Thit", lunch: "Com Ga Xoi Mo, Rau Luoc, Canh Chua Ca", dinner: "Bun Bo Hue, Cha Gio" },
  Tuesday: { breakfast: "Banh Cuon, Che Ba Mau", lunch: "Com Suon Bi Cha, Rau Muong, Canh Bi Do", dinner: "Mi Xao Bo, Goi Cuon Tom" },
  Wednesday: { breakfast: "Xoi Ga, Banh Mi Pate", lunch: "Com Vit Quay, Rau Cai, Canh Kho Qua", dinner: "Pho Ga, Cha Gio" },
  Thursday: { breakfast: "Chao Ga, Banh Mi Trung", lunch: "Com Bo Luc Lac, Rau Luoc, Canh Bau Tom", dinner: "Bun Mam, Cha Gio" },
  Friday: { breakfast: "Banh Uot, Che Ba Mau", lunch: "Com Heo Quay, Rau Dua, Canh Chua Tom", dinner: "Mi Quang, Cha Gio" },
};

export const shiftRoster = [
  { shift: "Morning (06:00–14:00)", lines: ["Line A", "Line B"], supervisors: ["Le Thi Hoa", "Tran Thi Bich"], count: 270, factory: "Factory 1" },
  { shift: "Afternoon (14:00–22:00)", lines: ["Line C", "Line D"], supervisors: ["Pham Thi Bich", "Ly Van Hung"], count: 213, factory: "Factory 2" },
  { shift: "Night (22:00–06:00)", lines: ["Line B"], supervisors: ["Dao Van Khanh"], count: 128, factory: "Factory 1" },
  { shift: "General (08:00–17:00)", lines: ["HQ", "QC", "Logistics"], supervisors: ["Nguyen Thi Lan", "Pham Van Duc"], count: 236, factory: "All" },
];

export const timesheetInit = [
  { id: 1, employee: "Vo Thi Kim Anh",  dept: "Line A", date: "Jul 9",  clockIn: "05:58", clockOut: "14:05", total: 8.1,  ot: 0.1,  status: "normal" },
  { id: 2, employee: "Le Van Duc",       dept: "QC",     date: "Jul 9",  clockIn: "08:12", clockOut: "17:02", total: 8.8,  ot: 0.8,  status: "normal" },
  { id: 3, employee: "Hoang Van Nam",    dept: "Line B", date: "Jul 9",  clockIn: "14:03", clockOut: "22:18", total: 8.2,  ot: 0.2,  status: "normal" },
  { id: 4, employee: "Tran Thi Bich",    dept: "Line D", date: "Jul 9",  clockIn: "06:22", clockOut: "14:00", total: 7.6,  ot: 0,    status: "late" },
  { id: 5, employee: "Nguyen Van Long",  dept: "Logistics", date: "Jul 9", clockIn: "08:00", clockOut: "17:00", total: 8.0, ot: 0, status: "normal" },
  { id: 6, employee: "Dao Van Khanh",    dept: "Line A", date: "Jul 9",  clockIn: "—",     clockOut: "—",     total: 0,    ot: 0,    status: "absent" },
  { id: 7, employee: "Phan Thi Loan",    dept: "Line C", date: "Jul 9",  clockIn: "14:00", clockOut: "22:00", total: 8.0,  ot: 0,    status: "normal" },
  { id: 8, employee: "Ly Van Hung",      dept: "Line D", date: "Jul 9",  clockIn: "13:58", clockOut: "22:45", total: 8.8,  ot: 0.8,  status: "normal" },
  { id: 9, employee: "Bui Thi Thu",      dept: "Admin",  date: "Jul 9",  clockIn: "08:05", clockOut: "17:10", total: 9.1,  ot: 1.1,  status: "adjusted" },
  { id: 10, employee: "Do Van Thanh",    dept: "Logistics", date: "Jul 9", clockIn: "07:55", clockOut: "16:40", total: 8.8, ot: 0.8, status: "normal" },
  { id: 11, employee: "Nguyen Thi Lan",  dept: "HR",     date: "Jul 8",  clockIn: "08:01", clockOut: "17:02", total: 9.0,  ot: 1.0,  status: "normal" },
  { id: 12, employee: "Dang Thi Mai",    dept: "Line C", date: "Jul 8",  clockIn: "14:15", clockOut: "22:00", total: 7.8,  ot: 0,    status: "late" },
];

export const productionKpiInit = [
  { id: 1, line: "Line A", date: "Jul 9",  target: 4500, actual: 4520, defects: 82,  defectRate: 1.8, efficiency: 100.4 },
  { id: 2, line: "Line B", date: "Jul 9",  target: 4200, actual: 4050, defects: 97,  defectRate: 2.4, efficiency: 96.4  },
  { id: 3, line: "Line C", date: "Jul 9",  target: 3800, actual: 3620, defects: 112, defectRate: 3.1, efficiency: 95.3  },
  { id: 4, line: "Line D", date: "Jul 9",  target: 4000, actual: 4100, defects: 49,  defectRate: 1.2, efficiency: 102.5 },
  { id: 5, line: "Line E", date: "Jul 9",  target: 3500, actual: 3380, defects: 91,  defectRate: 2.7, efficiency: 96.6  },
  { id: 6, line: "Line A", date: "Jul 8",  target: 4500, actual: 4480, defects: 78,  defectRate: 1.7, efficiency: 99.6  },
  { id: 7, line: "Line B", date: "Jul 8",  target: 4200, actual: 4110, defects: 105, defectRate: 2.6, efficiency: 97.9  },
  { id: 8, line: "Line C", date: "Jul 8",  target: 3800, actual: 3590, defects: 119, defectRate: 3.3, efficiency: 94.5  },
  { id: 9, line: "Line D", date: "Jul 8",  target: 4000, actual: 4060, defects: 53,  defectRate: 1.3, efficiency: 101.5 },
  { id: 10, line: "Line E", date: "Jul 8", target: 3500, actual: 3420, defects: 88,  defectRate: 2.6, efficiency: 97.7  },
  { id: 11, line: "Line A", date: "Jul 7", target: 4500, actual: 4390, defects: 90,  defectRate: 2.0, efficiency: 97.6  },
  { id: 12, line: "Line B", date: "Jul 7", target: 4200, actual: 4200, defects: 101, defectRate: 2.4, efficiency: 100.0 },
];

export const kpiLineTrend30 = [
  { day: "Jun 10", actual: 4180 }, { day: "Jun 12", actual: 4320 }, { day: "Jun 14", actual: 4250 },
  { day: "Jun 16", actual: 4410 }, { day: "Jun 18", actual: 4280 }, { day: "Jun 20", actual: 4360 },
  { day: "Jun 22", actual: 4490 }, { day: "Jun 24", actual: 4420 }, { day: "Jun 26", actual: 4380 },
  { day: "Jun 28", actual: 4460 }, { day: "Jun 30", actual: 4510 }, { day: "Jul 2",  actual: 4390 },
  { day: "Jul 4",  actual: 4450 }, { day: "Jul 6",  actual: 4480 }, { day: "Jul 8",  actual: 4520 },
];
