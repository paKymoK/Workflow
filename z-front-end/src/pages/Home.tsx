import { Card, Typography } from "antd";
import { useAuth } from "../auth/useAuth";

const { Title } = Typography;

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <Title level={3}>Home</Title>
      {user && (
        <Card>
          <pre className="max-h-96 overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </Card>
      )}
    </>
  );
}
