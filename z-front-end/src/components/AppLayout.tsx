import { useState, type ReactNode } from "react";
import { Layout, Menu, Button, Avatar, Dropdown } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const displayName =
    (user?.preferred_username as string) ??
    (user?.name as string) ??
    (user?.sub as string) ??
    "User";

  const siderMenuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Home",
    },
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
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{ overflow: "auto", height: "100vh", position: "sticky", top: 0, left: 0 }}
      >
        <div className="flex h-16 items-center justify-center">
          <span className="text-lg font-bold text-white">
            {collapsed ? "Z" : "Z App"}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={siderMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className="flex items-center justify-between !bg-white !px-4 shadow-sm">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex cursor-pointer items-center gap-2">
              <span className="text-sm">{displayName}</span>
              <Avatar size="small" icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>

        <Content className="m-4 rounded-lg bg-white p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
