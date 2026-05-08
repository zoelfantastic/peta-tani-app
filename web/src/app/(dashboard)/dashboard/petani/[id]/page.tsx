"use client";

import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Avatar,
  Row,
  Col,
  Button,
  Tabs,
} from "antd";
import {
  UserOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

// Mock Data
const petaniDetail = {
  id: "1",
  nama: "Ahmad Suryadi",
  hp: "0812-3456-7890",
  wilayah: "Subang",
  bergabung: "15 Jan 2025",
  status: "aktif",
};

interface LahanRow {
  key: string;
  nama: string;
  luas: string;
  tanaman: string;
  fase: string;
}

const lahanData: LahanRow[] = [
  { key: "1", nama: "Sawah Belakang", luas: "2 Ha", tanaman: "Padi", fase: "Vegetatif" },
  { key: "2", nama: "Kebun Atas", luas: "0.5 Ha", tanaman: "Jagung", fase: "Generatif" },
  { key: "3", nama: "Ladang Timur", luas: "3 Ha", tanaman: "Kedelai", fase: "Pematangan" },
];

interface AktivitasRow {
  key: string;
  lahan: string;
  jenis: string;
  tanggal: string;
  status: "berjalan" | "selesai";
}

const aktivitasData: AktivitasRow[] = [
  { key: "1", lahan: "Sawah Belakang", jenis: "Pemupukan", tanggal: "3 Mei 2026", status: "berjalan" },
  { key: "2", lahan: "Kebun Atas", jenis: "Penyiraman", tanggal: "1 Mei 2026", status: "selesai" },
  { key: "3", lahan: "Ladang Timur", jenis: "Olah Tanah", tanggal: "28 Apr 2026", status: "selesai" },
  { key: "4", lahan: "Sawah Belakang", jenis: "Penyemaian", tanggal: "15 Apr 2026", status: "selesai" },
];

const lahanColumns: ColumnsType<LahanRow> = [
  {
    title: "Nama Lahan",
    dataIndex: "nama",
    key: "nama",
    render: (text: string) => <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>,
  },
  { title: "Luas", dataIndex: "luas", key: "luas" },
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
    render: (text: string) => <Tag color="blue">{text}</Tag>,
  },
];

const aktivitasColumns: ColumnsType<AktivitasRow> = [
  {
    title: "Tanggal",
    dataIndex: "tanggal",
    key: "tanggal",
    render: (text: string) => <Text style={{ color: "#F8FAFC" }}>{text}</Text>,
  },
  {
    title: "Lahan",
    dataIndex: "lahan",
    key: "lahan",
  },
  {
    title: "Aktivitas",
    dataIndex: "jenis",
    key: "jenis",
    render: (text: string) => <Tag color="cyan">{text}</Tag>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <Tag color={status === "selesai" ? "green" : "orange"}>
        {status === "selesai" ? "Selesai" : "Berjalan"}
      </Tag>
    ),
  },
];

export default function DetailPetaniPage() {
  const router = useRouter();

  const items = [
    {
      key: "lahan",
      label: "Daftar Lahan",
      children: (
        <Table
          columns={lahanColumns}
          dataSource={lahanData}
          pagination={false}
          size="middle"
        />
      ),
    },
    {
      key: "aktivitas",
      label: "Riwayat Aktivitas",
      children: (
        <Table
          columns={aktivitasColumns}
          dataSource={aktivitasData}
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ color: "#94A3B8", marginBottom: 16, padding: 0 }}
        >
          Kembali ke Daftar Petani
        </Button>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Detail Petani
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ textAlign: "center" }}>
            <Avatar size={80} style={{ backgroundColor: "#2D6A4F", marginBottom: 16 }} icon={<UserOutlined />} />
            <Title level={5} style={{ margin: 0, color: "#F8FAFC" }}>{petaniDetail.nama}</Title>
            <Tag color={petaniDetail.status === "aktif" ? "green" : "default"} style={{ marginTop: 8 }}>
              {petaniDetail.status === "aktif" ? "Aktif" : "Tidak Aktif"}
            </Tag>
            
            <Descriptions column={1} style={{ marginTop: 24, textAlign: "left" }} size="small">
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><PhoneOutlined /> No. HP</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{petaniDetail.hp}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><EnvironmentOutlined /> Wilayah</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{petaniDetail.wilayah}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><CalendarOutlined /> Bergabung</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{petaniDetail.bergabung}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card variant="borderless">
            <Tabs defaultActiveKey="lahan" items={items} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
