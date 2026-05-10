"use client";

import { Typography, Button, Empty } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title } = Typography;

export default function DetailPetaniClient() {
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
          Kembali ke Daftar Petani
        </Button>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Detail Petani
        </Title>
      </div>
      <Empty description="Data petani tidak ditemukan" style={{ color: "#94A3B8", marginTop: 64 }} />
    </div>
  );
}
