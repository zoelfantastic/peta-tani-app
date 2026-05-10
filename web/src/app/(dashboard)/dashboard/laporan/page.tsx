"use client";

import {
  Card, Typography, Form, Select, DatePicker, Button, Table,
  Tag, Space, message, Empty, Spin, Row, Col, Statistic,
} from "antd";
import { FilePdfOutlined, FileExcelOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeSnapshot } from "@/lib/firebase-utils";
import { JENIS_AKTIVITAS_LABEL, type JenisAktivitas } from "@/types";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AktivitasDoc {
  id: string;
  userId: string;
  lahanId: string;
  lahanName: string;
  type: JenisAktivitas;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  alatYangDigunakan: string | null;
  catatan: string | null;
  biayaBahanBakar: number | null;
  biayaSaprodi: number | null;
  biayaHok: number | null;
  jumlahTenagaKerja: number | null;
  jenisSaprodi: string | null;
  jumlahSaprodi: number | null;
  satuanSaprodi: string | null;
  kebutuhanBahanBakar: number | null;
  jumlahAlatUnit: number | null;
}

interface UserDoc {
  id: string;
  name: string;
  phoneNumber: string;
  wilayah: string;
}

interface LahanDoc {
  id: string;
  userId: string;
  nama: string;
  jenisLahan: string;
  tanaman: string;
  luas: number;
  satuanLuas: string;
}

interface PreviewRow {
  key: string;
  [key: string]: string | number;
}

