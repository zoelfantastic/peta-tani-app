"use client";

import {
  Card, Table, Input, Button, Tag, Typography, Space, Avatar,
  Row, Col, Statistic, Empty, Spin, Drawer, Descriptions, List,
} from "antd";
import {
  SearchOutlined, DownloadOutlined, UserOutlined, PhoneOutlined,
  EnvironmentOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeSnapshot } from "@/lib/firebase-utils";
import { JENIS_AKTIVITAS_LABEL, type JenisAktivitas } from "@/types";

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

interface AktivitasItem {
  key: string;
  jenis: string;
  lahan: string;
  tanggal: string;
  tanggalRaw: string;
}

interface LahanItem {
  key: string;
  nama: string;
  jenisLahan: string;
  luas: number;
  satuanLuas: string;
}

const columns: ColumnsType<PetaniRow> = [
  {
    title: "Petani",
    dataIndex: "nama",
    key: "nama",
    render: (text: string) => (
      <Space>
        <Avatar style={{ backgroundColor: "#2D6A4F" }} icon={<UserOutlined />} size={36} />
        <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>
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
        <Text style={{ color: "#94A3B8" }}>{text || "—"}</Text>
      </Space>
    ),
  },
  {
    title: "Wilayah",
    dataIndex: "wilayah",
    key: "wilayah",
    render: (text: string) => text ? <Tag variant="filled">{text}</Tag> : <Text style={{ color: "#475569" }}>—</Text>,
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

export default function PetaniPage() {
  const [petaniData, setPetaniData] = useState<PetaniRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPetani, setSelectedPetani] = useState<PetaniRow | null>(null);
  const [drawerAktivitas, setDrawerAktivitas] = useState<AktivitasItem[]>([]);
  const [drawerLahan, setDrawerLahan] = useState<LahanItem[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    const lahanCount: Record<string, number> = {};
    const unsubLahan = safeSnapshot(collection(db, "lahan"), (snap) => {
      Object.keys(lahanCount).forEach((k) => delete lahanCount[k]);
      snap.docs.forEach((d) => {
        const uid = d.data().userId;
        if (uid) lahanCount[uid] = (lahanCount[uid] ?? 0) + 1;
      });
    });

    const aktivitasCount: Record<string, number> = {};
    const lastAktivitas: Record<string, string> = {};
    const unsubAktivitas = safeSnapshot(collection(db, "aktivitas"), (snap) => {
      Object.keys(aktivitasCount).forEach((k) => delete aktivitasCount[k]);
      Object.keys(lastAktivitas).forEach((k) => delete lastAktivitas[k]);
      snap.docs.forEach((d) => {
        const uid = d.data().userId;
        if (uid) {
          aktivitasCount[uid] = (aktivitasCount[uid] ?? 0) + 1;
          const tgl = d.data().tanggalMulai ?? "";
          if (!lastAktivitas[uid] || tgl > lastAktivitas[uid]) lastAktivitas[uid] = tgl;
        }
      });
    });

    const unsubUsers = safeSnapshot(collection(db, "users"), (snap) => {
      const rows: PetaniRow[] = snap.docs.map((d) => {
        const data = d.data();
        const uid = d.id;
        const last = lastAktivitas[uid];
        return {
          key: uid,
          nama: data.name ?? data.nama ?? uid,
          hp: data.phoneNumber ?? data.phone ?? data.hp ?? "",
          wilayah: data.village ?? data.kelurahan ?? data.kecamatan ?? data.wilayah ?? "",
          jumlahLahan: lahanCount[uid] ?? 0,
          totalAktivitas: aktivitasCount[uid] ?? 0,
          lastActive: fmtDate(last),
          status: (aktivitasCount[uid] ?? 0) > 0 ? "aktif" : "tidak_aktif",
        };
      });
      setPetaniData(rows);
      setLoading(false);
    });

    return () => { unsubLahan(); unsubAktivitas(); unsubUsers(); };
  }, []);

  const openDrawer = (record: PetaniRow) => {
    setSelectedPetani(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerAktivitas([]);
    setDrawerLahan([]);

    const qAktivitas = query(collection(db, "aktivitas"), where("userId", "==", record.key));
    const unsubA = safeSnapshot(qAktivitas, (snap) => {
      const items = snap.docs
        .map((d) => ({
          key: d.id,
          jenis: JENIS_AKTIVITAS_LABEL[(d.data().type ?? d.data().jenis) as JenisAktivitas] ?? d.data().type ?? "—",
          lahan: d.data().lahanName ?? "—",
          tanggal: fmtDate(d.data().tanggalMulai),
          tanggalRaw: d.data().tanggalMulai ?? "",
        }))
        .sort((a, b) => b.tanggalRaw.localeCompare(a.tanggalRaw));
      setDrawerAktivitas(items);
      setDrawerLoading(false);
      unsubA();
    });

    const qLahan = query(collection(db, "lahan"), where("userId", "==", record.key));
    const unsubL = safeSnapshot(qLahan, (snap) => {
      setDrawerLahan(snap.docs.map((d) => ({
        key: d.id,
        nama: d.data().nama ?? d.data().name ?? "—",
        jenisLahan: d.data().jenisLahan ?? d.data().jenis ?? "—",
        luas: d.data().luas ?? 0,
        satuanLuas: d.data().satuanLuas ?? "ha",
      })));
      unsubL();
    });
  };

  const filteredData = petaniData.filter((p) =>
    p.nama.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(petaniData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Petani");
    XLSX.writeFile(wb, "Daftar_Petani_Peta_Tani.xlsx");
  };

  const aktifCount = petaniData.filter((p) => p.status === "aktif").length;
  const tidakAktifCount = petaniData.filter((p) => p.status === "tidak_aktif").length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Daftar Petani</Title>
        <Text style={{ color: "#94A3B8" }}>Kelola dan pantau data petani terdaftar</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Petani</Text>}
              value={petaniData.length} styles={{ content: { color: "#F8FAFC", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Aktif</Text>}
              value={aktifCount} styles={{ content: { color: "#2D6A4F", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Tidak Aktif</Text>}
              value={tidakAktifCount} styles={{ content: { color: "#E63946", fontSize: 20 } }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" size="small">
            <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Baru Bulan Ini</Text>}
              value={0} styles={{ content: { color: "#22D3EE", fontSize: 20 } }} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Input
            placeholder="Cari petani..."
            prefix={<SearchOutlined style={{ color: "#64748B" }} />}
            style={{ width: 240 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>Ekspor Excel</Button>
        </div>
      </Card>

      <Card variant="borderless">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} petani` }}
            size="middle"
            locale={{ emptyText: <Empty description="Belum ada data petani" /> }}
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
            <Avatar style={{ backgroundColor: "#2D6A4F" }} icon={<UserOutlined />} size={40} />
            <div>
              <div style={{ color: "#F8FAFC", fontWeight: 600 }}>{selectedPetani?.nama}</div>
              <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 400 }}>
                <Tag color={selectedPetani?.status === "aktif" ? "green" : "default"} style={{ marginRight: 0 }}>
                  {selectedPetani?.status === "aktif" ? "Aktif" : "Tidak Aktif"}
                </Tag>
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
            <Descriptions.Item label={<Space><PhoneOutlined /> No. HP</Space>}>
              <Text style={{ color: "#F8FAFC" }}>{selectedPetani?.hp || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><EnvironmentOutlined /> Wilayah</Space>}>
              <Text style={{ color: "#F8FAFC" }}>{selectedPetani?.wilayah || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><ClockCircleOutlined /> Terakhir Aktif</Space>}>
              <Text style={{ color: "#F8FAFC" }}>{selectedPetani?.lastActive}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Title level={5} style={{ color: "#F8FAFC", marginBottom: 12 }}>
            Lahan ({drawerLahan.length})
          </Title>
          {drawerLahan.length > 0 ? (
            <List
              size="small"
              dataSource={drawerLahan}
              style={{ marginBottom: 24 }}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{item.jenisLahan}</Tag>
                    <Text style={{ color: "#F8FAFC" }}>{item.nama}</Text>
                    <Text style={{ color: "#94A3B8" }}>{item.luas} {item.satuanLuas}</Text>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Belum ada lahan" style={{ marginBottom: 24 }} />
          )}

          <Title level={5} style={{ color: "#F8FAFC", marginBottom: 12 }}>
            Riwayat Aktivitas ({drawerAktivitas.length})
          </Title>
          {drawerAktivitas.length > 0 ? (
            <List
              size="small"
              dataSource={drawerAktivitas}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Tag color="cyan">{item.jenis}</Tag>
                      <Text style={{ color: "#94A3B8", fontSize: 12 }}>{item.tanggal}</Text>
                    </div>
                    <Text style={{ color: "#94A3B8", fontSize: 12 }}>{item.lahan}</Text>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Belum ada aktivitas" />
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
