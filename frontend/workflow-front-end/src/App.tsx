import { ConfigProvider, theme } from "antd";
import { ThemeProvider, useTheme, FontProvider, useFont, darkTokens, lightTokens, darkComponents, lightComponents } from "@takypok/shared";
import AppRouter from "./router";

function ThemedApp() {
  const { isDark, accentScheme } = useTheme();
  const { isCustomFont } = useFont();
  const fontFamily = isCustomFont ? "'AegirSeaborn', monospace" : "'Share Tech Mono', monospace";

  const isDefaultAntd = accentScheme === "default";

  return (
    <ConfigProvider
      theme={
        isDefaultAntd
          ? { algorithm: theme.defaultAlgorithm }
          : {
              algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
              token: isDark ? darkTokens(fontFamily) : lightTokens(fontFamily),
              components: isDark ? darkComponents : lightComponents,
            }
      }
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
