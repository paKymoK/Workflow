import { useEffect, useMemo } from "react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Spin, Typography } from "antd";
import { useAuth } from "@takypok/shared";

const { Title } = Typography;

// sessionStorage is not shared across windows, so the popup has no pkce_state/
// pkce_code_verifier — those live in the parent. Detect popup early so we can
// skip the sessionStorage checks and let the parent validate instead.
const isPopup = () =>
  typeof window !== "undefined" &&
  !!window.opener &&
  window.opener !== window;

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    // OAuth2 error response (e.g. access_denied, invalid_request)
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const desc = searchParams.get("error_description");
      const msg  = desc
        ? decodeURIComponent(desc.replace(/\+/g, " "))
        : `Authorization failed: ${oauthError}`;
      if (isPopup()) {
        window.opener?.postMessage(
          { type: "auth-error", message: msg },
          window.location.origin,
        );
      }
      return msg;
    }

    const code = searchParams.get("code");
    if (!code) return "No authorization code received";

    // In popup mode the state and codeVerifier live in the parent's
    // sessionStorage. The parent's message handler validates them — skip here.
    if (isPopup()) return null;

    const state        = searchParams.get("state");
    const savedState   = sessionStorage.getItem("pkce_state");
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
    if (state !== savedState) return "State mismatch — possible CSRF attack";
    if (!codeVerifier) return "No code verifier found — please try logging in again";
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (validationError) return;

    const code  = searchParams.get("code")!;
    const state = searchParams.get("state")!;

    // Popup mode: hand the code back to the parent window and close self.
    // The parent's AuthProvider message listener handles the token exchange.
    if (isPopup()) {
      window.opener.postMessage(
        { type: "auth-callback", code, state },
        window.location.origin,
      );
      window.close();
      return;
    }

    // Full-page redirect mode: exchange the code here as usual.
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
      <Spin size="large" description="Completing login...">
        <div className="p-12" />
      </Spin>
    </div>
  );
}
