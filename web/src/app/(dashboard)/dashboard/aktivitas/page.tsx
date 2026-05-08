"use client";

import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  ClockCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import * as XLSX from "xlsx";
import { Button } from "antd";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AktivitasRow {
  key: string;
  petani: string;
  lahan: string;
  jenis: string;
  tanaman: string;
  catatan: string;
  tanggal: string;
  tanggalSelesai: string | null;
  waktu: string;
  status: "berjalan" | "selesai";
}

const aktivitasData: AktivitasRow[] = [
  {
    key: "1",
    petani: "Pak Ahmad",
    lahan: "Sawah Belakang",
    jenis: "Pemupukan",
    tanaman: "Padi",
    catatan: "Urea 50kg",
    tanggal: "3 Mei 2026",
    tanggalSelesai: null,
    waktu: "08:30",
    status: "berjalan",
  },
  {
    key: "2",
    petani: "Bu Siti",
    lahan: "Kebun Atas",
    jenis: "Penyiraman",
    tanaman: "Jagung",
    catatan: "-",
    tanggal: "3 Mei 2026",
    tanggalSelesai: "3 Mei 2026",
    waktu: "07:15",
    status: "selesai",
  },
  {
    key: "3",
    petani: "Pak Budi",
    lahan: "Ladang Timur",
    jenis: "Olah Tanah",
    tanaman: "Kedelai",
    catatan: "Bajak traktor",
    tanggal: "2 Mei 2026",
    tanggalSelesai: "2 Mei 2026",
    waktu: "06:00",
    status: "selesai",
  },
  {
    key: "4",
    petani: "Pak Dedi",
    lahan: "Sawah Depan",
    jenis: "Penyemaian",
    tanaman: "Padi",
    catatan: "Varietas IR64",
    tanggal: "2 Mei 2026",
    tanggalSelesai: null,
    waktu: "09:00",
    status: "berjalan",
  },
  {
    key: "5",
    petani: "Bu Rina",
    lahan: "Kebun Bawah",
    jenis: "Pengendalian Hama",
    tanaman: "Cabai",
    catatan: "Semprot pestisida",
    tanggal: "1 Mei 2026",
    tanggalSelesai: "1 Mei 2026",
    waktu: "16:00",
    status: "selesai",
  },
  {
    key: "6",
    petani: "Pak Hasan",
    lahan: "Sawah Barat",
    jenis: "Panen",
    tanaman: "Padi",
    catatan: "Hasil 4.2 ton",
    tanggal: "1 Mei 2026",
    tanggalSelesai: "1 Mei 2026",
    waktu: "07:00",
    status: "selesai",
  },
  {
    key: "7",
    petani: "Pak Eko",
    lahan: "Ladang Selatan",
    jenis: "Pemupukan",
    tanaman: "Jagung",
    catatan: "NPK 25kg",
    tanggal: "30 Apr 2026",
    tanggalSelesai: "30 Apr 2026",
    waktu: "08:00",
    status: "selesai",
  },
  {
    key: "8",
    petani: "Bu Wati",
    lahan: "Kebun Atas",
    jenis: "Penyiraman",
    tanaman: "Cabai",
    catatan: "-",
    tanggal: "30 Apr 2026",
    tanggalSelesai: "30 Apr 2026",
    waktu: "06:30",
    status: "selesai",
  },
];

const tagColor: Record<string, string> = {
  Pemupukan: "cyan",
  Penyiraman: "blue",
  "Olah Tanah": "orange",
  Penyemaian: "green",
  "Pengendalian Hama": "red",
  Panen: "gold",
};

