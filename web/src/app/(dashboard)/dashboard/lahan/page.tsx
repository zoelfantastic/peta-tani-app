"use client";

import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
} from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface LahanRow {
  key: string;
  nama: string;
  pemilik: string;
  luas: string;
  tanaman: string;
  fase: string;
  tanggalTanam: string;
  progress: number;
}

const lahanData: LahanRow[] = [
  { key: "1", nama: "Sawah Belakang", pemilik: "Pak Ahmad", luas: "2 Ha", tanaman: "Padi", fase: "Vegetatif", tanggalTanam: "15 Mar 2026", progress: 45 },
  { key: "2", nama: "Kebun Atas", pemilik: "Bu Siti", luas: "0.5 Ha", tanaman: "Jagung", fase: "Generatif", tanggalTanam: "1 Feb 2026", progress: 72 },
  { key: "3", nama: "Ladang Timur", pemilik: "Pak Budi", luas: "3 Ha", tanaman: "Kedelai", fase: "Pematangan", tanggalTanam: "10 Jan 2026", progress: 88 },
  { key: "4", nama: "Sawah Depan", pemilik: "Pak Dedi", luas: "1.5 Ha", tanaman: "Padi", fase: "Penyemaian", tanggalTanam: "28 Apr 2026", progress: 12 },
  { key: "5", nama: "Kebun Bawah", pemilik: "Bu Rina", luas: "0.8 Ha", tanaman: "Cabai", fase: "Generatif", tanggalTanam: "20 Feb 2026", progress: 65 },
  { key: "6", nama: "Sawah Barat", pemilik: "Pak Hasan", luas: "2.5 Ha", tanaman: "Padi", fase: "Panen", tanggalTanam: "5 Des 2025", progress: 100 },
];

const faseColor: Record<string, string> = {
  Penyemaian: "blue",
  Vegetatif: "green",
  Generatif: "orange",
  Pematangan: "gold",
  Panen: "red",
};

const columns: ColumnsType<LahanRow> = [
  {
    title: "Nama Lahan",
    dataIndex: "nama",
    key: "nama",
    render: (text: string) => (
      <Space>
        <EnvironmentOutlined style={{ color: "#2D6A4F" }} />
        <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>
      </Space>
    ),
  },
  { title: "Pemilik", dataIndex: "pemilik", key: "pemilik" },
  { title: "Luas", dataIndex: "luas", key: "luas", align: "center" as const },
  {
    title: "Tanaman",
    dataIndex: "tanaman",
    key: "tanaman",
    render: (text: string) => <Tag variant="filled">{text}</Tag>,
  },
  {
    title: "Fase",
    dataIndex: "fase",
    key: "fase",
    render: (text: string) => <Tag color={faseColor[text] || "default"}>{text}</Tag>,
  },
  {
    title: "Progres",
    dataIndex: "progress",
    key: "progress",
    width: 160,
    render: (val: number) => (
      <Progress
        percent={val}
        size="small"
        strokeColor={val === 100 ? "#E9C46A" : "#2D6A4F"}
        railColor="#0F172A"
      />
    ),
  },
  { title: "Tanggal Tanam", dataIndex: "tanggalTanam", key: "tanggalTanam" },
];

export default function LahanPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Monitoring Lahan</Title>
        <Text style={{ color: "#94A3B8" }}>Data seluruh lahan yang terdaftar</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Lahan</Text>} value={580} styles={{ content: { color: "#F8FAFC", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Luas</Text>} value={"1.240 Ha"} styles={{ content: { color: "#2D6A4F", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Siap Panen</Text>} value={32} styles={{ content: { color: "#E9C46A", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Baru Ditanam</Text>} value={18} styles={{ content: { color: "#22D3EE", fontSize: 20 } }} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="Tanaman" style={{ width: 150 }} allowClear
            options={[
              { value: "Padi", label: "Padi" },
              { value: "Jagung", label: "Jagung" },
              { value: "Kedelai", label: "Kedelai" },
              { value: "Cabai", label: "Cabai" },
            ]}
          />
          <Select placeholder="Fase" style={{ width: 150 }} allowClear
            options={[
              { value: "Penyemaian", label: "Penyemaian" },
              { value: "Vegetatif", label: "Vegetatif" },
              { value: "Generatif", label: "Generatif" },
              { value: "Pematangan", label: "Pematangan" },
              { value: "Panen", label: "Panen" },
            ]}
          />
        </Space>
      </Card>

      <Card variant="borderless">
        <Table columns={columns} dataSource={lahanData}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} lahan` }}
          size="middle" id="lahan-table"
          onRow={(record) => ({
            onClick: () => {
              window.location.href = `/dashboard/lahan/${record.key}`;
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
