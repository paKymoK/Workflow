import { Button, Card, Typography } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/useAuth";

const { Title, Paragraph } = Typography;

export default function Login() {
  const { login } = useAuth();

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
