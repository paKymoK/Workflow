import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Spin, Typography } from "antd";
import { useAuth } from "../auth/useAuth";

const { Title } = Typography;

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("pkce_state");
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

    if (!code) return "No authorization code received";
    if (state !== savedState) return "State mismatch — possible CSRF attack";
    if (!codeVerifier)
      return "No code verifier found — please try logging in again";
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (validationError) return;

    const code = searchParams.get("code")!;
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier")!;

    handleCallback(code, codeVerifier)
      .then(() => {
        sessionStorage.removeItem("pkce_code_verifier");
        sessionStorage.removeItem("pkce_state");
        navigate("/", { replace: true });
      })
      .catch((err) => {
        setExchangeError(
          err instanceof Error ? err.message : "Token exchange failed"
        );
      });
  }, [searchParams, validationError, handleCallback, navigate]);

  const error = validationError ?? exchangeError;

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
