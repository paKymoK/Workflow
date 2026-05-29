import { HashRouter } from "react-router-dom";
import { ConfigProvider, theme, App as AntApp, Tabs, Layout, Avatar, Dropdown, Button } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, ThemeProvider, FontProvider, useTheme, useFont, darkTokens, lightTokens, darkComponents, lightComponents, BubbleBackground } from "@takypok/shared";
import { UserOutlined, LogoutOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import UserList from "./components/UserList";
import OrgChartView from "./components/OrgChartView";
import ClientList from "./components/ClientList";
import GroupList from "./components/GroupList";
import RoleList from "./components/RoleList";

const { Header, Content } = Layout;

const tabs = [
  { key: "users",    label: "Users",     children: <UserList /> },
  { key: "orgChart", label: "Org Chart", children: <OrgChartView /> },
  { key: "clients",  label: "Clients",   children: <ClientList /> },
  { key: "groups",   label: "Groups",    children: <GroupList /> },
  { key: "roles",    label: "Roles",     children: <RoleList /> },
];

function IAMApp() {
  const { isDark, toggleTheme } = useTheme();
  const { isCustomFont } = useFont();
  const fontFamily = isCustomFont ? "'AegirSeaborn', monospace" : "'Share Tech Mono', monospace";

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: () => { window.location.href = "/logout"; },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token:      isDark ? darkTokens(fontFamily) : lightTokens(fontFamily),
        components: isDark ? darkComponents : lightComponents,
      }}
    >
      <AntApp>
        <BubbleBackground />
        <Layout className="h-screen">
          <Header className="flex items-center justify-between !px-6 !h-14 border-b border-[var(--border-subtle)] flex-shrink-0 z-10">
            <div className="flex items-center gap-4">
              <span className="font-bebas text-2xl tracking-[0.2em] neon-text-yellow">IAM</span>
              <span className="font-mono-tech text-xs text-[var(--text-muted)] tracking-widest hidden sm:block">
                // IDENTITY & ACCESS MANAGEMENT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                className="!text-[var(--neon-yellow)] hover:!bg-[var(--border-subtle)] !h-9 !w-9"
              />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar
                  size="default"
                  icon={<UserOutlined />}
                  className="!bg-[var(--neon-yellow)] !text-black cursor-pointer"
                />
              </Dropdown>
            </div>
          </Header>

          <Content className="flex-1 overflow-auto p-5">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-bebas text-3xl tracking-[0.15em] neon-text-yellow m-0">▸ PORTAL</h2>
              <span className="font-mono-tech text-xs text-[rgba(240,240,240,0.3)] tracking-widest">
                // IDENTITY & ACCESS CONTROL
              </span>
            </div>

            <Tabs items={tabs} />
          </Content>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <FontProvider>
          <ThemeProvider>
            <IAMApp />
          </ThemeProvider>
        </FontProvider>
      </QueryClientProvider>
    </HashRouter>
  );
}
