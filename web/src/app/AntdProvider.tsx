"use client";

import { ConfigProvider, theme } from "antd";
import idID from "antd/locale/id_ID";

const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#2D6A4F",
    colorSuccess: "#2D6A4F",
    colorWarning: "#E9C46A",
    colorError: "#E63946",
    colorInfo: "#22D3EE",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 8,
    colorBgContainer: "#1E293B",
    colorBgElevated: "#1E293B",
    colorBgLayout: "#0F172A",
    colorBorder: "#334155",
    colorText: "#F8FAFC",
    colorTextSecondary: "#94A3B8",
  },
  components: {
    Menu: {
      darkItemBg: "transparent",
      darkItemSelectedBg: "rgba(45, 106, 79, 0.3)",
      darkItemSelectedColor: "#40916C",
      darkItemHoverBg: "rgba(45, 106, 79, 0.15)",
      itemBorderRadius: 8,
      itemMarginInline: 8,
    },
    Card: {
      colorBgContainer: "#1E293B",
    },
    Table: {
      colorBgContainer: "#1E293B",
      headerBg: "#0F172A",
      headerColor: "#94A3B8",
      rowHoverBg: "rgba(45, 106, 79, 0.1)",
      borderColor: "#334155",
    },
    Statistic: {
      contentFontSize: 28,
    },
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
  },
};

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider theme={antdTheme} locale={idID}>
      {children}
    </ConfigProvider>
  );
}