const columns: ColumnsType<AktivitasRow> = [
  {
    title: "Tanggal",
    dataIndex: "tanggal",
    key: "tanggal",
    width: 130,
    render: (text: string, record: AktivitasRow) => (
      <div>
        <Text style={{ color: "#F8FAFC", fontSize: 13 }}>{text}</Text>
        <br />
        <Space size={4}>
          <ClockCircleOutlined style={{ color: "#64748B", fontSize: 11 }} />
          <Text style={{ color: "#64748B", fontSize: 11 }}>{record.waktu}</Text>
        </Space>
        {record.tanggalSelesai && (
          <div style={{ marginTop: 4 }}>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>
              Selesai: {record.tanggalSelesai}
            </Text>
          </div>
        )}
      </div>
    ),
  },
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
    title: "Jenis Aktivitas",
    dataIndex: "jenis",
    key: "jenis",
    filters: [
      { text: "Pemupukan", value: "Pemupukan" },
      { text: "Penyiraman", value: "Penyiraman" },
      { text: "Olah Tanah", value: "Olah Tanah" },
      { text: "Penyemaian", value: "Penyemaian" },
      { text: "Pengendalian Hama", value: "Pengendalian Hama" },
      { text: "Panen", value: "Panen" },
    ],
    onFilter: (value, record) => record.jenis === value,
    render: (text: string) => (
      <Tag color={tagColor[text] || "default"}>{text}</Tag>
    ),
  },
  {
    title: "Tanaman",
    dataIndex: "tanaman",
    key: "tanaman",
    filters: [
      { text: "Padi", value: "Padi" },
      { text: "Jagung", value: "Jagung" },
      { text: "Kedelai", value: "Kedelai" },
      { text: "Cabai", value: "Cabai" },
    ],
    onFilter: (value, record) => record.tanaman === value,
    render: (text: string) => <Tag variant="filled">{text}</Tag>,
  },
  {
    title: "Catatan",
    dataIndex: "catatan",
    key: "catatan",
    render: (text: string) => <Text style={{ color: "#94A3B8" }}>{text}</Text>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Berjalan", value: "berjalan" },
      { text: "Selesai", value: "selesai" },
    ],
    onFilter: (value, record) => record.status === value,
    render: (status: string) => (
      <Tag color={status === "selesai" ? "green" : "orange"}>
        {status === "selesai" ? "Selesai" : "Berjalan"}
      </Tag>
    ),
  },
];

export default function AktivitasPage() {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(aktivitasData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log Aktivitas");
    XLSX.writeFile(wb, "Log_Aktivitas_Peta_Tani.xlsx");
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Monitoring Aktivitas
        </Title>
        <Text style={{ color: "#94A3B8" }}>
          Semua aktivitas pertanian dari seluruh petani
        </Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>Hari Ini</Text>
              }
              value={23}
              styles={{ content: { color: "#22D3EE", fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Minggu Ini
                </Text>
              }
              value={156}
              styles={{ content: { color: "#F8FAFC", fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  Pemupukan
                </Text>
              }
              value={42}
              styles={{ content: { color: "#2D6A4F", fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic
              title={
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>Panen</Text>
              }
              value={8}
              styles={{ content: { color: "#E9C46A", fontSize: 20 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space wrap>
            <RangePicker
              placeholder={["Dari Tanggal", "Sampai Tanggal"]}
              style={{ width: 280 }}
            />
            <Select
              placeholder="Jenis Aktivitas"
              style={{ width: 180 }}
              allowClear
              options={[
                { value: "Pemupukan", label: "Pemupukan" },
                { value: "Penyiraman", label: "Penyiraman" },
                { value: "Olah Tanah", label: "Olah Tanah" },
                { value: "Penyemaian", label: "Penyemaian" },
                { value: "Pengendalian Hama", label: "Pengendalian Hama" },
                { value: "Panen", label: "Panen" },
              ]}
            />
            <Select
              placeholder="Tanaman"
              style={{ width: 140 }}
              allowClear
              options={[
                { value: "Padi", label: "Padi" },
                { value: "Jagung", label: "Jagung" },
                { value: "Kedelai", label: "Kedelai" },
                { value: "Cabai", label: "Cabai" },
              ]}
            />
          </Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Ekspor Excel
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card variant="borderless">
        <Table
          columns={columns}
          dataSource={aktivitasData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} aktivitas`,
          }}
          size="middle"
          id="aktivitas-table"
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

