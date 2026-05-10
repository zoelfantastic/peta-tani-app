"use client";

import {
  Card, Table, Tag, Typography, Space, Select, Row, Col,
  Statistic, Tooltip, Empty, Spin, Drawer, Descriptions,
} from "antd";
import { AimOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { JenisLahan } from "@/types";
import { useEffect, useState } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeSnapshot } from "@/lib/firebase-utils";
import { JENIS_AKTIVITAS_LABEL, type JenisAktivitas } from "@/types";

const { Title, Text } = Typography;

interface LahanRow {
  key: string;
  nama: string;
  pemilik: string;
  tanaman: string;
  jenisLahan: JenisLahan;
  luas: number;
  satuanLuas: string;
  emoji: string;
  hasGps: boolean;
}

const jenisLahanColor: Record<JenisLahan, string> = {
  Sawah: "blue",
  Kebun: "green",
  Pekarangan: "cyan",
  Hutan: "lime",
};

const jenisLahanEmoji: Record<string, string> = {
  Sawah: "🌾",
  Kebun: "🌿",
  Pekarangan: "🏡",
  Hutan: "🌳",
};

const columns: ColumnsType<LahanRow> = [
  {
    title: "Nama Lahan",
    dataIndex: "nama",
    key: "nama",
    render: (text: string, record: LahanRow) => (
      <Space>
        <Text style={{ fontSize: 18 }}>{record.emoji}</Text>
        <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>
      </Space>
    ),
  },
  { title: "Pemilik", dataIndex: "pemilik", key: "pemilik" },
  {
    title: "Tanaman",
    dataIndex: "tanaman",
    key: "tanaman",
    render: (text: string) => text ? <Tag variant="filled">{text}</Tag> : <Text style={{ color: "#475569" }}>—</Text>,
  },
  {
    title: "Jenis Lahan",
    dataIndex: "jenisLahan",
    key: "jenisLahan",
    filters: [
      { text: "Sawah", value: "Sawah" },
      { text: "Kebun", value: "Kebun" },
      { text: "Pekarangan", value: "Pekarangan" },
      { text: "Hutan", value: "Hutan" },
    ],
    onFilter: (value, record) => record.jenisLahan === value,
    render: (jenis: JenisLahan) => (
      <Tag color={jenisLahanColor[jenis] ?? "default"}>{jenis}</Tag>
    ),
  },
  {
    title: "Luas",
    key: "luas",
    render: (_: unknown, record: LahanRow) => (
      <Text style={{ color: "#F8FAFC" }}>{record.luas} {record.satuanLuas}</Text>
    ),
  },
  {
    title: "GPS",
    dataIndex: "hasGps",
    key: "hasGps",
    align: "center" as const,
    render: (has: boolean) =>
      has ? (
        <Tooltip title="Koordinat tersedia">
          <AimOutlined style={{ color: "#22D3EE", fontSize: 16 }} />
        </Tooltip>
      ) : (
        <Text style={{ color: "#475569", fontSize: 12 }}>—</Text>
      ),
  },
];

interface DrawerLahan extends LahanRow {
  userId: string;
  tanggalDibuat: string;
  catatan: string;
  lat: number | null;
  lng: number | null;
}

