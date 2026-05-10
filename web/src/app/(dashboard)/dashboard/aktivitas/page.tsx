"use client";

import {
  Card, Table, Tag, Typography, Space, Select, DatePicker,
  Row, Col, Statistic, Button, Empty, Spin, Drawer, Descriptions, Divider,
} from "antd";
import {
  ClockCircleOutlined, DownloadOutlined, ToolOutlined,
  TeamOutlined, DollarOutlined, FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeSnapshot } from "@/lib/firebase-utils";
import { JENIS_AKTIVITAS_LABEL, type JenisAktivitas } from "@/types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
});

interface AktivitasRow {
  key: string;
  petani: string;
  lahan: string;
  jenis: JenisAktivitas;
  tanaman: string;
  alat: string | null;
  catatan: string | null;
  tanggal: string;
  tanggalSelesai: string | null;
  status: "berjalan" | "selesai";
}

interface AktivitasDetail extends AktivitasRow {
  // Alat
  jumlahAlatUnit: number | null;
  kebutuhanBahanBakar: number | null;
  biayaBahanBakar: number | null;
  // Saprodi
  jenisSaprodi: string | null;
  jumlahSaprodi: number | null;
  satuanSaprodi: string | null;
  biayaSaprodi: number | null;
  // HOK
  jumlahTenagaKerja: number | null;
  biayaHok: number | null;
}

const jenisColor: Record<JenisAktivitas, string> = {
  olahTanah: "volcano",
  persemaian: "green",
  penanaman: "cyan",
  pemupukan: "blue",
  pengendalianOpt: "red",
  penyiangan: "lime",
  panen: "gold",
};

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1E293B" }}>
      <Text style={{ color: "#64748B", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: "#F8FAFC", fontSize: 13 }}>{value}</Text>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 8px" }}>
      <span style={{ color: "#94A3B8" }}>{icon}</span>
      <Text strong style={{ color: "#94A3B8", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{title}</Text>
    </div>
  );
}

