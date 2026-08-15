import { ConfigProvider, theme } from "antd";
import { ThemeProvider, useTheme, FontProvider } from "@takypok/shared";
import AppRouter from "./router";

const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Mirrors the CSS custom properties in index.css — kept in sync manually
// since AntD's ConfigProvider needs literal color values, not var() refs.
const PALETTE = {
  light: {
    accent: "#1565C0", bg: "#F4F6F9", surface: "#FFFFFF", border: "#E4E9F0", hover: "#F1F4F9",
    text: "#1E2A3A", textDim: "#5B6B82", textFaint: "#93A0B4",
    green: "#1E9E6A", red: "#E5484D", amber: "#C77700",
  },
  dark: {
    accent: "#4C9AFF", bg: "#0E141F", surface: "#161D2B", border: "#26304399", hover: "#1E2636",
    text: "#E7ECF5", textDim: "#9AA7BC", textFaint: "#65728A",
    green: "#3ECF8E", red: "#F0616A", amber: "#F0A83C",
  },
};

function ThemedApp() {
  const { isDark } = useTheme();
  const p = isDark ? PALETTE.dark : PALETTE.light;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: p.accent,
          borderRadius: 8,
          fontFamily: FONT_FAMILY,
          colorBgContainer: p.surface,
          colorBgElevated: p.surface,
          colorBgLayout: p.bg,
          colorFillAlter: p.hover,
          colorBorder: p.border,
          colorBorderSecondary: p.border,
          colorText: p.text,
          colorTextSecondary: p.textDim,
          colorTextTertiary: p.textFaint,
          colorTextQuaternary: p.textFaint,
          colorSuccess: p.green,
          colorWarning: p.amber,
          colorError: p.red,
        },
        components: {
          Layout: { headerBg: p.surface, siderBg: p.surface, bodyBg: p.bg },
          Menu: { itemBorderRadius: 8, subMenuItemBorderRadius: 8 },
          Button: { borderRadius: 8, controlHeight: 34 },
          Input: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          Table: { borderRadius: 8, headerBorderRadius: 8, headerBg: p.hover },
          Tabs: { inkBarColor: p.accent, itemSelectedColor: p.accent, itemHoverColor: p.accent },
          Segmented: { borderRadius: 8 },
          Modal: { borderRadiusLG: 12 },
          Drawer: { borderRadiusLG: 12 },
          Tag: { borderRadiusSM: 20 },
        },
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <FontProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </FontProvider>
  );
}
