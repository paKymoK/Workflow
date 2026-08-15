import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Input, Badge, Dropdown, Avatar, Button } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined, SoundOutlined, CheckSquareOutlined, ProfileOutlined,
  CustomerServiceOutlined, TeamOutlined, CoffeeOutlined, FieldTimeOutlined,
  FundProjectionScreenOutlined, SettingOutlined, BellOutlined, SearchOutlined,
  SunOutlined, MoonOutlined, LogoutOutlined, DownOutlined, AppstoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTheme, useAuth } from "@takypok/shared";
import { NAV_GROUPS, PAGE_TITLES } from "../../data/admin/navigation";
import { fetchUserBySub } from "../../api/ticketApi";

const { Sider, Header, Content } = Layout;

const GROUP_ICONS: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  content: <SoundOutlined />,
  approvals: <CheckSquareOutlined />,
  surveys: <ProfileOutlined />,
  helpdesk: <CustomerServiceOutlined />,
  users: <TeamOutlined />,
  operations: <CoffeeOutlined />,
  timesheet: <FieldTimeOutlined />,
  production: <FundProjectionScreenOutlined />,
  settings: <SettingOutlined />,
};

const menuItems: MenuProps["items"] = NAV_GROUPS.map((group) => ({
  key: group.path ?? group.key,
  icon: GROUP_ICONS[group.icon],
  label: group.label,
  children: group.children?.map((child) => ({ key: child.key, label: child.label })),
}));

const notifications = [
  { id: 1, text: "5 leave requests awaiting your approval", time: "10 min ago", unread: true },
  { id: 2, text: "New IT ticket TK-2061 — Software issue reported", time: "32 min ago", unread: true },
  { id: 3, text: "Canteen Feedback survey now has 178 responses", time: "1h ago", unread: false },
  { id: 4, text: "Scheduled announcement pending final review", time: "2h ago", unread: false },
];
const unreadCount = notifications.filter((n) => n.unread).length;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Dashboard";
  const openKeys = NAV_GROUPS.filter((g) => g.children?.some((c) => c.key === location.pathname)).map((g) => g.key);

  const displayName =
    (user?.preferred_username as string) ??
    (user?.name as string) ??
    (user?.sub as string) ??
    "Admin";

  const displayRole = (() => {
    const roles = user?.roles;
    if (Array.isArray(roles) && roles.length > 0) return String(roles[0]).toUpperCase();
    return null;
  })();

  // Real avatar — the JWT doesn't carry display data, so fetch it live from
  // employee-service, same as workflow's Settings.tsx does.
  const mySub = user?.sub as string | undefined;
  const { data: myProfile } = useQuery({
    queryKey: ["user", mySub],
    queryFn: () => fetchUserBySub(mySub!),
    enabled: !!mySub,
  });

  const notificationItems: MenuProps["items"] = notifications.map((n) => ({
    key: n.id,
    label: (
      <div className="flex items-start gap-2.5 py-0.5 max-w-[280px]">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
        <div>
          <p className="text-xs leading-relaxed whitespace-normal">{n.text}</p>
          <p className="text-[11px] text-[var(--text-faint)] mt-0.5">{n.time}</p>
        </div>
      </div>
    ),
  }));

  const userMenuItems: MenuProps["items"] = [
    { key: "back", icon: <AppstoreOutlined />, label: "Back to Workflow", onClick: () => navigate("/") },
    { key: "settings", icon: <SettingOutlined />, label: "Settings", onClick: () => navigate("/admin/settings") },
    { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true, onClick: () => logout() },
  ];

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={252}
        className="border-r border-[var(--border)]"
        theme="light"
      >
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--border)] overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <span className="font-bold text-sm text-[var(--text)]">CMC GLOBAL</span>
              <span className="text-[10px] text-[var(--text-faint)] tracking-wide">ADMIN PORTAL</span>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="!border-r-0"
        />
      </Sider>

      <Layout>
        <Header className="!h-14 !bg-[var(--surface)] !px-5 border-b border-[var(--border)] flex items-center gap-4">
          <div className="text-xs leading-none text-[var(--text-faint)] whitespace-nowrap">
            <span>CMC Global</span>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text)] font-medium">{pageTitle}</span>
          </div>

          <Input
            prefix={<SearchOutlined className="text-[var(--text-faint)]" />}
            placeholder="Search employees, tickets, announcements..."
            className="max-w-sm ml-4"
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <Dropdown
              menu={{ items: notificationItems }}
              trigger={["click"]}
              placement="bottomRight"
              popupRender={(menu) => (
                <div className="bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-sm font-semibold">Notifications</span>
                  </div>
                  {menu}
                </div>
              )}
            >
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  shape="circle"
                  className="!border !border-[var(--border)] !text-[var(--text-dim)]"
                  icon={<BellOutlined />}
                />
              </Badge>
            </Dropdown>

            <Button
              type="text"
              shape="circle"
              className="!border !border-[var(--border)] !text-[var(--text-dim)]"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--hover)] transition-colors">
                <Avatar
                  size={28}
                  src={myProfile?.avatar ?? undefined}
                  icon={!myProfile?.avatar ? <UserOutlined /> : undefined}
                  className="!bg-[var(--accent)]"
                />
                <div className="text-left leading-tight">
                  <div className="text-xs font-semibold">{displayName}</div>
                  {displayRole && (
                    <div className="text-[10px] text-[var(--text-faint)]">{displayRole}</div>
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
      </Layout>
    </Layout>
  );
}
