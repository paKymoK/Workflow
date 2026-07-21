import { useEffect, type ReactNode } from "react";
import { useState } from "react";
import { App, Dropdown } from "antd";
import { useQuery } from "@tanstack/react-query";
import ChatWidget from "./ChatWidget";
import CreateTicketModal from "./CreateTicketModal";
import { useChatSocket } from "../hooks/useChatSocket";
import { useFcmSync } from "../hooks/useFcmSync";
import { useNotifications } from "../hooks/useNotifications";
import { BubbleBackground, useTheme, useAuth, api, unregisterDeviceToken } from "@takypok/shared";
import { Icon, type IconName } from "./ui/Icon";
import { SquareAvatar } from "./ui/SquareAvatar";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchTickets } from "../api/ticketApi";
import { dynamicStyle } from "../utils/dynamicStyle";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/dashboard": "Ticket Queue",
  "/messages": "Messages",
  "/settings": "Settings",
};

const NAV_ITEMS: { path: string; icon: IconName; label: string }[] = [
  { path: "/", icon: "home", label: "Home" },
  { path: "/dashboard", icon: "grid", label: "Dashboard" },
  { path: "/messages", icon: "message", label: "Messages" },
  { path: "/settings", icon: "gear", label: "Settings" },
];

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

  useChatSocket();
  const fcmTokenRef = useFcmSync();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

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

  const userMenuItems = [
    {
      key: "logout",
      icon: <Icon name="logout" size={14} />,
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

      <div className="h-screen w-full flex overflow-hidden bg-[var(--bg)] text-[var(--text)]">
        {/* ── Sidebar ───────────────────────────────────── */}
        <div
          className="flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
          style={dynamicStyle({ width: collapsed ? 64 : 212 })}
        >
          {/* Brand */}
          <div className="h-[60px] flex-shrink-0 flex items-center gap-2.5 px-4 border-b border-[var(--border)]">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-[var(--accent)] flex-shrink-0 flex items-center justify-center text-white font-bold text-[15px]">
              T
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight overflow-hidden whitespace-nowrap">
                <span className="font-bold text-[14.5px] text-[var(--text)]">TAKYPOK</span>
                <span className="text-[10.5px] text-[var(--text-faint)] tracking-[.02em]">Ops Console</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-2.5">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className="w-full flex items-center gap-[11px] px-[11px] py-[9px] mb-[3px] rounded-[9px] border-none cursor-pointer text-left text-[13.5px] font-medium transition-colors"
                  style={dynamicStyle({
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-dim)",
                  })}
                >
                  <Icon name={item.icon} size={18} stroke={1.8} className="flex-shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Collapse toggle — sign out lives in the user menu up in the header
             instead of here, so it can't be fat-fingered while navigating. */}
          <div className="flex-shrink-0 border-t border-[var(--border)] p-2">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="w-full flex items-center justify-center py-[9px] rounded-[9px] border-none bg-transparent text-[var(--text-dim)] cursor-pointer hover:bg-[var(--hover)]"
            >
              <Icon
                name="chevL"
                size={17}
                stroke={2}
                style={dynamicStyle({ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .18s" })}
              />
            </button>
          </div>
        </div>

        {/* ── Main ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 flex-shrink-0 flex items-center justify-between px-5 bg-[var(--surface)] border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[15px] font-semibold text-[var(--text)]">{pageTitle}</span>
              {showOpenChip && (
                <span className="text-[11.5px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-[9px] py-[3px] rounded-full">
                  {openCount} open
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setCreateTicketOpen(true)}
                className="flex items-center gap-[7px] px-[15px] py-2 rounded-[9px] border-none bg-[var(--accent)] text-white text-[13px] font-semibold cursor-pointer"
              >
                <Icon name="plus" size={14} stroke={2.2} />
                Create
              </button>
              <button
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-[34px] h-[34px] rounded-[9px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] flex items-center justify-center cursor-pointer"
              >
                <Icon name={isDark ? "sun" : "moon"} size={15} stroke={2} />
              </button>
              <Dropdown
                open={notifOpen}
                onOpenChange={(next) => {
                  setNotifOpen(next);
                  if (next) markAllRead();
                }}
                trigger={["click"]}
                placement="bottomRight"
                dropdownRender={() => (
                  <div className="w-80 max-h-96 overflow-y-auto rounded-[9px] border border-[var(--border)] bg-[var(--surface)] shadow-lg py-1.5">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
                      <span className="text-[13px] font-semibold text-[var(--text)]">Notifications</span>
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
                        <div key={n.id} className="px-3 py-2.5 border-b border-[var(--border)] last:border-none">
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
                <button
                  title="Notifications"
                  className="relative w-[34px] h-[34px] rounded-[9px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] flex items-center justify-center cursor-pointer"
                >
                  <Icon name="bell" size={15} stroke={2} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </Dropdown>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="flex cursor-pointer items-center gap-[9px] pl-1.5 pr-3 py-[5px] rounded-[9px] border border-[var(--border)] hover:bg-[var(--hover)] transition-colors">
                  <SquareAvatar name={displayName} size={26} variant="filled" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold text-[var(--text)]">{displayName}</span>
                    {displayRole && (
                      <span className="text-[9.5px] font-semibold text-[var(--text-faint)] tracking-[.03em]">
                        {displayRole}
                      </span>
                    )}
                  </div>
                </div>
              </Dropdown>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-auto p-5 bg-[var(--bg)]">
            {children}
          </div>

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
        </div>
      </div>

      <ChatWidget />
      <CreateTicketModal
        open={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        onSuccess={() => setCreateTicketOpen(false)}
      />
    </App>
  );
}
