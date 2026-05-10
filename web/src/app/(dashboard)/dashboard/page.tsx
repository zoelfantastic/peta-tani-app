"use client";

import {
  Card, Col, Row, Statistic, Table, Tag, Typography, Empty, Spin,
} from "antd";
import {
  TeamOutlined, EnvironmentOutlined, FileTextOutlined, RiseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { collection, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeSnapshot } from "@/lib/firebase-utils";
import { JENIS_AKTIVITAS_LABEL, type JenisAktivitas } from "@/types";

const { Title, Text } = Typography;

interface AktivitasRow {
  key: string;
  petani: string;
  lahan: string;
  aktivitas: string;
  tanaman: string;
  waktu: string;
}

const columns: ColumnsType<AktivitasRow> = [
  {
    title: "Petani",
    dataIndex: "petani",
    key: "petani",
    render: (text: string) => <Text strong style={{ color: "#F8FAFC" }}>{text}</Text>,
  },
  { title: "Lahan", dataIndex: "lahan", key: "lahan" },
  {
    title: "Aktivitas",
    dataIndex: "aktivitas",
    key: "aktivitas",
    render: (text: string) => <Tag color="cyan">{text}</Tag>,
  },
  {
    title: "Tanaman",
    dataIndex: "tanaman",
    key: "tanaman",
    render: (text: string) => text ? <Tag variant="filled">{text}</Tag> : <Text style={{ color: "#475569" }}>—</Text>,
  },
  {
    title: "Waktu",
    dataIndex: "waktu",
    key: "waktu",
    render: (text: string) => <Text style={{ color: "#94A3B8" }}>{text}</Text>,
  },
];

export default function DashboardPage() {
  const [totalPetani, setTotalPetani] = useState(0);
  const [totalLahan, setTotalLahan] = useState(0);
  const [aktivitasBulanIni, setAktivitasBulanIni] = useState(0);
  const [siapPanen, setSiapPanen] = useState(0);
  const [recentAktivitas, setRecentAktivitas] = useState<AktivitasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [lahanMap, setLahanMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubUsers = safeSnapshot(collection(db, "users"), (snap) => {
      setTotalPetani(snap.size);
      const map: Record<string, string> = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().name ?? d.data().nama ?? d.id; });
      setUserMap(map);
    });

    const unsubLahan = safeSnapshot(collection(db, "lahan"), (snap) => {
      setTotalLahan(snap.size);
      const map: Record<string, string> = {};
      snap.docs.forEach((d) => { map[d.id] = d.data().jenis_tanaman ?? d.data().tanaman ?? ""; });
      setLahanMap(map);
    });

    return () => { unsubUsers(); unsubLahan(); };
  }, []);

  useEffect(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const q = query(collection(db, "aktivitas"), orderBy("tanggalMulai", "desc"), limit(10));
    const unsubAktivitas = safeSnapshot(q, (snap) => {
      let bulanIni = 0;
      let panen = 0;
      const rows: AktivitasRow[] = [];

      snap.docs.forEach((d) => {
        const data = d.data();
        const tgl = data.tanggalMulai ?? "";
        if (tgl >= firstOfMonth) bulanIni++;
        const jenis = (data.type ?? data.jenis ?? "") as JenisAktivitas;
        if (jenis === "panen" && !data.tanggalSelesai) panen++;

        if (rows.length < 5) {
          let waktu = "—";
          if (tgl) {
            try {
              waktu = new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
            } catch { waktu = tgl; }
          }
          rows.push({
            key: d.id,
            petani: userMap[data.userId] ?? data.userId ?? "—",
            lahan: data.lahanName ?? "—",
            aktivitas: JENIS_AKTIVITAS_LABEL[jenis] ?? jenis,
            tanaman: lahanMap[data.lahanId] ?? data.tanaman ?? "—",
            waktu,
          });
        }
      });

      setAktivitasBulanIni(bulanIni);
      setSiapPanen(panen);
      setRecentAktivitas(rows);
      setLoading(false);
    });

    return unsubAktivitas;
  }, [userMap, lahanMap]);

  const kpiCards = [
    {
      title: "Total Petani",
      value: totalPetani,
      icon: <TeamOutlined style={{ fontSize: 24, color: "#22D3EE" }} />,
      color: "#22D3EE",
      valueColor: "#F8FAFC",
    },
    {
      title: "Total Lahan",
      value: totalLahan,
      icon: <EnvironmentOutlined style={{ fontSize: 24, color: "#2D6A4F" }} />,
      color: "#2D6A4F",
      valueColor: "#F8FAFC",
    },
    {
      title: "Aktivitas Bulan Ini",
      value: aktivitasBulanIni,
      icon: <FileTextOutlined style={{ fontSize: 24, color: "#E76F51" }} />,
      color: "#E76F51",
      valueColor: "#F8FAFC",
    },
    {
      title: "Siap Panen",
      value: siapPanen,
      icon: <RiseOutlined style={{ fontSize: 24, color: "#E9C46A" }} />,
      color: "#E9C46A",
      valueColor: "#E9C46A",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Dashboard</Title>
        <Text style={{ color: "#94A3B8" }}>Ringkasan data pertanian</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((kpi, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="kpi-card fade-in-up" variant="borderless">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Text style={{ color: "#94A3B8", fontSize: 13 }}>{kpi.title}</Text>
                  <Statistic
                    value={kpi.value}
                    styles={{ content: { color: kpi.valueColor, fontWeight: 700, fontSize: 28 } }}
                  />
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${kpi.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {kpi.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        variant="borderless"
        title={<Text strong style={{ color: "#F8FAFC" }}>Aktivitas Terbaru</Text>}
        extra={
          <a style={{ color: "#22D3EE", fontSize: 13 }} href="/dashboard/aktivitas">
            Lihat Semua →
          </a>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={recentAktivitas}
            pagination={false}
            size="middle"
            locale={{ emptyText: <Empty description="Belum ada aktivitas" /> }}
          />
        </Spin>
      </Card>
    </div>
  );
}
