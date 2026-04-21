import { useState, useEffect, type ReactNode } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, App, Badge } from "antd";
import ChatWidget from "./ChatWidget";
import BubbleBackground from "./BubbleBackground";
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
  ShoppingOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useCart } from "../context/CartContext";
import CartDrawer from "./shop/CartDrawer";
import { useTheme } from "../context/useTheme";
import { useFont } from "../context/useFont";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import api from "../api/axios";

const { Header, Sider, Content } = Layout;

const ROUTE_LABELS: Record<string, string> = {
  "/": "// OVERVIEW",
  "/dashboard": "// DASHBOARD",
  "/settings": "// SETTINGS",
  "/shop": "// SHOP",
};

const TICKER_TEXT =
  "WORKFLOW ENGINE ///  TICKET MANAGEMENT ///  SLA TRACKING ///  OAUTH2 SECURED ///  SYSTEM NOMINAL ///  ";

type ServiceHealth = {
  service: string;
  status: string;
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState("CHECKING");
  const [nodeStatus, setNodeStatus] = useState("Checking");
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isCustomFont, toggleFont } = useFont();
  const { totalItems } = useCart();
  const isShopRoute = location.pathname.startsWith("/shop");

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
        const { data } = await api.get("/api/health");
        const overall = String(data?.overall ?? "UNKNOWN").toUpperCase();
        const serviceList = Array.isArray(data?.services)
          ? (data.services as ServiceHealth[]).map((s) => ({
              service: String(s.service ?? "unknown"),
              status: String(s.status ?? "UNKNOWN").toUpperCase(),
            }))
          : [];
        if (!active) return;
        setSystemStatus(overall);
        setNodeStatus(overall === "UP" ? "Active" : "Degraded");
        setServices(serviceList);
      } catch {
        if (!active) return;
        setSystemStatus("DOWN");
        setNodeStatus("Down");
        setServices([]);
      }
    };

    fetchHealth();
    const timer = setInterval(fetchHealth, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const sysStatusColorClass =
    systemStatus === "UP"
      ? "neon-text-cyan"
      : systemStatus === "CHECKING"
      ? "text-[var(--text-muted)]"
      : "text-red-400";

  const nodeStatusColorClass =
    nodeStatus === "Active"
      ? "neon-text-yellow"
      : nodeStatus === "Checking"
      ? "text-[var(--text-muted)]"
      : "text-red-400";

  const systemStatusLabel =
    systemStatus === "UP" ? "Nominal" : systemStatus === "CHECKING" ? "Checking" : systemStatus;

  const getServiceColorClass = (status: string) => {
    if (status === "UP") return "neon-text-cyan";
    if (status === "DOWN") return "text-red-400";
    return "text-[var(--text-muted)]";
  };

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
      : `${services.filter((s) => s.status !== "UP").length} Down`;

  const serviceStatusColorClass =
    services.length === 0
      ? "text-[var(--text-muted)]"
      : services.every((s) => s.status === "UP")
      ? "neon-text-cyan"
      : "text-red-400";

  const isServiceListCollapsed = services.length > 4;

  const serviceListHint = isServiceListCollapsed ? `+${services.length - 4} more` : "";

  const displayName =
    (user?.preferred_username as string) ??
    (user?.name as string) ??
    (user?.sub as string) ??
    "User";

  const routeLabel =
    ROUTE_LABELS[location.pathname] ??
    (location.pathname.startsWith("/dashboard/") ? "// TICKET" : "// TERMINAL");

  const siderMenuItems = [
    { key: "/",          icon: <HomeOutlined />,      label: "Home" },
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/shop",      icon: <ShoppingOutlined />,  label: "Shop" },
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
      {/* Global overlay effects */}
      {/* <div className="corner-tl" /> */}
      <div className="corner-tr" />
      {/* <div className="corner-bl" /> */}
      <div className="corner-br" />

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
              {collapsed ? "T//" : "T//APP"}
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

          {/* Sidebar footer stats */}
          {!collapsed && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border-subtle)]">
              <div className="font-mono-tech text-[9px] tracking-[0.15em] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] uppercase">Node</span>
                  <span className={nodeStatusColorClass}>{nodeStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] uppercase">Sys</span>
                  <span className={sysStatusColorClass}>{systemStatusLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] uppercase">Svc</span>
                  <span className={serviceStatusColorClass}>{serviceStatusText}</span>
                </div>
                {visibleServices.map((service) => (
                  <div key={service.service} className="flex justify-between pl-2">
                    <span className="text-[var(--text-muted)] uppercase">{formatServiceName(service.service)}</span>
                    <span className={getServiceColorClass(service.status)}>{service.status}</span>
                  </div>
                ))}
                {serviceListHint && (
                  <div className="text-[var(--text-muted)] text-right">{serviceListHint}</div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] uppercase">Enc</span>
                  <span className="text-[var(--text-muted)]">AES-256</span>
                </div>
              </div>
            </div>
          )}
        </Sider>

        {/* ── Main area ─────────────────────────────────── */}
        <Layout className="flex flex-col overflow-hidden">

          {/* Ticker tape */}
          <div className="h-7 bg-[var(--neon-yellow)] overflow-hidden flex items-center flex-shrink-0">
            <div className="ticker-track flex whitespace-nowrap">
              <span className="font-bebas text-[13px] text-[var(--dark)] tracking-[0.2em] pr-20">
                {TICKER_TEXT}{TICKER_TEXT}
              </span>
              <span className="font-bebas text-[13px] text-[var(--dark)] tracking-[0.2em] pr-20">
                {TICKER_TEXT}{TICKER_TEXT}
              </span>
            </div>
          </div>

          {/* Header */}
          <Header className="neon-header-border flex items-center justify-between !px-4 !h-11 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)]"
              />
              <span className="font-bebas text-base tracking-[0.25em] text-[var(--text-muted)] hidden sm:block">
                {routeLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
            {isShopRoute && (
              <Badge count={totalItems} size="small">
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setCartOpen(true)}
                  className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)]"
                />
              </Badge>
            )}
            <Button
              type="text"
              onClick={toggleFont}
              title={isCustomFont ? "Switch to Default Font" : "Switch to Custom Font"}
              className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)] !font-bold !text-xs !tracking-wider"
            >
              Aa
            </Button>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)]"
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex cursor-pointer items-center gap-2 px-3 py-1 border border-[var(--border-subtle)] hover:border-[var(--neon-yellow)] hover:bg-[var(--border-subtle)] transition-all">
                <span className="font-mono-tech text-xs text-[var(--white)]">
                  {displayName}
                </span>
                <Avatar
                  size="small"
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
            <span className="font-bebas text-[12px] text-black tracking-[0.15em]">SYS: NOMINAL</span>
            <span className="font-bebas text-[12px] text-black tracking-[0.15em] hidden md:block">
              LOC: 127.0.0.1
            </span>
            <span className="font-bebas text-[12px] text-black tracking-[0.15em] ml-auto">
              {clock}
            </span>
          </div>
        </Layout>
      </Layout>
      <ChatWidget />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </App>
  );
}
