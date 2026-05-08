"use client";

import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Typography,
  Space,
  Avatar,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;

interface PetaniRow {
  key: string;
  nama: string;
  hp: string;
  wilayah: string;
  jumlahLahan: number;
  totalAktivitas: number;
  lastActive: string;
  status: "aktif" | "tidak_aktif";
}

const petaniData: PetaniRow[] = [
  {
    key: "1",
    nama: "Ahmad Suryadi",
    hp: "0812-3456-7890",
    wilayah: "Subang",
    jumlahLahan: 3,
    totalAktivitas: 45,
    lastActive: "Hari ini",
    status: "aktif",
  },
  {
    key: "2",
    nama: "Siti Aminah",
    hp: "0856-7890-1234",
    wilayah: "Karawang",
    jumlahLahan: 2,
    totalAktivitas: 38,
    lastActive: "Kemarin",
    status: "aktif",
  },
  {
    key: "3",
    nama: "Budi Santoso",
    hp: "0878-1234-5678",
    wilayah: "Indramayu",
    jumlahLahan: 5,
    totalAktivitas: 67,
    lastActive: "2 hari lalu",
    status: "aktif",
  },
  {
    key: "4",
    nama: "Dedi Mulyadi",
    hp: "0813-5678-9012",
    wilayah: "Subang",
    jumlahLahan: 1,
    totalAktivitas: 12,
    lastActive: "7 hari lalu",
    status: "tidak_aktif",
  },
  {
    key: "5",
    nama: "Rina Wati",
    hp: "0857-9012-3456",
    wilayah: "Cirebon",
    jumlahLahan: 2,
    totalAktivitas: 29,
    lastActive: "3 hari lalu",
    status: "aktif",
  },
  {
    key: "6",
    nama: "Hasan Basri",
    hp: "0821-2345-6789",
    wilayah: "Karawang",
    jumlahLahan: 4,
    totalAktivitas: 52,
    lastActive: "Hari ini",
    status: "aktif",
  },
  {
    key: "7",
    nama: "Wati Sulistya",
    hp: "0838-6789-0123",
    wilayah: "Indramayu",
    jumlahLahan: 1,
    totalAktivitas: 8,
    lastActive: "14 hari lalu",
    status: "tidak_aktif",
  },
  {
    key: "8",
    nama: "Eko Prasetyo",
    hp: "0877-0123-4567",
    wilayah: "Cirebon",
    jumlahLahan: 3,
    totalAktivitas: 41,
    lastActive: "Hari ini",
    status: "aktif",
  },
];

const columns: ColumnsType<PetaniRow> = [
  {
    title: "Petani",
    dataIndex: "nama",
    key: "nama",
    render: (text: string) => (
      <Space>
        <Avatar
          style={{ backgroundColor: "#2D6A4F" }}
          icon={<UserOutlined />}
          size={36}
        />
        <Text strong style={{ color: "#F8FAFC" }}>
          {text}
        </Text>
      </Space>
    ),
    sorter: (a, b) => a.nama.localeCompare(b.nama),
  },
  {
    title: "No. HP",
    dataIndex: "hp",
    key: "hp",
    render: (text: string) => (
      <Space>
        <PhoneOutlined style={{ color: "#64748B" }} />
        <Text style={{ color: "#94A3B8" }}>{text}</Text>
      </Space>
    ),
  },
  {
    title: "Wilayah",
    dataIndex: "wilayah",
    key: "wilayah",
    filters: [
      { text: "Subang", value: "Subang" },
      { text: "Karawang", value: "Karawang" },
      { text: "Indramayu", value: "Indramayu" },
      { text: "Cirebon", value: "Cirebon" },
    ],
    onFilter: (value, record) => record.wilayah === value,
    render: (text: string) => <Tag variant="filled">{text}</Tag>,
  },
  {
    title: "Lahan",
    dataIndex: "jumlahLahan",
    key: "jumlahLahan",
    align: "center",
    sorter: (a, b) => a.jumlahLahan - b.jumlahLahan,
  },
  {
    title: "Aktivitas",
    dataIndex: "totalAktivitas",
    key: "totalAktivitas",
    align: "center",
    sorter: (a, b) => a.totalAktivitas - b.totalAktivitas,
  },
  {
    title: "Terakhir Aktif",
    dataIndex: "lastActive",
    key: "lastActive",
    render: (text: string) => <Text style={{ color: "#94A3B8" }}>{text}</Text>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Aktif", value: "aktif" },
      { text: "Tidak Aktif", value: "tidak_aktif" },
    ],
    onFilter: (value, record) => record.status === value,
    render: (status: string) => (
      <Tag color={status === "aktif" ? "green" : "default"}>
        {status === "aktif" ? "Aktif" : "Tidak Aktif"}
      </Tag>
    ),
  },
];

export default function PetaniPage() {
  const [searchText, setSearchText] = useState("");

  const filteredData = petaniData.filter((p) =>
    p.nama.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(petaniData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Petani");
    XLSX.writeFile(wb, "Daftar_Petani_Peta_Tani.xlsx");
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Daftar Petani
        </Title>
        <Text style={{ color: "#94A3B8" }}>
          Kelola dan pantau data petani terdaftar
        </Text>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Total Petani
                </Text>
              }
              value={245}
              styles={{ content: { color: "#F8FAFC", fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>Aktif</Text>
              }
              value={198}
              styles={{ content: { color: "#2D6A4F", fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Tidak Aktif
                </Text>
              }
              value={47}
              styles={{ content: { color: "#E63946", fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Baru Bulan Ini
                </Text>
              }
              value={12}
              styles={{ content: { color: "#22D3EE", fontSize: 20 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter & Actions */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Space wrap>
            <Input
              placeholder="Cari petani..."
              prefix={<SearchOutlined style={{ color: "#64748B" }} />}
              style={{ width: 240 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              id="search-petani"
            />
            <Select
              placeholder="Wilayah"
              style={{ width: 150 }}
              allowClear
              options={[
                { value: "Subang", label: "Subang" },
                { value: "Karawang", label: "Karawang" },
                { value: "Indramayu", label: "Indramayu" },
                { value: "Cirebon", label: "Cirebon" },
              ]}
            />
          </Space>
          <Button
            icon={<DownloadOutlined />}
            id="export-petani"
            onClick={handleExport}
          >
            Ekspor Excel
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card variant="borderless">
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} petani`,
          }}
          size="middle"
          id="petani-table"
          onRow={(record) => ({
            onClick: () => {
              window.location.href = `/dashboard/petani/${record.key}`;
            },
            style: { cursor: "pointer" },
          })}
        />
      </Card>
    </div>
  );
}

