import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@takypok/shared";
import ProtectedRoute from "../components/ProtectedRoute";
import AppLayout from "../components/AppLayout";
import AdminGate from "../components/AdminGate";
import AdminLayout from "../components/admin/AdminLayout";
import Login from "../pages/Login";
import Portfolio from "../pages/Portfolio";
import PortfolioNttha from "../pages/PortfolioNttha";
import Home from "../pages/Home";
import Messages from "../pages/Messages";
import Assistant from "../pages/Assistant";
import Dashboard from "../pages/Dashboard";
import TicketDetail from "../pages/TicketDetail";
import Callback from "../pages/Callback";
import Settings from "../pages/Settings";
import WorkflowDetail from "../pages/WorkflowDetail";
import Diary from "../pages/Diary";
import LeaveApprovals from "../pages/LeaveApprovals";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminAnnouncements from "../pages/admin/Announcements";
import AdminDocuments from "../pages/admin/Documents";
import AdminTraining from "../pages/admin/Training";
import AdminOvertime from "../pages/admin/Overtime";
import AdminSurveys from "../pages/admin/Surveys";
import AdminHelpdesk from "../pages/admin/Helpdesk";
import AdminEmployees from "../pages/admin/Employees";
import AdminOrgStructure from "../pages/admin/OrgStructure";
import AdminCanteen from "../pages/admin/Canteen";
import AdminShiftRoster from "../pages/admin/ShiftRoster";
import AdminTimesheet from "../pages/admin/Timesheet";
import AdminProductionKpi from "../pages/admin/ProductionKpi";
import AdminSettings from "../pages/admin/Settings";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/nttha" element={<PortfolioNttha />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/callback" element={<Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:id" element={<TicketDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/workflow/:id" element={<WorkflowDetail />} />
              <Route path="/leave-approvals" element={<LeaveApprovals />} />
            </Route>

            <Route path="/admin" element={<AdminGate />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="documents" element={<AdminDocuments />} />
                <Route path="training" element={<AdminTraining />} />
                <Route path="overtime-approvals" element={<AdminOvertime />} />
                <Route path="surveys" element={<AdminSurveys />} />
                <Route path="helpdesk" element={<AdminHelpdesk />} />
                <Route path="employees" element={<AdminEmployees />} />
                <Route path="org-structure" element={<AdminOrgStructure />} />
                <Route path="canteen" element={<AdminCanteen />} />
                <Route path="shift-roster" element={<AdminShiftRoster />} />
                <Route path="timesheet" element={<AdminTimesheet />} />
                <Route path="production-kpi" element={<AdminProductionKpi />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
