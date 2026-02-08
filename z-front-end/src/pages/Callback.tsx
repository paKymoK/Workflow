import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Spin, Typography } from "antd";
import { useAuth } from "../auth/AuthProvider";

const { Title } = Typography;

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("pkce_state");
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

    if (!code) {
      setError("No authorization code received");
      return;
    }

    if (state !== savedState) {
      setError("State mismatch — possible CSRF attack");
      return;
    }

    if (!codeVerifier) {
      setError("No code verifier found — please try logging in again");
      return;
    }

    handleCallback(code, codeVerifier)
      .then(() => {
        sessionStorage.removeItem("pkce_code_verifier");
        sessionStorage.removeItem("pkce_state");
        navigate("/", { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Token exchange failed");
      });
  }, [searchParams, handleCallback, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center shadow-lg">
          <Title level={3}>Authentication Error</Title>
          <Alert message={error} type="error" showIcon className="mb-4" />
          <Button type="primary" onClick={() => (window.location.href = "/")}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Spin size="large" tip="Completing login...">
        <div className="p-12" />
      </Spin>
    </div>
  );
}
