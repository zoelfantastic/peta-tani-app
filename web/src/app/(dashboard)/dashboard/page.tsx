"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  Select,
} from "antd";
import {
  TeamOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Column, Pie } from "@ant-design/charts";

const { Title, Text } = Typography;

// --- Mock Data ---
const kpiData = [
  {
    title: "Total Petani",
    value: 245,
    change: 12,
    changeType: "up" as const,
    icon: <TeamOutlined style={{ fontSize: 24, color: "#22D3EE" }} />,
    color: "#22D3EE",
  },
  {
    title: "Total Lahan",
    value: 580,
    change: 8,
    changeType: "up" as const,
    icon: <EnvironmentOutlined style={{ fontSize: 24, color: "#2D6A4F" }} />,
    color: "#2D6A4F",
  },
  {
    title: "Aktivitas Bulan Ini",
    value: 1247,
    change: 23,
    changeType: "up" as const,
    icon: <FileTextOutlined style={{ fontSize: 24, color: "#E76F51" }} />,
    color: "#E76F51",
  },
  {
    title: "Siap Panen",
    value: 32,
    change: 5,
    changeType: "down" as const,
    icon: <RiseOutlined style={{ fontSize: 24, color: "#E9C46A" }} />,
    color: "#E9C46A",
  },
];

interface AktivitasRow {
  key: string;
  petani: string;
  lahan: string;
  aktivitas: string;
  tanaman: string;
  waktu: string;
}

const recentActivities: AktivitasRow[] = [
  {
    key: "1",
    petani: "Pak Ahmad",
    lahan: "Sawah Belakang",
    aktivitas: "Pemupukan",
    tanaman: "Padi",
    waktu: "2 jam lalu",
  },
  {
    key: "2",
    petani: "Bu Siti",
    lahan: "Kebun Atas",
    aktivitas: "Penyiraman",
    tanaman: "Jagung",
    waktu: "3 jam lalu",
  },
  {
    key: "3",
    petani: "Pak Budi",
    lahan: "Ladang Timur",
    aktivitas: "Olah Tanah",
    tanaman: "Kedelai",
    waktu: "5 jam lalu",
  },
  {
    key: "4",
    petani: "Pak Dedi",
    lahan: "Sawah Depan",
    aktivitas: "Penyemaian",
    tanaman: "Padi",
    waktu: "6 jam lalu",
  },
  {
    key: "5",
    petani: "Bu Rina",
    lahan: "Kebun Bawah",
    aktivitas: "Pengendalian Hama",
    tanaman: "Cabai",
    waktu: "8 jam lalu",
  },
];

const activityTagColor: Record<string, string> = {
  Pemupukan: "cyan",
  Penyiraman: "blue",
  "Olah Tanah": "orange",
  Penyemaian: "green",
  "Pengendalian Hama": "red",
  Panen: "gold",
};

const columns: ColumnsType<AktivitasRow> = [
  {
    title: "Petani",
    dataIndex: "petani",
    key: "petani",
    render: (text: string) => (
      <Text strong style={{ color: "#F8FAFC" }}>
        {text}
      </Text>
    ),
  },
  {
    title: "Lahan",
    dataIndex: "lahan",
    key: "lahan",
  },
  {
    title: "Aktivitas",
    dataIndex: "aktivitas",
    key: "aktivitas",
    render: (text: string) => (
      <Tag color={activityTagColor[text] || "default"}>{text}</Tag>
    ),
  },
  {
    title: "Tanaman",
    dataIndex: "tanaman",
    key: "tanaman",
    render: (text: string) => <Tag variant="filled">{text}</Tag>,
  },
  {
    title: "Waktu",
    dataIndex: "waktu",
    key: "waktu",
    render: (text: string) => (
      <Space>
        <ClockCircleOutlined style={{ color: "#64748B" }} />
        <Text style={{ color: "#94A3B8" }}>{text}</Text>
      </Space>
    ),
  },
];

const weeklyData = [
  { day: "Sen", value: 45 },
  { day: "Sel", value: 62 },
  { day: "Rab", value: 38 },
  { day: "Kam", value: 71 },
  { day: "Jum", value: 55 },
  { day: "Sab", value: 29 },
  { day: "Min", value: 18 },
];

const tanamanDistributionData = [
  { type: "Padi", value: 42 },
  { type: "Jagung", value: 25 },
  { type: "Kedelai", value: 15 },
  { type: "Cabai", value: 12 },
  { type: "Lainnya", value: 6 },
];

export default function DashboardPage() {
  const columnConfig = {
    data: weeklyData,
    xField: "day",
    yField: "value",
    style: {
      fill: "linear-gradient(180deg, #40916C, #2D6A4F)",
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
  };

  const pieConfig = {
    data: tanamanDistributionData,
    angleField: "value",
    colorField: "type",
    radius: 0.7,
    innerRadius: 0.5,
    label: {
      text: "type",
      style: {
        fontSize: 10,
        fill: "#F8FAFC",
      },
    },
    legend: {
      color: {
        title: false,
        position: "bottom",
        rowPadding: 5,
      },
    },
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Dashboard
        </Title>
        <Text style={{ color: "#94A3B8" }}>
          Ringkasan data pertanian — Mei 2026
        </Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiData.map((kpi, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="kpi-card fade-in-up" variant="borderless">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text style={{ color: "#94A3B8", fontSize: 13 }}>
                    {kpi.title}
                  </Text>
                  <Statistic
                    value={kpi.value}
                    styles={{
                      content: { color: "#F8FAFC", fontWeight: 700, fontSize: 28 },
                    }}
                  />
                  <Space size={4} style={{ marginTop: 4 }}>
                    {kpi.changeType === "up" ? (
                      <ArrowUpOutlined
                        style={{ color: "#2D6A4F", fontSize: 12 }}
                      />
                    ) : (
                      <ArrowDownOutlined
                        style={{ color: "#E63946", fontSize: 12 }}
                      />
                    )}
                    <Text
                      style={{
                        color: kpi.changeType === "up" ? "#2D6A4F" : "#E63946",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {kpi.change}%
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 12 }}>
                      vs bulan lalu
                    </Text>
                  </Space>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${kpi.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {kpi.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Activity Bar Chart */}
        <Col xs={24} lg={14}>
          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Aktivitas Minggu Ini
              </Text>
            }
            extra={
              <Select
                defaultValue="minggu"
                size="small"
                style={{ width: 120 }}
                options={[
                  { value: "minggu", label: "Minggu Ini" },
                  { value: "bulan", label: "Bulan Ini" },
                  { value: "3bulan", label: "3 Bulan" },
                ]}
              />
            }
          >
            <div style={{ height: 250 }}>
              <Column {...columnConfig} />
            </div>
          </Card>
        </Col>

        {/* Tanaman Distribution */}
        <Col xs={24} lg={10}>
          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Distribusi Tanaman
              </Text>
            }
          >
            <div style={{ height: 250 }}>
              <Pie {...pieConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities Table */}
      <Card
        variant="borderless"
        title={
          <Text strong style={{ color: "#F8FAFC" }}>
            Aktivitas Terbaru
          </Text>
        }
        extra={
          <a
            style={{ color: "#22D3EE", fontSize: 13 }}
            href="/dashboard/aktivitas"
          >
            Lihat Semua →
          </a>
        }
      >
        <Table
          columns={columns}
          dataSource={recentActivities}
          pagination={false}
          size="middle"
          id="recent-activities-table"
          onRow={(record) => ({
            onClick: () => {
              window.location.href = `/dashboard/aktivitas/${record.key}`;
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>
    </div>
  );
}

