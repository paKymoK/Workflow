import { useEffect } from "react";
import { useState } from "react";
import { App, Layout, Menu, Badge, Button, Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import {
  HomeOutlined, DashboardOutlined, MessageOutlined, SettingOutlined,
  PlusOutlined, SunOutlined, MoonOutlined, BellOutlined, AppstoreOutlined, LogoutOutlined, DownOutlined,
  UserOutlined, CheckSquareOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import ChatWidget from "./ChatWidget";
import CreateTicketModal from "./CreateTicketModal";
import { useChatSocket } from "../hooks/useChatSocket";
import { useFcmSync } from "../hooks/useFcmSync";
import { useNotifications } from "../hooks/useNotifications";
import { BubbleBackground, useTheme, useAuth, useIsAdmin, api, unregisterDeviceToken } from "@takypok/shared";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { fetchTickets, fetchUserBySub } from "../api/ticketApi";

const { Sider, Header, Content } = Layout;

const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/dashboard": "Ticket Queue",
  "/messages": "Messages",
  "/settings": "Settings",
  "/leave-approvals": "My Team's Leave",
  "/assistant": "AI Assistant",
};

const NAV_ITEMS: { path: string; icon: React.ReactNode; label: string }[] = [
  { path: "/", icon: <HomeOutlined />, label: "Home" },
  { path: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { path: "/messages", icon: <MessageOutlined />, label: "Messages" },
  { path: "/leave-approvals", icon: <CheckSquareOutlined />, label: "My Team's Leave" },
  { path: "/settings", icon: <SettingOutlined />, label: "Settings" },
];

const menuItems: MenuProps["items"] = NAV_ITEMS.map((item) => ({
  key: item.path,
  icon: item.icon,
  label: item.label,
}));

type ServiceHealth = {
  service: string;
  status: string;
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [systemStatus, setSystemStatus] = useState("CHECKING");
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const { isDark, toggleTheme } = useTheme();

  useChatSocket();
  const fcmTokenRef = useFcmSync();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  // Real avatar — the JWT doesn't carry display data, so fetch it live from
  // employee-service, same as Settings.tsx does.
  const mySub = user?.sub as string | undefined;
  const { data: myProfile } = useQuery({
    queryKey: ["user", mySub],
    queryFn: () => fetchUserBySub(mySub!),
    enabled: !!mySub,
  });

  // Open ticket count for header badge
  const { data: countData } = useQuery({
    queryKey: ["tickets", "totalCount"],
    queryFn: () => fetchTickets({ page: 0, size: 1 }),
    staleTime: 60_000,
  });
  const openCount = countData?.totalElements ?? 0;

  useEffect(() => {
    const update = () => setClock(new Date().toTimeString().slice(0, 8) + " UTC");
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

  const pageTitle =
    ROUTE_TITLES[location.pathname] ??
    (location.pathname.startsWith("/dashboard/")
      ? "Ticket Detail"
      : location.pathname.startsWith("/settings/")
      ? "Settings"
      : "");

  const showOpenChip = openCount > 0 && (location.pathname === "/" || location.pathname === "/dashboard");

  const userMenuItems: MenuProps["items"] = [
    ...(isAdmin
      ? [
          {
            key: "admin",
            icon: <AppstoreOutlined />,
            label: "Admin Portal",
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: async () => {
        if (fcmTokenRef.current) {
          await unregisterDeviceToken(fcmTokenRef.current).catch(() => {});
        }
        logout();
      },
    },
  ];

  return (
    <App>
      <BubbleBackground />

      <Layout className="h-screen overflow-hidden">
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={252}
          className="border-r border-[var(--border)]"
          theme="light"
        >
          {/* Brand */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--border)] overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight whitespace-nowrap">
                <span className="font-bold text-sm text-[var(--text)]">TAKYPOK</span>
                <span className="text-[10px] text-[var(--text-faint)] tracking-wide">OPS CONSOLE</span>
              </div>
            )}
          </div>

          <Menu
            mode="inline"
            theme="light"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="!border-r-0"
          />
        </Sider>

        <Layout>
          <Header className="!h-14 !bg-[var(--surface)] !px-5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="text-xs leading-none text-[var(--text-faint)] whitespace-nowrap">
                <span>TAKYPOK</span>
                <span className="mx-1.5">/</span>
                <span className="text-[var(--text)] font-medium">{pageTitle}</span>
              </div>
              {showOpenChip && (
                <span className="text-[11.5px] leading-none font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-[9px] py-[3px] rounded-full">
                  {openCount} open
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateTicketOpen(true)}>
                Create
              </Button>

              <Button
                type="text"
                shape="circle"
                className="!border !border-[var(--border)] !text-[var(--text-dim)]"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              />

              <Dropdown
                open={notifOpen}
                onOpenChange={(next) => {
                  setNotifOpen(next);
                  if (next) markAllRead();
                }}
                trigger={["click"]}
                placement="bottomRight"
                popupRender={() => (
                  <div className="w-80 max-h-96 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text)]">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-[11px] font-medium text-[var(--text-faint)] hover:text-[var(--accent)] cursor-pointer border-none bg-transparent"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-3 py-8 text-center text-[12px] text-[var(--text-faint)]">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-2.5 border-b border-[var(--border)] last:border-none">
                          <div className="text-[12.5px] font-semibold text-[var(--text)]">{n.title}</div>
                          {n.body && (
                            <div className="text-[12px] text-[var(--text-dim)] mt-0.5">{n.body}</div>
                          )}
                          <div className="text-[10px] text-[var(--text-faint)] mt-1">
                            {new Date(n.receivedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              >
                <Badge count={unreadCount} size="small">
                  <Button
                    type="text"
                    shape="circle"
                    className="!border !border-[var(--border)] !text-[var(--text-dim)]"
                    icon={<BellOutlined />}
                    title="Notifications"
                  />
                </Badge>
              </Dropdown>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="flex cursor-pointer items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--hover)] transition-colors">
                  <Avatar
                    size={28}
                    src={myProfile?.avatar ?? undefined}
                    icon={!myProfile?.avatar ? <UserOutlined /> : undefined}
                    className="!bg-[var(--accent)]"
                  />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold text-[var(--text)]">{displayName}</span>
                    {displayRole && (
                      <span className="text-[9.5px] font-semibold text-[var(--text-faint)] tracking-[.03em]">
                        {displayRole}
                      </span>
                    )}
                  </div>
                  <DownOutlined className="text-[10px] text-[var(--text-faint)]" />
                </div>
              </Dropdown>
            </div>
          </Header>

          <Content className="p-5 overflow-y-auto bg-[var(--bg)]">
            <Outlet />
          </Content>

          {/* Status bar */}
          <div className="h-7 flex-shrink-0 bg-[var(--accent)] flex items-center px-[18px] gap-5 text-white text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white blink" />
              LIVE
            </span>
            <span>SYS: {systemStatusLabel}</span>
            <span>SVC: {serviceStatusText}</span>
            {visibleServices.map((service) => (
              <span key={service.service} className="hidden md:inline">
                {formatServiceName(service.service).toUpperCase()}: {service.status}
              </span>
            ))}
            {serviceListHint && <span className="hidden md:inline">{serviceListHint}</span>}
            <span className="ml-auto tabular-nums">{clock}</span>
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