interface AktivitasLahanItem {
  key: string;
  jenis: string;
  tanggal: string;
  tanggalRaw: string;
  status: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

export default function LahanPage() {
  const [lahanData, setLahanData] = useState<LahanRow[]>([]);
  const [lahanRaw, setLahanRaw] = useState<Record<string, DrawerLahan>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLahan, setSelectedLahan] = useState<DrawerLahan | null>(null);
  const [drawerAktivitas, setDrawerAktivitas] = useState<AktivitasLahanItem[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    const uMap: Record<string, string> = {};
    const unsubUsers = safeSnapshot(collection(db, "users"), (snap) => {
      snap.docs.forEach((d) => { uMap[d.id] = d.data().name ?? d.data().nama ?? d.id; });
      setUserMap({ ...uMap });
    });

    const unsubLahan = safeSnapshot(collection(db, "lahan"), (snap) => {
      const raw: Record<string, DrawerLahan> = {};
      const rows: LahanRow[] = snap.docs.map((d) => {
        const data = d.data();
        const jenis = (data.jenisLahan ?? data.jenis ?? "Sawah") as JenisLahan;
        const lat = data.latitude ?? data.lat ?? null;
        const lng = data.longitude ?? data.lng ?? null;
        const row: LahanRow = {
          key: d.id,
          nama: data.nama ?? data.name ?? "—",
          pemilik: uMap[data.userId] ?? data.userId ?? "—",
          tanaman: data.jenis_tanaman ?? data.tanaman ?? data.tanamanJenis ?? "",
          jenisLahan: jenis,
          luas: data.luas ?? 0,
          satuanLuas: data.satuanLuas ?? data.satuan ?? "ha",
          emoji: jenisLahanEmoji[jenis] ?? "🌾",
          hasGps: lat != null && lng != null,
        };
        raw[d.id] = { ...row, userId: data.userId ?? "", tanggalDibuat: data.createdAt ?? data.tanggalDibuat ?? "", catatan: data.catatan ?? "", lat, lng };
        return row;
      });
      setLahanData(rows);
      setLahanRaw(raw);
      setLoading(false);
    });

    return () => { unsubUsers(); unsubLahan(); };
  }, []);

  const openDrawer = (record: LahanRow) => {
    const raw = lahanRaw[record.key];
    if (!raw) return;
    setSelectedLahan({ ...raw, pemilik: userMap[raw.userId] ?? raw.userId ?? "—" });
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerAktivitas([]);

    const q = query(collection(db, "aktivitas"), where("lahanId", "==", record.key));
    const unsub = safeSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({
          key: d.id,
          jenis: JENIS_AKTIVITAS_LABEL[(d.data().type ?? d.data().jenis) as JenisAktivitas] ?? d.data().type ?? "—",
          tanggal: fmtDate(d.data().tanggalMulai),
          tanggalRaw: d.data().tanggalMulai ?? "",
          status: d.data().tanggalSelesai ? "selesai" : "berjalan",
        }))
        .sort((a, b) => b.tanggalRaw.localeCompare(a.tanggalRaw));
      setDrawerAktivitas(items);
      setDrawerLoading(false);
      unsub();
    });
  };

  const filtered = filterJenis
    ? lahanData.filter((l) => l.jenisLahan === filterJenis)
    : lahanData;

  const sawahCount = lahanData.filter((l) => l.jenisLahan === "Sawah").length;
  const kebunCount = lahanData.filter((l) => l.jenisLahan === "Kebun").length;
  const gpsCount = lahanData.filter((l) => l.hasGps).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Monitoring Lahan</Title>
        <Text style={{ color: "#94A3B8" }}>Data seluruh lahan yang terdaftar</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Lahan</Text>}
              value={lahanData.length} styles={{ content: { color: "#F8FAFC", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Sawah</Text>}
              value={sawahCount} styles={{ content: { color: "#2D6A4F", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Kebun</Text>}
              value={kebunCount} styles={{ content: { color: "#22D3EE", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Dengan GPS</Text>}
              value={gpsCount} styles={{ content: { color: "#E9C46A", fontSize: 20 } }} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="Jenis Lahan" style={{ width: 150 }} allowClear
            onChange={(val) => setFilterJenis(val ?? null)}
            options={[
              { value: "Sawah", label: "Sawah" },
              { value: "Kebun", label: "Kebun" },
              { value: "Pekarangan", label: "Pekarangan" },
              { value: "Hutan", label: "Hutan" },
            ]}
          />
        </Space>
      </Card>

      <Card variant="borderless">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} lahan` }}
            size="middle"
            locale={{ emptyText: <Empty description="Belum ada data lahan" /> }}
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
            <Text style={{ fontSize: 24 }}>{selectedLahan?.emoji}</Text>
            <div>
              <div style={{ color: "#F8FAFC", fontWeight: 600 }}>{selectedLahan?.nama}</div>
              <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 400 }}>
                <Tag color={jenisLahanColor[selectedLahan?.jenisLahan ?? "Sawah"]}>{selectedLahan?.jenisLahan}</Tag>
              </div>
            </div>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
      >
        <Spin spinning={drawerLoading}>
          <Descriptions column={1} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label={<Space><UserOutlined /> Pemilik</Space>}>
              <Text style={{ color: "#F8FAFC" }}>{selectedLahan?.pemilik}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tanaman">
              <Text style={{ color: "#F8FAFC" }}>{selectedLahan?.tanaman || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Luas">
              <Text style={{ color: "#F8FAFC" }}>{selectedLahan?.luas} {selectedLahan?.satuanLuas}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><EnvironmentOutlined /> GPS</Space>}>
              {selectedLahan?.hasGps
                ? <Text style={{ color: "#22D3EE" }}>{selectedLahan.lat?.toFixed(6)}, {selectedLahan.lng?.toFixed(6)}</Text>
                : <Text style={{ color: "#475569" }}>Tidak tersedia</Text>}
            </Descriptions.Item>
            {selectedLahan?.catatan && (
              <Descriptions.Item label="Catatan">
                <Text style={{ color: "#94A3B8" }}>{selectedLahan.catatan}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Title level={5} style={{ color: "#F8FAFC", marginBottom: 12 }}>
            Riwayat Aktivitas ({drawerAktivitas.length})
          </Title>
          {drawerAktivitas.length > 0 ? (
            <div>
              {drawerAktivitas.map((item) => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1E293B" }}>
                  <Space>
                    <Tag color="cyan">{item.jenis}</Tag>
                    <Tag color={item.status === "selesai" ? "green" : "orange"}>{item.status}</Tag>
                  </Space>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>{item.tanggal}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="Belum ada aktivitas di lahan ini" />
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
