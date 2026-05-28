import { useEffect, type ReactNode } from "react";
import { useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, App } from "antd";
import ChatWidget from "./ChatWidget";
import CreateTicketModal from "./CreateTicketModal";
import { BubbleBackground, useTheme, useFont, useAuth, api } from "@takypok/shared";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const ROUTE_LABELS: Record<string, string> = {
  "/": "// OVERVIEW",
  "/dashboard": "// DASHBOARD",
  "/settings": "// SETTINGS",
};


type ServiceHealth = {
  service: string;
  status: string;
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [systemStatus, setSystemStatus] = useState("CHECKING");
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isCustomFont, toggleFont } = useFont();

  useEffect(() => {
    const update = () =>
      setClock(new Date().toTimeString().slice(0, 8) + " UTC");
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchHealth = async () => {
      try {
        const { data } = await api.get("/api/health?monitors=auth-service,media-service,chat-service,workflow-service");
        const overall = String(data?.overall ?? "UNKNOWN").toUpperCase();
        const serviceList = Array.isArray(data?.services)
          ? (data.services as ServiceHealth[]).map((s) => ({
              service: String(s.service ?? "unknown"),
              status: String(s.status ?? "UNKNOWN").toUpperCase(),
            }))
          : [];
        if (!active) return;
        setSystemStatus(overall);
        setServices(serviceList);
      } catch {
        if (!active) return;
        setSystemStatus("DOWN");
        setServices([]);
      }
    };

    fetchHealth();
    const timer = setInterval(fetchHealth, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const systemStatusLabel =
    systemStatus === "UP" ? "Nominal" : systemStatus === "CHECKING" ? "Checking" : systemStatus;

  const formatServiceName = (name: string) => {
    if (name.endsWith("-service")) return name.replace("-service", "");
    return name;
  };

  const visibleServices = services.slice(0, 4);

  const serviceStatusText =
    services.length === 0
      ? "No Data"
      : services.every((s) => s.status === "UP")
      ? "All Up"
      : `${services.filter((s) => s.status !== "UP").length} DOWN`;

  const isServiceListCollapsed = services.length > 4;

  const serviceListHint = isServiceListCollapsed ? `+${services.length - 4} more` : "";

  const displayName =
    (user?.preferred_username as string) ??
    (user?.name as string) ??
    (user?.sub as string) ??
    "User";

  const displayRole = (() => {
    const roles = user?.roles;
    if (Array.isArray(roles) && roles.length > 0) return String(roles[0]).toUpperCase();
    return null;
  })();

  const routeLabel =
    ROUTE_LABELS[location.pathname] ??
    (location.pathname.startsWith("/dashboard/") ? "// TICKET" : "// TERMINAL");

  const siderMenuItems = [
    { key: "/",          icon: <HomeOutlined />,      label: "Home" },
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/settings",  icon: <SettingOutlined />,   label: "Settings" },
  ];

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <App>
      <BubbleBackground />

      <Layout className="h-screen">
        {/* ── Sidebar ───────────────────────────────────── */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme={isDark ? "dark" : "light"}
          className="neon-sider-border overflow-hidden flex flex-col"
        >
          {/* Brand */}
          <div className="flex h-16 flex-col items-center justify-center border-b border-[var(--border-subtle)] px-3 flex-shrink-0">
            <span className="font-bebas text-2xl tracking-[0.2em] glitch-anim neon-text-yellow leading-none">
              {collapsed ? "T" : "TICKET"}
            </span>
            {!collapsed && (
              <span className="font-mono-tech text-[8px] tracking-[0.3em] text-[var(--text-muted)] uppercase mt-0.5">
                ▸ Secure Portal
              </span>
            )}
          </div>

          {/* Navigation */}
          <Menu
            theme={isDark ? "dark" : "light"}
            mode="inline"
            selectedKeys={[location.pathname]}
            items={siderMenuItems}
            onClick={({ key }) => navigate(key)}
            className="flex-1 border-none!"
          />

        </Sider>

        {/* ── Main area ─────────────────────────────────── */}
        <Layout className="flex flex-col overflow-hidden">


          {/* Header */}
          <Header className="neon-header-border flex items-center justify-between !px-4 !h-14 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)] !h-9 !w-9"
              />
              <span className="font-bebas text-lg tracking-[0.25em] text-[var(--text-muted)] hidden sm:block">
                {routeLabel}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateTicketOpen(true)}
                className="neon-btn font-bebas! tracking-widest!"
              >
                <span className="neon-btn-content">Create</span>
              </Button>
              <Button
                type="text"
                onClick={toggleFont}
                title={isCustomFont ? "Switch to Default Font" : "Switch to Custom Font"}
                className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)] !font-bold !text-sm !tracking-wider !h-9 !w-9"
              >
                Aa
              </Button>
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)] !h-9 !w-9"
              />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="flex cursor-pointer items-center gap-2.5 px-3 py-2 border border-[var(--border-subtle)] hover:border-[var(--neon-yellow)] hover:bg-[var(--border-subtle)] transition-all">
                  <div className="flex flex-col items-end">
                    <span className="font-mono-tech text-xs text-[var(--white)] leading-tight">
                      {displayName}
                    </span>
                    {displayRole && (
                      <span className="font-mono-tech text-[9px] text-[var(--text-muted)] leading-tight tracking-wider">
                        {displayRole}
                      </span>
                    )}
                  </div>
                  <Avatar
                    size="default"
                    icon={<UserOutlined />}
                    className="!bg-[var(--neon-yellow)] !text-black"
                  />
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Page content */}
          <Content className="flex-1 m-3 overflow-auto p-5 border border-[var(--border-subtle)]">
            {children}
          </Content>

          {/* Status bar */}
          <div className="h-7 bg-[var(--neon-pink)] flex items-center px-4 gap-6 flex-shrink-0">
            <span className="font-bebas text-[12px] text-black tracking-[0.15em] flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-black blink" />
              LIVE
            </span>
            <span className="font-bebas text-[12px] text-black tracking-[0.15em]">
              SYS: {systemStatusLabel}
            </span>
            <span className="font-bebas text-[12px] text-black tracking-[0.15em]">
              SVC: {serviceStatusText}
            </span>
            {visibleServices.map((service) => (
              <span key={service.service} className="font-bebas text-[12px] text-black tracking-[0.15em] hidden md:inline">
                {formatServiceName(service.service).toUpperCase()}: {service.status}
              </span>
            ))}
            {serviceListHint && (
              <span className="font-bebas text-[12px] text-black tracking-[0.15em] hidden md:inline">
                {serviceListHint}
              </span>
            )}
            <span className="font-bebas text-[12px] text-black tracking-[0.15em] ml-auto">
              {clock}
            </span>
          </div>
        </Layout>
      </Layout>
      <ChatWidget />
      <CreateTicketModal
        open={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        onSuccess={() => setCreateTicketOpen(false)}
      />
    </App>
  );
}
