import { useState, useEffect, type ReactNode } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, App } from "antd";
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
} from "@ant-design/icons";
import { useTheme } from "../context/useTheme";
import { useFont } from "../context/useFont";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const { Header, Sider, Content } = Layout;

const ROUTE_LABELS: Record<string, string> = {
  "/": "// OVERVIEW",
  "/dashboard": "// DASHBOARD",
  "/settings": "// SETTINGS",
};

const TICKER_TEXT =
  "WORKFLOW ENGINE ///  TICKET MANAGEMENT ///  SLA TRACKING ///  OAUTH2 SECURED ///  SYSTEM NOMINAL ///  ";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState("");
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
      <div className="scanlines-overlay" />
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
                  <span className="neon-text-yellow">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] uppercase">Sys</span>
                  <span className="neon-text-cyan">Nominal</span>
                </div>
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
    </App>
  );
}
