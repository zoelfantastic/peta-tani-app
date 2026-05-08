"use client";

import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Avatar,
  Row,
  Col,
  Button,
} from "antd";
import {
  FileTextOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

// Mock Data
const aktivitasDetail = {
  id: "1",
  jenis: "Pemupukan",
  petani: "Ahmad Suryadi",
  lahan: "Sawah Belakang",
  tanaman: "Padi",
  tanggal: "3 Mei 2026",
  waktu: "08:30",
  status: "berjalan",
  catatan: "Urea 50kg, disebar merata di bagian timur",
};

export default function DetailAktivitasPage() {
  const router = useRouter();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ color: "#94A3B8", marginBottom: 16, padding: 0 }}
        >
          Kembali ke Daftar Aktivitas
        </Button>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Detail Aktivitas
        </Title>
      </div>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={16}>
          <Card variant="borderless">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <Avatar size={64} style={{ backgroundColor: "#E76F51", marginBottom: 16 }} icon={<FileTextOutlined />} />
              <Title level={5} style={{ margin: 0, color: "#F8FAFC" }}>{aktivitasDetail.jenis}</Title>
              <Tag color={aktivitasDetail.status === "selesai" ? "green" : "orange"} style={{ marginTop: 8 }}>
                {aktivitasDetail.status === "selesai" ? "Selesai" : "Berjalan"}
              </Tag>
            </div>

            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><UserOutlined /> Petani</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{aktivitasDetail.petani}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><EnvironmentOutlined /> Lahan</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{aktivitasDetail.lahan}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><EnvironmentOutlined /> Tanaman</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{aktivitasDetail.tanaman}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><CalendarOutlined /> Tanggal</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{aktivitasDetail.tanggal}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><ClockCircleOutlined /> Waktu</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{aktivitasDetail.waktu}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ color: "#94A3B8" }}><FileTextOutlined /> Catatan</Text>}>
                <Text style={{ color: "#F8FAFC" }}>{aktivitasDetail.catatan}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