const columns: ColumnsType<AktivitasRow> = [
  {
    title: "Tanggal",
    dataIndex: "tanggal",
    key: "tanggal",
    width: 130,
    render: (text: string, record: AktivitasRow) => (
      <div>
        <Text style={{ color: "#F8FAFC", fontSize: 13 }}>{text}</Text>
        {record.tanggalSelesai && (
          <div style={{ marginTop: 2 }}>
            <Space size={4}>
              <ClockCircleOutlined style={{ color: "#64748B", fontSize: 11 }} />
              <Text style={{ color: "#64748B", fontSize: 11 }}>Selesai: {record.tanggalSelesai}</Text>
            </Space>
          </div>
        )}
      </div>
    ),
  },
  {
    title: "Petani",
    dataIndex: "petani",
    key: "petani",
    render: (text: string) => <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>,
  },
  { title: "Lahan", dataIndex: "lahan", key: "lahan" },
  {
    title: "Jenis Aktivitas",
    dataIndex: "jenis",
    key: "jenis",
    filters: (Object.keys(JENIS_AKTIVITAS_LABEL) as JenisAktivitas[]).map((k) => ({
      text: JENIS_AKTIVITAS_LABEL[k], value: k,
    })),
    onFilter: (value, record) => record.jenis === value,
    render: (jenis: JenisAktivitas) => (
      <Tag color={jenisColor[jenis] ?? "default"}>
        {JENIS_AKTIVITAS_LABEL[jenis] ?? jenis}
      </Tag>
    ),
  },
  {
    title: "Alat",
    dataIndex: "alat",
    key: "alat",
    render: (alat: string | null) =>
      alat ? <Tag color="orange">{alat}</Tag> : <Text style={{ color: "#475569" }}>—</Text>,
  },
  {
    title: "Tanaman",
    dataIndex: "tanaman",
    key: "tanaman",
    render: (text: string) => text ? <Tag variant="filled">{text}</Tag> : <Text style={{ color: "#475569" }}>—</Text>,
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
  const [aktivitasData, setAktivitasData] = useState<AktivitasRow[]>([]);
  const [detailMap, setDetailMap] = useState<Record<string, AktivitasDetail>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [lahanMap, setLahanMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<AktivitasDetail | null>(null);

  useEffect(() => {
    const unsub = safeSnapshot(collection(db, "users"), (snap) => {
      const map: Record<string, string> = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().name ?? d.data().nama ?? d.id; });
      setUserMap(map);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = safeSnapshot(collection(db, "lahan"), (snap) => {
      const map: Record<string, string> = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().jenis_tanaman ?? d.data().tanaman ?? ""; });
      setLahanMap(map);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "aktivitas"), orderBy("tanggalMulai", "desc"));
    const unsub = safeSnapshot(q, (snap) => {
      const rows: AktivitasRow[] = [];
      const details: Record<string, AktivitasDetail> = {};

      snap.docs.forEach((d) => {
        const data = d.data();
        const selesai = data.tanggalSelesai ?? null;
        const row: AktivitasRow = {
          key: d.id,
          petani: userMap[data.userId] ?? data.userId ?? "—",
          lahan: data.lahanName ?? "—",
          jenis: (data.type ?? data.jenis ?? "olahTanah") as JenisAktivitas,
          tanaman: lahanMap[data.lahanId] ?? data.tanaman ?? "—",
          alat: data.alatYangDigunakan ?? null,
          catatan: data.catatan ?? null,
          tanggal: fmtDate(data.tanggalMulai) ?? data.tanggalMulai ?? "—",
          tanggalSelesai: fmtDate(selesai),
          status: selesai ? "selesai" : "berjalan",
        };
        rows.push(row);
        details[d.id] = {
          ...row,
          jumlahAlatUnit: data.jumlahAlatUnit ?? null,
          kebutuhanBahanBakar: data.kebutuhanBahanBakar ?? null,
          biayaBahanBakar: data.biayaBahanBakar ?? null,
          jenisSaprodi: data.jenisSaprodi ?? null,
          jumlahSaprodi: data.jumlahSaprodi ?? null,
          satuanSaprodi: data.satuanSaprodi ?? null,
          biayaSaprodi: data.biayaSaprodi ?? null,
          jumlahTenagaKerja: data.jumlahTenagaKerja ?? null,
          biayaHok: data.biayaHok ?? null,
        };
      });

      setAktivitasData(rows);
      setDetailMap(details);
      setLoading(false);
    });
    return unsub;
  }, [userMap, lahanMap]);

  const openDrawer = (record: AktivitasRow) => {
    setSelected(detailMap[record.key] ?? null);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    const exportData = aktivitasData.map((r) => ({
      ...r,
      jenis: JENIS_AKTIVITAS_LABEL[r.jenis] ?? r.jenis,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log Aktivitas");
    XLSX.writeFile(wb, "Log_Aktivitas_Peta_Tani.xlsx");
  };

  const berjalanCount = aktivitasData.filter((a) => a.status === "berjalan").length;
  const panenCount = aktivitasData.filter((a) => a.jenis === "panen").length;

  const totalBiaya = selected
    ? (selected.biayaBahanBakar ?? 0) + (selected.biayaSaprodi ?? 0) + (selected.biayaHok ?? 0)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Monitoring Aktivitas</Title>
        <Text style={{ color: "#94A3B8" }}>Semua aktivitas pertanian dari seluruh petani</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total</Text>}
              value={aktivitasData.length} styles={{ content: { color: "#F8FAFC", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Berjalan</Text>}
              value={berjalanCount} styles={{ content: { color: "#22D3EE", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Panen</Text>}
              value={panenCount} styles={{ content: { color: "#E9C46A", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Olah Tanah</Text>}
              value={aktivitasData.filter((a) => a.jenis === "olahTanah").length}
              styles={{ content: { color: "#2D6A4F", fontSize: 20 } }} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space wrap>
            <RangePicker placeholder={["Dari Tanggal", "Sampai Tanggal"]} style={{ width: 280 }} />
            <Select placeholder="Jenis Aktivitas" style={{ width: 180 }} allowClear
              options={(Object.keys(JENIS_AKTIVITAS_LABEL) as JenisAktivitas[]).map((k) => ({
                value: k, label: JENIS_AKTIVITAS_LABEL[k],
              }))}
            />
            <Select placeholder="Alat" style={{ width: 180 }} allowClear
              options={["Traktor Roda 2","Traktor Roda 4","Transplanter","Sprayer","Drone","Combine Harvester","Manual"]
                .map((a) => ({ value: a, label: a }))}
            />
          </Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Ekspor Excel</Button>
        </div>
      </Card>

      <Card variant="borderless">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={aktivitasData}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} aktivitas` }}
            size="middle"
            locale={{ emptyText: <Empty description="Belum ada data aktivitas" /> }}
            onRow={(record) => ({
              onClick: () => openDrawer(record),
              style: { cursor: "pointer" },
            })}
          />
        </Spin>
      </Card>

      <Drawer
        title={
          <Space>
            <Tag color={jenisColor[selected?.jenis ?? "olahTanah"]} style={{ margin: 0 }}>
              {JENIS_AKTIVITAS_LABEL[selected?.jenis ?? "olahTanah"]}
            </Tag>
            <div>
              <div style={{ color: "#F8FAFC", fontWeight: 600, fontSize: 15 }}>{selected?.lahan}</div>
              <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 400 }}>{selected?.petani}</div>
            </div>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={440}
      >
        {selected && (
          <>
            {/* Info Dasar */}
            <SectionHeader icon={<FileTextOutlined />} title="Info Dasar" />
            <Descriptions column={1} size="small" bordered={false}
              styles={{ label: { color: "#64748B", width: 140 }, content: { color: "#F8FAFC" } }}>
              <Descriptions.Item label="Petani">{selected.petani}</Descriptions.Item>
              <Descriptions.Item label="Lahan">{selected.lahan}</Descriptions.Item>
              <Descriptions.Item label="Tanaman">
                {selected.tanaman ? <Tag variant="filled">{selected.tanaman}</Tag> : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Mulai">{selected.tanggal}</Descriptions.Item>
              <Descriptions.Item label="Tanggal Selesai">{selected.tanggalSelesai ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selected.status === "selesai" ? "green" : "orange"}>
                  {selected.status === "selesai" ? "Selesai" : "Berjalan"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Alat */}
            {selected.alat && (
              <>
                <SectionHeader icon={<ToolOutlined />} title="Alat yang Digunakan" />
                <DetailItem label="Alat" value={<Tag color="orange">{selected.alat}</Tag>} />
                {selected.jumlahAlatUnit != null && (
                  <DetailItem label="Jumlah Unit" value={`${selected.jumlahAlatUnit} unit`} />
                )}
                {selected.kebutuhanBahanBakar != null && (
                  <DetailItem label="Kebutuhan BBM" value={`${selected.kebutuhanBahanBakar} liter`} />
                )}
                {selected.biayaBahanBakar != null && (
                  <DetailItem label="Biaya BBM" value={rupiahFmt.format(selected.biayaBahanBakar)} />
                )}
              </>
            )}

            {/* Saprodi */}
            {selected.jenisSaprodi && (
              <>
                <SectionHeader icon={<span>🌿</span>} title="Saprodi" />
                <DetailItem label="Jenis Saprodi" value={selected.jenisSaprodi} />
                {selected.jumlahSaprodi != null && (
                  <DetailItem
                    label="Jumlah"
                    value={`${selected.jumlahSaprodi}${selected.satuanSaprodi ? ` ${selected.satuanSaprodi}` : ""}`}
                  />
                )}
                {selected.biayaSaprodi != null && (
                  <DetailItem label="Biaya Saprodi" value={rupiahFmt.format(selected.biayaSaprodi)} />
                )}
              </>
            )}

            {/* HOK */}
            {selected.jumlahTenagaKerja != null && (
              <>
                <SectionHeader icon={<TeamOutlined />} title="Tenaga Kerja (HOK)" />
                <DetailItem label="Jumlah Tenaga Kerja" value={`${selected.jumlahTenagaKerja} orang`} />
                {selected.biayaHok != null && (
                  <DetailItem label="Biaya HOK" value={rupiahFmt.format(selected.biayaHok)} />
                )}
              </>
            )}

            {/* Ringkasan Biaya */}
            {totalBiaya > 0 && (
              <>
                <SectionHeader icon={<DollarOutlined />} title="Ringkasan Biaya" />
                {(selected.biayaBahanBakar ?? 0) > 0 && (
                  <DetailItem label="Biaya BBM" value={rupiahFmt.format(selected.biayaBahanBakar!)} />
                )}
                {(selected.biayaSaprodi ?? 0) > 0 && (
                  <DetailItem label="Biaya Saprodi" value={rupiahFmt.format(selected.biayaSaprodi!)} />
                )}
                {(selected.biayaHok ?? 0) > 0 && (
                  <DetailItem label="Biaya HOK" value={rupiahFmt.format(selected.biayaHok!)} />
                )}
                <Divider style={{ margin: "8px 0", borderColor: "#334155" }} />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <Text strong style={{ color: "#F8FAFC" }}>Total Biaya</Text>
                  <Text strong style={{ color: "#22D3EE", fontSize: 15 }}>{rupiahFmt.format(totalBiaya)}</Text>
                </div>
              </>
            )}

            {/* Catatan */}
            {selected.catatan && (
              <>
                <SectionHeader icon={<FileTextOutlined />} title="Catatan" />
                <div style={{ background: "#1E293B", borderRadius: 8, padding: "10px 12px" }}>
                  <Text style={{ color: "#94A3B8", fontSize: 13 }}>{selected.catatan}</Text>
                </div>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