const JENIS_OPTIONS = [
  { value: "aktivitas", label: "Log Aktivitas Lengkap" },
  { value: "bulanan", label: "Ringkasan Bulanan" },
  { value: "petani", label: "Rekapitulasi Per Petani" },
  { value: "tanaman", label: "Rekapitulasi Per Tanaman" },
  { value: "biaya", label: "Ringkasan Biaya Produksi" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

const rupiahFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function LaporanPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [aktivitasDocs, setAktivitasDocs] = useState<AktivitasDoc[]>([]);
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);
  const [lahanDocs, setLahanDocs] = useState<LahanDoc[]>([]);

  // Preview state
  const [previewColumns, setPreviewColumns] = useState<ColumnsType<PreviewRow>>([]);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [previewTitle, setPreviewTitle] = useState("");
  const [hasPreview, setHasPreview] = useState(false);

  useEffect(() => {
    const unsubA = safeSnapshot(collection(db, "aktivitas"), (snap) => {
      setAktivitasDocs(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId ?? "",
          lahanId: data.lahanId ?? "",
          lahanName: data.lahanName ?? "—",
          type: (data.type ?? data.jenis ?? "olahTanah") as JenisAktivitas,
          tanggalMulai: data.tanggalMulai ?? "",
          tanggalSelesai: data.tanggalSelesai ?? null,
          alatYangDigunakan: data.alatYangDigunakan ?? null,
          catatan: data.catatan ?? null,
          biayaBahanBakar: data.biayaBahanBakar ?? null,
          biayaSaprodi: data.biayaSaprodi ?? null,
          biayaHok: data.biayaHok ?? null,
          jumlahTenagaKerja: data.jumlahTenagaKerja ?? null,
          jenisSaprodi: data.jenisSaprodi ?? null,
          jumlahSaprodi: data.jumlahSaprodi ?? null,
          satuanSaprodi: data.satuanSaprodi ?? null,
          kebutuhanBahanBakar: data.kebutuhanBahanBakar ?? null,
          jumlahAlatUnit: data.jumlahAlatUnit ?? null,
        };
      }));
      setLoading(false);
    });

    const unsubU = safeSnapshot(collection(db, "users"), (snap) => {
      setUserDocs(snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? d.data().nama ?? d.id,
        phoneNumber: d.data().phoneNumber ?? d.data().phone ?? "",
        wilayah: d.data().village ?? d.data().kelurahan ?? d.data().kecamatan ?? d.data().wilayah ?? "",
      })));
    });

    const unsubL = safeSnapshot(collection(db, "lahan"), (snap) => {
      setLahanDocs(snap.docs.map((d) => ({
        id: d.id,
        userId: d.data().userId ?? "",
        nama: d.data().nama ?? d.data().name ?? "—",
        jenisLahan: d.data().jenisLahan ?? d.data().jenis ?? "—",
        tanaman: d.data().jenis_tanaman ?? d.data().tanaman ?? "",
        luas: d.data().luas ?? 0,
        satuanLuas: d.data().satuanLuas ?? "ha",
      })));
    });

    return () => { unsubA(); unsubU(); unsubL(); };
  }, []);

  const wilayahOptions = Array.from(new Set(userDocs.map((u) => u.wilayah).filter(Boolean)))
    .map((w) => ({ value: w, label: w }));

  const filterByRange = (docs: AktivitasDoc[], range: [Dayjs, Dayjs] | null) => {
    if (!range) return docs;
    const from = range[0].startOf("day").toISOString();
    const to = range[1].endOf("day").toISOString();
    return docs.filter((d) => d.tanggalMulai >= from && d.tanggalMulai <= to);
  };

  const filterByWilayah = (docs: AktivitasDoc[], wilayah: string[] | undefined) => {
    if (!wilayah || wilayah.length === 0) return docs;
    const uidSet = new Set(userDocs.filter((u) => wilayah.includes(u.wilayah)).map((u) => u.id));
    return docs.filter((d) => uidSet.has(d.userId));
  };

  const buildLogAktivitas = (docs: AktivitasDoc[], userMap: Record<string, string>, lahanTanamanMap: Record<string, string>) => {
    const columns: ColumnsType<PreviewRow> = [
      { title: "Tanggal", dataIndex: "tanggal", key: "tanggal", width: 110 },
      { title: "Petani", dataIndex: "petani", key: "petani", render: (v) => <Text strong style={{ color: "#F8FAFC" }}>{v}</Text> },
      { title: "Lahan", dataIndex: "lahan", key: "lahan" },
      { title: "Jenis Aktivitas", dataIndex: "jenis", key: "jenis", render: (v) => <Tag color="cyan">{v}</Tag> },
      { title: "Alat", dataIndex: "alat", key: "alat", render: (v) => v !== "—" ? <Tag color="orange">{v}</Tag> : <Text style={{ color: "#475569" }}>—</Text> },
      { title: "Tanaman", dataIndex: "tanaman", key: "tanaman" },
      { title: "Total Biaya", dataIndex: "totalBiaya", key: "totalBiaya" },
      { title: "Status", dataIndex: "status", key: "status", render: (v) => <Tag color={v === "Selesai" ? "green" : "orange"}>{v}</Tag> },
    ];
    const data: PreviewRow[] = docs.map((d) => ({
      key: d.id,
      tanggal: fmtDate(d.tanggalMulai),
      petani: userMap[d.userId] ?? d.userId,
      lahan: d.lahanName,
      jenis: JENIS_AKTIVITAS_LABEL[d.type] ?? d.type,
      alat: d.alatYangDigunakan ?? "—",
      tanaman: lahanTanamanMap[d.lahanId] ?? "—",
      totalBiaya: rupiahFmt.format((d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0)),
      status: d.tanggalSelesai ? "Selesai" : "Berjalan",
    }));
    return { columns, data };
  };

  const buildBulanan = (docs: AktivitasDoc[]) => {
    const monthMap: Record<string, Record<string, number>> = {};
    docs.forEach((d) => {
      const tgl = d.tanggalMulai;
      if (!tgl) return;
      const key = tgl.slice(0, 7); // YYYY-MM
      if (!monthMap[key]) monthMap[key] = {};
      const label = JENIS_AKTIVITAS_LABEL[d.type] ?? d.type;
      monthMap[key][label] = (monthMap[key][label] ?? 0) + 1;
      monthMap[key]["Total"] = (monthMap[key]["Total"] ?? 0) + 1;
    });
    const allJenis = (Object.keys(JENIS_AKTIVITAS_LABEL) as JenisAktivitas[]).map((k) => JENIS_AKTIVITAS_LABEL[k]);
    const columns: ColumnsType<PreviewRow> = [
      { title: "Bulan", dataIndex: "bulan", key: "bulan", render: (v) => <Text strong style={{ color: "#F8FAFC" }}>{v}</Text> },
      ...allJenis.map((j) => ({ title: j, dataIndex: j, key: j, align: "center" as const })),
      { title: "Total", dataIndex: "Total", key: "Total", align: "center" as const, render: (v) => <Text strong style={{ color: "#22D3EE" }}>{v}</Text> },
    ];
    const data: PreviewRow[] = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, counts]) => {
        const [year, month] = key.split("-");
        return {
          key,
          bulan: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
          ...Object.fromEntries(allJenis.map((j) => [j, counts[j] ?? 0])),
          Total: counts["Total"] ?? 0,
        };
      });
    return { columns, data };
  };

  const buildPerPetani = (docs: AktivitasDoc[], userMap: Record<string, UserDoc>) => {
    const petaniMap: Record<string, { nama: string; hp: string; wilayah: string; counts: Record<string, number>; biaya: number }> = {};
    docs.forEach((d) => {
      if (!petaniMap[d.userId]) {
        const u = userMap[d.userId];
        petaniMap[d.userId] = { nama: u?.name ?? d.userId, hp: u?.phoneNumber ?? "", wilayah: u?.wilayah ?? "", counts: {}, biaya: 0 };
      }
      const label = JENIS_AKTIVITAS_LABEL[d.type] ?? d.type;
      petaniMap[d.userId].counts[label] = (petaniMap[d.userId].counts[label] ?? 0) + 1;
      petaniMap[d.userId].counts["Total"] = (petaniMap[d.userId].counts["Total"] ?? 0) + 1;
      petaniMap[d.userId].biaya += (d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0);
    });
    const columns: ColumnsType<PreviewRow> = [
      { title: "Petani", dataIndex: "nama", key: "nama", render: (v) => <Text strong style={{ color: "#F8FAFC" }}>{v}</Text> },
      { title: "No. HP", dataIndex: "hp", key: "hp" },
      { title: "Wilayah", dataIndex: "wilayah", key: "wilayah", render: (v) => v ? <Tag variant="filled">{v}</Tag> : "—" },
      { title: "Total Aktivitas", dataIndex: "Total", key: "Total", align: "center" as const, render: (v) => <Text strong style={{ color: "#22D3EE" }}>{v}</Text> },
      { title: "Total Biaya", dataIndex: "biaya", key: "biaya" },
    ];
    const data: PreviewRow[] = Object.entries(petaniMap).map(([uid, p]) => ({
      key: uid, nama: p.nama, hp: p.hp || "—", wilayah: p.wilayah,
      Total: p.counts["Total"] ?? 0,
      biaya: rupiahFmt.format(p.biaya),
    }));
    return { columns, data };
  };

  const buildPerTanaman = (docs: AktivitasDoc[], lahanTanamanMap: Record<string, string>) => {
    const tanamanMap: Record<string, { panen: number; total: number; biaya: number }> = {};
    docs.forEach((d) => {
      const tanaman = lahanTanamanMap[d.lahanId] || "Tidak Diketahui";
      if (!tanamanMap[tanaman]) tanamanMap[tanaman] = { panen: 0, total: 0, biaya: 0 };
      tanamanMap[tanaman].total++;
      if (d.type === "panen") tanamanMap[tanaman].panen++;
      tanamanMap[tanaman].biaya += (d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0);
    });
    const columns: ColumnsType<PreviewRow> = [
      { title: "Tanaman", dataIndex: "tanaman", key: "tanaman", render: (v) => <Tag variant="filled">{v}</Tag> },
      { title: "Total Aktivitas", dataIndex: "total", key: "total", align: "center" as const },
      { title: "Jumlah Panen", dataIndex: "panen", key: "panen", align: "center" as const, render: (v) => <Text style={{ color: "#E9C46A" }}>{v}</Text> },
      { title: "Total Biaya", dataIndex: "biaya", key: "biaya" },
    ];
    const data: PreviewRow[] = Object.entries(tanamanMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([tanaman, val]) => ({
        key: tanaman, tanaman, total: val.total, panen: val.panen, biaya: rupiahFmt.format(val.biaya),
      }));
    return { columns, data };
  };

  const buildBiaya = (docs: AktivitasDoc[], userMap: Record<string, string>) => {
    const columns: ColumnsType<PreviewRow> = [
      { title: "Tanggal", dataIndex: "tanggal", key: "tanggal", width: 110 },
      { title: "Petani", dataIndex: "petani", key: "petani", render: (v) => <Text strong style={{ color: "#F8FAFC" }}>{v}</Text> },
      { title: "Lahan", dataIndex: "lahan", key: "lahan" },
      { title: "Jenis", dataIndex: "jenis", key: "jenis", render: (v) => <Tag color="cyan">{v}</Tag> },
      { title: "Biaya BBM", dataIndex: "biayaBBM", key: "biayaBBM" },
      { title: "Biaya Saprodi", dataIndex: "biayaSaprodi", key: "biayaSaprodi" },
      { title: "Biaya HOK", dataIndex: "biayaHok", key: "biayaHok" },
      { title: "Total", dataIndex: "total", key: "total", render: (v) => <Text strong style={{ color: "#22D3EE" }}>{v}</Text> },
    ];
    const data: PreviewRow[] = docs
      .filter((d) => (d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0) > 0)
      .map((d) => ({
        key: d.id,
        tanggal: fmtDate(d.tanggalMulai),
        petani: userMap[d.userId] ?? d.userId,
        lahan: d.lahanName,
        jenis: JENIS_AKTIVITAS_LABEL[d.type] ?? d.type,
        biayaBBM: d.biayaBahanBakar ? rupiahFmt.format(d.biayaBahanBakar) : "—",
        biayaSaprodi: d.biayaSaprodi ? rupiahFmt.format(d.biayaSaprodi) : "—",
        biayaHok: d.biayaHok ? rupiahFmt.format(d.biayaHok) : "—",
        total: rupiahFmt.format((d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0)),
      }));
    return { columns, data };
  };

  const handleGenerate = async (download = false) => {
    try {
      await form.validateFields();
    } catch { return; }

    const values = form.getFieldsValue();
    const jenisLaporan: string = values.jenis;
    const range: [Dayjs, Dayjs] | null = values.rentang ?? null;
    const wilayah: string[] | undefined = values.wilayah;

    setGenerating(true);

    const userMap = Object.fromEntries(userDocs.map((u) => [u.id, u.name]));
    const userDocMap = Object.fromEntries(userDocs.map((u) => [u.id, u]));
    const lahanTanamanMap = Object.fromEntries(lahanDocs.map((l) => [l.id, l.tanaman]));

    let filtered = filterByRange(aktivitasDocs, range);
    filtered = filterByWilayah(filtered, wilayah);

    let result: { columns: ColumnsType<PreviewRow>; data: PreviewRow[] };
    let sheetName = "Laporan";
    let title = "";

    if (jenisLaporan === "aktivitas") {
      result = buildLogAktivitas(filtered, userMap, lahanTanamanMap);
      sheetName = "Log Aktivitas";
      title = "Log Aktivitas Lengkap";
    } else if (jenisLaporan === "bulanan") {
      result = buildBulanan(filtered);
      sheetName = "Ringkasan Bulanan";
      title = "Ringkasan Bulanan";
    } else if (jenisLaporan === "petani") {
      result = buildPerPetani(filtered, userDocMap);
      sheetName = "Per Petani";
      title = "Rekapitulasi Per Petani";
    } else if (jenisLaporan === "tanaman") {
      result = buildPerTanaman(filtered, lahanTanamanMap);
      sheetName = "Per Tanaman";
      title = "Rekapitulasi Per Tanaman";
    } else {
      result = buildBiaya(filtered, userMap);
      sheetName = "Biaya Produksi";
      title = "Ringkasan Biaya Produksi";
    }

    const rangeStr = range
      ? `${range[0].format("DD MMM YYYY")} – ${range[1].format("DD MMM YYYY")}`
      : "Semua Waktu";

    setPreviewColumns(result.columns);
    setPreviewData(result.data);
    setPreviewTitle(`${title} | ${rangeStr}`);
    setHasPreview(true);

    if (download) {
      const exportData = result.data.map((row) => {
        const clean: Record<string, unknown> = {};
        Object.entries(row).forEach(([k, v]) => { if (k !== "key") clean[k] = v; });
        return clean;
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${sheetName}_PetaTani_${Date.now()}.xlsx`);
      message.success("Laporan berhasil diunduh!");
    }

    setGenerating(false);
  };

  // Quick stats
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const bulanIni = aktivitasDocs.filter((d) => d.tanggalMulai.startsWith(thisMonthPrefix)).length;
  const totalBiayaBulanIni = aktivitasDocs
    .filter((d) => d.tanggalMulai.startsWith(thisMonthPrefix))
    .reduce((s, d) => s + (d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Laporan</Title>
        <Text style={{ color: "#94A3B8" }}>Buat dan unduh laporan pertanian</Text>
      </div>

      <Spin spinning={loading}>
        {/* Quick stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card variant="borderless" size="small">
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Aktivitas</Text>}
                value={aktivitasDocs.length} styles={{ content: { color: "#F8FAFC", fontSize: 20 } }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card variant="borderless" size="small">
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Petani</Text>}
                value={userDocs.length} styles={{ content: { color: "#22D3EE", fontSize: 20 } }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card variant="borderless" size="small">
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Aktivitas Bulan Ini</Text>}
                value={bulanIni} styles={{ content: { color: "#E9C46A", fontSize: 20 } }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card variant="borderless" size="small">
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Biaya Bulan Ini</Text>}
                value={rupiahFmt.format(totalBiayaBulanIni)}
                styles={{ content: { color: "#2D6A4F", fontSize: 18 } }} />
            </Card>
          </Col>
        </Row>

        {/* Report Builder */}
        <Card variant="borderless" style={{ marginBottom: 24 }}
          title={<Text strong style={{ color: "#F8FAFC" }}>Buat Laporan</Text>}>
          <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="jenis"
                  label={<Text style={{ color: "#94A3B8" }}>Jenis Laporan</Text>}
                  rules={[{ required: true, message: "Pilih jenis laporan" }]}
                >
                  <Select placeholder="Pilih jenis laporan" options={JENIS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="rentang"
                  label={<Text style={{ color: "#94A3B8" }}>Rentang Waktu</Text>}
                >
                  <RangePicker style={{ width: "100%" }} placeholder={["Dari", "Sampai"]} />
                </Form.Item>
              </Col>
            </Row>
            {wilayahOptions.length > 0 && (
              <Form.Item name="wilayah" label={<Text style={{ color: "#94A3B8" }}>Wilayah (Opsional)</Text>}>
                <Select placeholder="Semua wilayah" allowClear mode="multiple" options={wilayahOptions} />
              </Form.Item>
            )}
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  loading={generating}
                  style={{ background: "linear-gradient(135deg, #2D6A4F, #40916C)", border: "none" }}
                  onClick={() => handleGenerate(false)}
                >
                  Pratinjau
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={generating}
                  onClick={() => handleGenerate(true)}
                >
                  Unduh Excel
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  style={{ color: "#E76F51", borderColor: "#E76F51" }}
                  onClick={() => message.info("Fitur PDF akan segera hadir!")}
                >
                  Unduh PDF
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Preview */}
        <Card
          variant="borderless"
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ color: "#F8FAFC" }}>
                {hasPreview ? previewTitle : "Pratinjau Laporan"}
              </Text>
              {hasPreview && (
                <Text style={{ color: "#64748B", fontSize: 12 }}>
                  {previewData.length} baris
                </Text>
              )}
            </div>
          }
        >
          {hasPreview ? (
            <Table
              columns={previewColumns}
              dataSource={previewData}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} baris` }}
              size="middle"
              scroll={{ x: true }}
            />
          ) : (
            <Empty
              description={
                <Text style={{ color: "#475569" }}>
                  Pilih jenis laporan lalu klik <b>Pratinjau</b> untuk melihat data
                </Text>
              }
              style={{ padding: "40px 0" }}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
}
