import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Portfolio from "./pages/Portfolio";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TicketDetail from "./pages/TicketDetail";
import Callback from "./pages/Callback";
import Settings from "./pages/Settings";
import WorkflowDetail from "./pages/WorkflowDetail";
import Diary from "./pages/Diary";
import { ThemeProvider } from "./context/ThemeContext";
import { useTheme } from "./context/useTheme";

function ThemedApp() {
  const { isDark } = useTheme();

  const darkTokens = {
    colorPrimary: "#FFE500",
    colorBgBase: "#111111",
    colorTextBase: "#F0F0F0",
    borderRadius: 0,
    fontFamily: "'Share Tech Mono', monospace",
    colorBorder: "rgba(255,229,0,0.2)",
    colorBgContainer: "#111111",
    colorBgLayout: "#0A0A0A",
    colorBgElevated: "#0D0D0D",
    colorLink: "#00F5FF",
    colorLinkHover: "#FFE500",
    colorSuccess: "#00F5FF",
    colorWarning: "#FFE500",
    colorError: "#FF2D6B",
    colorInfo: "#00F5FF",
  };

  const lightTokens = {
    colorPrimary: "#D4B800",
    colorBgBase: "#F5F5F5",
    colorTextBase: "#1A1A1A",
    borderRadius: 0,
    fontFamily: "'Share Tech Mono', monospace",
    colorBorder: "rgba(212,184,0,0.35)",
    colorBgContainer: "#FFFFFF",
    colorBgLayout: "#EBEBEB",
    colorBgElevated: "#F0F0F0",
    colorLink: "#0099BB",
    colorLinkHover: "#D4B800",
    colorSuccess: "#007A8C",
    colorWarning: "#D4B800",
    colorError: "#CC1A4E",
    colorInfo: "#0099BB",
  };

  const darkComponents = {
    Layout: { siderBg: "#0D0D0D", headerBg: "#111111", bodyBg: "#0A0A0A" },
    Menu: {
      darkItemBg: "#0D0D0D",
      darkItemSelectedBg: "rgba(255,229,0,0.08)",
      darkItemSelectedColor: "#FFE500",
      darkItemColor: "rgba(240,240,240,0.45)",
      darkItemHoverColor: "#FFE500",
      darkItemHoverBg: "rgba(255,229,0,0.05)",
      darkSubMenuItemBg: "#0D0D0D",
      borderRadius: 0,
      itemBorderRadius: 0,
    },
    Card: { headerBg: "#0D0D0D", colorBorderSecondary: "rgba(255,229,0,0.15)" },
    Table: {
      headerBg: "#0A0A0A",
      headerColor: "#FFE500",
      rowHoverBg: "rgba(255,229,0,0.04)",
      borderColor: "rgba(255,229,0,0.1)",
      headerSortActiveBg: "#0A0A0A",
      headerSortHoverBg: "#0A0A0A",
      bodySortBg: "#111111",
      colorBgContainer: "#111111",
    },
    Tabs: {
      inkBarColor: "#FFE500",
      itemSelectedColor: "#FFE500",
      itemHoverColor: "#FFE500",
      itemColor: "rgba(240,240,240,0.45)",
      cardBg: "#0D0D0D",
    },
    Button: {
      defaultBg: "#111111",
      defaultColor: "#F0F0F0",
      defaultBorderColor: "rgba(255,229,0,0.3)",
      defaultHoverBg: "rgba(255,229,0,0.08)",
      defaultHoverColor: "#FFE500",
      defaultHoverBorderColor: "#FFE500",
      colorPrimary: "#FFE500",
      primaryColor: "#0A0A0A",
      colorPrimaryHover: "#FF2D6B",
      primaryShadow: "none",
    },
    Input: {
      colorBgContainer: "rgba(255,255,255,0.04)",
      colorBorder: "rgba(255,229,0,0.25)",
      activeBorderColor: "#FFE500",
      hoverBorderColor: "rgba(255,229,0,0.5)",
      colorText: "#F0F0F0",
      colorTextPlaceholder: "rgba(240,240,240,0.3)",
      activeShadow: "0 0 0 3px rgba(255,229,0,0.1)",
    },
    Select: {
      colorBgContainer: "#0D0D0D",
      colorBgElevated: "#0D0D0D",
      optionSelectedBg: "rgba(255,229,0,0.1)",
      optionSelectedColor: "#FFE500",
      selectorBg: "#0D0D0D",
    },
    DatePicker: { colorBgContainer: "#0D0D0D", colorBgElevated: "#0D0D0D", activeBorderColor: "#FFE500" },
    Modal: { contentBg: "#111111", headerBg: "#0D0D0D", footerBg: "#0D0D0D" },
    Tag: { defaultBg: "rgba(255,229,0,0.1)", defaultColor: "#FFE500" },
    Descriptions: { labelBg: "transparent" },
    Steps: { colorPrimary: "#FFE500" },
    Spin: { colorPrimary: "#FFE500" },
    Pagination: { itemActiveBg: "rgba(255,229,0,0.1)", colorPrimary: "#FFE500", colorPrimaryHover: "#FFE500" },
    Avatar: { colorBgBase: "#FFE500" },
    Divider: { colorSplit: "rgba(255,229,0,0.15)" },
    Alert: {
      colorSuccess: "#00F5FF",
      colorSuccessBg: "rgba(0,245,255,0.07)",
      colorSuccessBorder: "#00F5FF",
      colorError: "#FF2D6B",
      colorErrorBg: "rgba(255,45,107,0.07)",
      colorErrorBorder: "#FF2D6B",
    },
    Dropdown: { colorBgElevated: "#0D0D0D" },
    Form: { labelColor: "rgba(240,240,240,0.55)" },
    Tooltip: { colorBgSpotlight: "#0D0D0D", colorTextLightSolid: "#F0F0F0" },
  };

  const lightComponents = {
    Layout: { siderBg: "#F0F0F0", headerBg: "#FFFFFF", bodyBg: "#EBEBEB" },
    Menu: {
      itemBg: "#F0F0F0",
      itemSelectedBg: "rgba(212,184,0,0.12)",
      itemSelectedColor: "#D4B800",
      itemColor: "rgba(26,26,26,0.65)",
      itemHoverColor: "#D4B800",
      itemHoverBg: "rgba(212,184,0,0.06)",
      borderRadius: 0,
      itemBorderRadius: 0,
    },
    Card: { headerBg: "#F0F0F0", colorBorderSecondary: "rgba(212,184,0,0.25)" },
    Table: {
      headerBg: "#EBEBEB",
      headerColor: "#D4B800",
      rowHoverBg: "rgba(212,184,0,0.06)",
      borderColor: "rgba(212,184,0,0.2)",
      headerSortActiveBg: "#EBEBEB",
      headerSortHoverBg: "#EBEBEB",
      bodySortBg: "#FFFFFF",
      colorBgContainer: "#FFFFFF",
    },
    Tabs: {
      inkBarColor: "#D4B800",
      itemSelectedColor: "#D4B800",
      itemHoverColor: "#D4B800",
      itemColor: "rgba(26,26,26,0.55)",
      cardBg: "#F0F0F0",
    },
    Button: {
      defaultBg: "#FFFFFF",
      defaultColor: "#1A1A1A",
      defaultBorderColor: "rgba(212,184,0,0.4)",
      defaultHoverBg: "rgba(212,184,0,0.08)",
      defaultHoverColor: "#D4B800",
      defaultHoverBorderColor: "#D4B800",
      colorPrimary: "#D4B800",
      primaryColor: "#FFFFFF",
      colorPrimaryHover: "#CC1A4E",
      primaryShadow: "none",
    },
    Input: {
      colorBgContainer: "#FFFFFF",
      colorBorder: "rgba(212,184,0,0.35)",
      activeBorderColor: "#D4B800",
      hoverBorderColor: "rgba(212,184,0,0.6)",
      colorText: "#1A1A1A",
      colorTextPlaceholder: "rgba(26,26,26,0.35)",
      activeShadow: "0 0 0 3px rgba(212,184,0,0.1)",
    },
    Select: {
      colorBgContainer: "#FFFFFF",
      colorBgElevated: "#FFFFFF",
      optionSelectedBg: "rgba(212,184,0,0.1)",
      optionSelectedColor: "#D4B800",
      selectorBg: "#FFFFFF",
    },
    DatePicker: { colorBgContainer: "#FFFFFF", colorBgElevated: "#FFFFFF", activeBorderColor: "#D4B800" },
    Modal: { contentBg: "#FFFFFF", headerBg: "#F0F0F0", footerBg: "#F0F0F0" },
    Tag: { defaultBg: "rgba(212,184,0,0.12)", defaultColor: "#D4B800" },
    Descriptions: { labelBg: "transparent" },
    Steps: { colorPrimary: "#D4B800" },
    Spin: { colorPrimary: "#D4B800" },
    Pagination: { itemActiveBg: "rgba(212,184,0,0.1)", colorPrimary: "#D4B800", colorPrimaryHover: "#D4B800" },
    Avatar: { colorBgBase: "#D4B800" },
    Divider: { colorSplit: "rgba(212,184,0,0.25)" },
    Alert: {
      colorSuccess: "#007A8C",
      colorSuccessBg: "rgba(0,122,140,0.07)",
      colorSuccessBorder: "#007A8C",
      colorError: "#CC1A4E",
      colorErrorBg: "rgba(204,26,78,0.07)",
      colorErrorBorder: "#CC1A4E",
    },
    Dropdown: { colorBgElevated: "#FFFFFF" },
    Form: { labelColor: "rgba(26,26,26,0.65)" },
    Tooltip: { colorBgSpotlight: "#1A1A1A", colorTextLightSolid: "#F5F5F5" },
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDark ? darkTokens : lightTokens,
        components: isDark ? darkComponents : lightComponents,
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/callback" element={<Callback />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:id" element={<TicketDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/workflow/:id" element={<WorkflowDetail />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
