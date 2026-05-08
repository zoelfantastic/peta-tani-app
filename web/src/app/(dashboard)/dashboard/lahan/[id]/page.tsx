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
  Progress,
} from "antd";
import {
  EnvironmentOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

// Mock Data
const lahanDetail = {
  id: "1",
  nama: "Sawah Belakang",
  pemilik: "Ahmad Suryadi",
  luas: "2 Ha",
  tanaman: "Padi",
  fase: "Vegetatif",
  tanggalTanam: "15 Mar 2026",
  perkiraanPanen: "Juli 2026",
  progress: 45,
  lokasi: "Subang, Jawa Barat",
};

interface AktivitasRow {
  key: string;
  petani: string;
  jenis: string;
  tanggal: string;
  status: "berjalan" | "selesai";
}

const aktivitasData: AktivitasRow[] = [
  { key: "1", petani: "Ahmad Suryadi", jenis: "Pemupukan", tanggal: "3 Mei 2026", status: "berjalan" },
  { key: "2", petani: "Ahmad Suryadi", jenis: "Penyiraman", tanggal: "1 Mei 2026", status: "selesai" },
  { key: "3", petani: "Ahmad Suryadi", jenis: "Olah Tanah", tanggal: "28 Apr 2026", status: "selesai" },
  { key: "4", petani: "Ahmad Suryadi", jenis: "Penyemaian", tanggal: "15 Apr 2026", status: "selesai" },
];

const aktivitasColumns: ColumnsType<AktivitasRow> = [
  {
    title: "Tanggal",
    dataIndex: "tanggal",
    key: "tanggal",
    render: (text: string) => <Text style={{ color: "#F8FAFC" }}>{text}</Text>,
  },
  {
    title: "Petani",
    dataIndex: "petani",
    key: "petani",
    render: (text: string) => <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>,
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

export default function DetailLahanPage() {
  const router = useRouter();

  const items = [
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
          Kembali ke Daftar Lahan
        </Button>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Detail Lahan
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ textAlign: "center" }}>
            <Avatar size={80} style={{ backgroundColor: "#2D6A4F", marginBottom: 16 }} icon={<EnvironmentOutlined />} />
            <Title level={5} style={{ margin: 0, color: "#F8FAFC" }}>{lahanDetail.nama}</Title>
            <Tag color="blue" style={{ marginTop: 8 }}>{lahanDetail.tanaman}</Tag>
            
            <div style={{ marginTop: 24, textAlign: "left" }}>
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>Progres Tanam</Text>
              <Progress percent={lahanDetail.progress} strokeColor="#2D6A4F" railColor="#0F172A" />
            </div>

            <Descriptions column={1} style={{ marginTop: 24, textAlign: "left" }} size="small">
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><UserOutlined /> Pemilik</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{lahanDetail.pemilik}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><CompassOutlined /> Luas</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{lahanDetail.luas}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><EnvironmentOutlined /> Lokasi</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{lahanDetail.lokasi}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><CalendarOutlined /> Tanam</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{lahanDetail.tanggalTanam}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><CalendarOutlined /> Perkiraan Panen</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{lahanDetail.perkiraanPanen}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card variant="borderless">
            <Tabs defaultActiveKey="aktivitas" items={items} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
