"use client";

import { Layout, Menu, Typography, Avatar, Badge, Dropdown, Button } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  BarChartOutlined,
  FileDoneOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/auth";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems: MenuProps["items"] = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/dashboard/petani",
    icon: <TeamOutlined />,
    label: "Petani",
  },
  {
    key: "/dashboard/lahan",
    icon: <EnvironmentOutlined />,
    label: "Lahan",
  },
  {
    key: "/dashboard/aktivitas",
    icon: <FileTextOutlined />,
    label: "Aktivitas",
  },
  {
    key: "/dashboard/analitik",
    icon: <BarChartOutlined />,
    label: "Analitik",
  },
  {
    key: "/dashboard/laporan",
    icon: <FileDoneOutlined />,
    label: "Laporan",
  },
  {
    type: "divider",
  },
  {
    key: "/dashboard/pengaturan",
    icon: <SettingOutlined />,
    label: "Pengaturan",
  },
];

const userMenuItems: MenuProps["items"] = [
  {
    key: "profile",
    label: "Profil Saya",
  },
  {
    type: "divider",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Keluar",
    danger: true,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
  };

  const handleUserMenu: MenuProps["onClick"] = (e) => {
    if (e.key === "logout") {
      logout();
      router.push("/login");
    }
  };

  // Determine active key
  const selectedKey =
    menuItems
      ?.filter((item) => item && "key" in item)
      .map((item) => item!.key as string)
      .filter((key) => pathname === key || (key !== "/dashboard" && pathname.startsWith(key)))
      .sort((a, b) => b.length - a.length)[0] || "/dashboard";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={80}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: "#1E293B",
          borderRight: "1px solid #334155",
          transition: "all 0.2s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "0" : "0 20px",
            borderBottom: "1px solid #334155",
            gap: 10,
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: 28 }}>🌾</span>
          {!collapsed && (
            <Text
              strong
              style={{
                color: "#F8FAFC",
                fontSize: 18,
                letterSpacing: "-0.5px",
                whiteSpace: "nowrap",
              }}
            >
              Peta Tani
            </Text>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            padding: "12px 0",
            borderRight: "none",
          }}
        />
      </Sider>

      {/* Main Content */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Top Header */}
        <Header
          style={{
            background: "#1E293B",
            borderBottom: "1px solid #334155",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: "#94A3B8", fontSize: 18 }}
            id="toggle-sidebar"
          />

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: "#94A3B8", fontSize: 18 }}
                id="notifications-btn"
              />
            </Badge>

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "background 0.2s",
                }}
                id="user-menu"
              >
                <Avatar
                  style={{
                    backgroundColor: "#2D6A4F",
                    fontWeight: 600,
                  }}
                  size={36}
                >
                  {(user?.nama ?? "A")[0].toUpperCase()}
                </Avatar>
                {!collapsed && (
                  <div style={{ lineHeight: 1.3 }}>
                    <Text
                      style={{
                        color: "#F8FAFC",
                        fontSize: 13,
                        fontWeight: 500,
                        display: "block",
                      }}
                    >
                      {user?.nama ?? "Admin"}
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 11 }}>
                      {user?.email ?? "admin@petatani.id"}
                    </Text>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Page Content */}
        <Content
          style={{
            padding: 24,
            minHeight: "calc(100vh - 64px)",
            background: "#0F172A",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
