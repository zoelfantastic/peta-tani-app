"use client";

import { Card, Typography, Row, Col, Select, Space, Statistic } from "antd";
import {
  ArrowUpOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import { Column, Pie } from "@ant-design/charts";

const { Title, Text } = Typography;

// Mock chart data
const monthlyTrendData = [
  { bulan: "Jan", value: 320 },
  { bulan: "Feb", value: 450 },
  { bulan: "Mar", value: 380 },
  { bulan: "Apr", value: 520 },
  { bulan: "Mei", value: 610 },
];

const aktivitasBreakdownData = [
  { type: "Pemupukan", value: 245 },
  { type: "Penyiraman", value: 198 },
  { type: "Olah Tanah", value: 156 },
  { type: "Penyemaian", value: 134 },
  { type: "Panen", value: 89 },
  { type: "Pengendalian Hama", value: 67 },
];

interface TrendData {
  bulan: string;
  value: number;
}

export default function AnalitikPage() {
  const columnConfig = {
    data: monthlyTrendData,
    xField: "bulan",
    yField: "value",
    label: {
      text: (d: TrendData) => d.value,
      textBaseline: "bottom",
    },
    style: {
      fill: "linear-gradient(180deg, #22D3EE, #2D6A4F)",
      radiusTopLeft: 6,
      radiusTopRight: 6,
    },
    axis: {
      x: { title: "Bulan" },
      y: { title: "Total Aktivitas" },
    },
  };

  const pieConfig = {
    data: aktivitasBreakdownData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    label: {
      text: "type",
      position: "outside",
    },
    legend: {
      color: {
        title: false,
        position: "right",
        rowPadding: 5,
      },
    },
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
            Analitik
          </Title>
          <Text style={{ color: "#94A3B8" }}>
            Analisa pola dan tren aktivitas pertanian
          </Text>
        </div>
        <Space>
          <Select
            defaultValue="2026"
            style={{ width: 100 }}
            options={[
              { value: "2026", label: "2026" },
              { value: "2025", label: "2025" },
            ]}
          />
          <Select
            defaultValue="semua"
            style={{ width: 160 }}
            options={[
              { value: "semua", label: "Semua Wilayah" },
              { value: "subang", label: "Subang" },
              { value: "karawang", label: "Karawang" },
            ]}
          />
        </Space>
      </div>

      {/* KPI Highlights */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="kpi-card">
            <Space>
              <ExperimentOutlined style={{ fontSize: 24, color: "#22D3EE" }} />
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Pemupukan Minggu Ini
                </Text>
                <Statistic
                  value={42}
                  suffix="kali"
                  styles={{ content: { color: "#F8FAFC", fontSize: 24 } }}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="kpi-card">
            <Space>
              <FieldTimeOutlined style={{ fontSize: 24, color: "#E9C46A" }} />
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Lahan Fase Panen
                </Text>
                <Statistic
                  value={32}
                  suffix="lahan"
                  styles={{ content: { color: "#F8FAFC", fontSize: 24 } }}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="kpi-card">
            <Space>
              <ArrowUpOutlined style={{ fontSize: 24, color: "#2D6A4F" }} />
              <div>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Pertumbuhan Aktivitas
                </Text>
                <Statistic
                  value={23}
                  suffix="%"
                  prefix={<ArrowUpOutlined />}
                  styles={{ content: { color: "#2D6A4F", fontSize: 24 } }}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        {/* Monthly Trend */}
        <Col xs={24} lg={12}>
          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Tren Aktivitas Bulanan
              </Text>
            }
          >
            <div style={{ height: 300 }}>
              <Column {...columnConfig} />
            </div>
          </Card>
        </Col>

        {/* Activity Breakdown */}
        <Col xs={24} lg={12}>
          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Distribusi Jenis Aktivitas
              </Text>
            }
          >
            <div style={{ height: 300 }}>
              <Pie {...pieConfig} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

