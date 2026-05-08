"use client";

import {
  Card,
  Typography,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  message,
} from "antd";
import {
  FilePdfOutlined,
  FileExcelOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface LaporanRow {
  key: string;
  nama: string;
  jenis: string;
  tanggal: string;
  status: "selesai" | "proses";
}

const laporanHistory: LaporanRow[] = [
  {
    key: "1",
    nama: "Ringkasan Bulanan - April 2026",
    jenis: "Bulanan",
    tanggal: "1 Mei 2026",
    status: "selesai",
  },
  {
    key: "2",
    nama: "Laporan Panen Q1 2026",
    jenis: "Kuartal",
    tanggal: "5 Apr 2026",
    status: "selesai",
  },
  {
    key: "3",
    nama: "Aktivitas Per Wilayah - Maret",
    jenis: "Wilayah",
    tanggal: "1 Apr 2026",
    status: "selesai",
  },
];

export default function LaporanPage() {
  const handleExport = (record?: LaporanRow) => {
    const dataToExport = record ? [record] : laporanHistory;
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_Peta_Tani_${new Date().getTime()}.xlsx`);
    message.success("Laporan berhasil diunduh!");
  };

  const columns: ColumnsType<LaporanRow> = [
    {
      title: "Nama Laporan",
      dataIndex: "nama",
      key: "nama",
      render: (text: string) => (
        <Text strong style={{ color: "#F8FAFC" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Jenis",
      dataIndex: "jenis",
      key: "jenis",
      render: (text: string) => <Tag variant="filled">{text}</Tag>,
    },
    {
      title: "Dibuat",
      dataIndex: "tanggal",
      key: "tanggal",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "selesai" ? "green" : "processing"}>
          {status === "selesai" ? "Selesai" : "Diproses"}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<FilePdfOutlined />}
            type="text"
            style={{ color: "#E76F51" }}
            onClick={() => message.info("Fitur PDF akan segera hadir!")}
          >
            PDF
          </Button>
          <Button
            size="small"
            icon={<FileExcelOutlined />}
            type="text"
            style={{ color: "#2D6A4F" }}
            onClick={() => handleExport(record)}
          >
            Excel
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Laporan
        </Title>
        <Text style={{ color: "#94A3B8" }}>
          Buat dan unduh laporan pertanian
        </Text>
      </div>

      {/* Report Builder */}
      <Card
        variant="borderless"
        title={
          <Text strong style={{ color: "#F8FAFC" }}>
            Buat Laporan Baru
          </Text>
        }
        style={{ marginBottom: 24 }}
      >
        <Form layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item
            label={<Text style={{ color: "#94A3B8" }}>Jenis Laporan</Text>}
          >
            <Select
              placeholder="Pilih jenis laporan"
              options={[
                { value: "bulanan", label: "Ringkasan Bulanan" },
                { value: "wilayah", label: "Per Wilayah" },
                { value: "tanaman", label: "Per Tanaman" },
                { value: "petani", label: "Per Petani" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={<Text style={{ color: "#94A3B8" }}>Rentang Waktu</Text>}
          >
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Dari", "Sampai"]}
            />
          </Form.Item>
          <Form.Item
            label={<Text style={{ color: "#94A3B8" }}>Wilayah (Opsional)</Text>}
          >
            <Select
              placeholder="Semua wilayah"
              allowClear
              mode="multiple"
              options={[
                { value: "Subang", label: "Subang" },
                { value: "Karawang", label: "Karawang" },
                { value: "Indramayu", label: "Indramayu" },
                { value: "Cirebon", label: "Cirebon" },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                style={{
                  background: "linear-gradient(135deg, #2D6A4F, #40916C)",
                  border: "none",
                }}
                onClick={() => handleExport()}
              >
                Buat & Unduh Laporan
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Report History */}
      <Card
        variant="borderless"
        title={
          <Text strong style={{ color: "#F8FAFC" }}>
            Riwayat Laporan
          </Text>
        }
      >
        <Table
          columns={columns}
          dataSource={laporanHistory}
          pagination={false}
          size="middle"
          id="laporan-table"
        />
      </Card>
    </div>
  );
}

