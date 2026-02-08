import { Button, Card, Typography } from "antd";
import { LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/AuthProvider";

const { Title, Paragraph } = Typography;

export default function Home() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center shadow-lg">
          <Title level={2}>Welcome</Title>
          <Paragraph className="text-gray-500">
            Please log in to continue.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={login}
          >
            Login with OAuth2
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <div className="mb-6 text-center">
          <Title level={2}>Authenticated</Title>
        </div>
        {user && (
          <pre className="mb-6 max-h-96 overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        )}
        <div className="text-center">
          <Button
            type="default"
            size="large"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
