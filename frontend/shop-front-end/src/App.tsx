import { ConfigProvider, theme } from "antd";
import { ThemeProvider, useTheme, FontProvider, useFont, darkTokens, lightTokens, darkComponents, lightComponents } from "@takypok/shared";
import AppRouter from "./router";

function ThemedApp() {
  const { isDark } = useTheme();
  const { isCustomFont } = useFont();
  const fontFamily = isCustomFont ? "'AegirSeaborn', monospace" : "'Share Tech Mono', monospace";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDark ? darkTokens(fontFamily) : lightTokens(fontFamily),
        components: isDark ? darkComponents : lightComponents,
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
