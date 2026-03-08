import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TicketDetail from "./pages/TicketDetail";
import Callback from "./pages/Callback";
import Settings from "./pages/Settings";
import WorkflowDetail from "./pages/WorkflowDetail";

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
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
        },
        components: {
          Layout: {
            siderBg: "#0D0D0D",
            headerBg: "#111111",
            bodyBg: "#0A0A0A",
          },
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
          Card: {
            headerBg: "#0D0D0D",
            colorBorderSecondary: "rgba(255,229,0,0.15)",
          },
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
          DatePicker: {
            colorBgContainer: "#0D0D0D",
            colorBgElevated: "#0D0D0D",
            activeBorderColor: "#FFE500",
          },
          Modal: {
            contentBg: "#111111",
            headerBg: "#0D0D0D",
            footerBg: "#0D0D0D",
          },
          Tag: {
            defaultBg: "rgba(255,229,0,0.1)",
            defaultColor: "#FFE500",
          },
          Descriptions: {
            labelBg: "transparent",
          },
          Steps: {
            colorPrimary: "#FFE500",
          },
          Spin: {
            colorPrimary: "#FFE500",
          },
          Pagination: {
            itemActiveBg: "rgba(255,229,0,0.1)",
            colorPrimary: "#FFE500",
            colorPrimaryHover: "#FFE500",
          },
          Avatar: {
            colorBgBase: "#FFE500",
          },
          Divider: {
            colorSplit: "rgba(255,229,0,0.15)",
          },
          Alert: {
            colorSuccess: "#00F5FF",
            colorSuccessBg: "rgba(0,245,255,0.07)",
            colorSuccessBorder: "#00F5FF",
            colorError: "#FF2D6B",
            colorErrorBg: "rgba(255,45,107,0.07)",
            colorErrorBorder: "#FF2D6B",
          },
          Dropdown: {
            colorBgElevated: "#0D0D0D",
          },
          Form: {
            labelColor: "rgba(240,240,240,0.55)",
          },
          Tooltip: {
            colorBgSpotlight: "#0D0D0D",
            colorTextLightSolid: "#F0F0F0",
          },
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
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

export default App;
