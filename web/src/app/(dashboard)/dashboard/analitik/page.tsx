"use client";

import { Card, Typography, Row, Col, Select, Space, Statistic, Spin } from "antd";
import { ToolOutlined, TeamOutlined, DollarOutlined } from "@ant-design/icons";
import { Column, Pie } from "@ant-design/charts";
import { useEffect, useState } from "react";
import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeSnapshot } from "@/lib/firebase-utils";
import { JENIS_AKTIVITAS_LABEL, type JenisAktivitas } from "@/types";

const { Title, Text } = Typography;

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
  notation: "compact",
});

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

interface AktivitasDoc {
  userId: string;
  lahanId: string;
  type?: string;
  jenis?: string;
  tanggalMulai?: string;
  alatYangDigunakan?: string | null;
  jumlahTenagaKerja?: number | null;
  biayaHok?: number | null;
  biayaBahanBakar?: number | null;
  biayaSaprodi?: number | null;
}

interface LahanDoc {
  userId: string;
  jenisLahan?: string;
  jenis?: string;
}

export default function AnalitikPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [aktivitasDocs, setAktivitasDocs] = useState<AktivitasDoc[]>([]);
  const [lahanDocs, setLahanDocs] = useState<LahanDoc[]>([]);

  useEffect(() => {
    const unsubAktivitas = safeSnapshot(collection(db, "aktivitas"), (snap) => {
      setAktivitasDocs(snap.docs.map((d) => d.data() as AktivitasDoc));
      setLoading(false);
    });
    const unsubLahan = safeSnapshot(collection(db, "lahan"), (snap) => {
      setLahanDocs(snap.docs.map((d) => d.data() as LahanDoc));
    });
    return () => { unsubAktivitas(); unsubLahan(); };
  }, []);

  // Filter by year
  const yearDocs = aktivitasDocs.filter((d) => {
    const tgl = d.tanggalMulai ?? "";
    return tgl.startsWith(selectedYear);
  });

  // This month
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const bulanIniDocs = aktivitasDocs.filter((d) => (d.tanggalMulai ?? "").startsWith(thisMonthPrefix));

  // KPI
  const pakaiAlat = bulanIniDocs.filter((d) => d.alatYangDigunakan).length;
  const totalHok = bulanIniDocs.reduce((s, d) => s + (d.jumlahTenagaKerja ?? 0), 0);
  const totalBiayaBulanIni =
    bulanIniDocs.reduce((s, d) => s + (d.biayaBahanBakar ?? 0) + (d.biayaSaprodi ?? 0) + (d.biayaHok ?? 0), 0);

  // Cost breakdown (this month)
  const biayaBahanBakar = bulanIniDocs.reduce((s, d) => s + (d.biayaBahanBakar ?? 0), 0);
  const biayaSaprodi = bulanIniDocs.reduce((s, d) => s + (d.biayaSaprodi ?? 0), 0);
  const biayaHok = bulanIniDocs.reduce((s, d) => s + (d.biayaHok ?? 0), 0);

  // Tren Aktivitas Bulanan (per month for selected year)
  const monthCount: Record<number, number> = {};
  yearDocs.forEach((d) => {
    const tgl = d.tanggalMulai ?? "";
    const month = parseInt(tgl.slice(5, 7), 10) - 1;
    if (!isNaN(month)) monthCount[month] = (monthCount[month] ?? 0) + 1;
  });
  const trenData = MONTH_NAMES.map((bulan, i) => ({ bulan, jumlah: monthCount[i] ?? 0 }));

  // Distribusi Jenis Aktivitas
  const jenisCount: Record<string, number> = {};
  yearDocs.forEach((d) => {
    const jenis = (d.type ?? d.jenis ?? "olahTanah") as JenisAktivitas;
    const label = JENIS_AKTIVITAS_LABEL[jenis] ?? jenis;
    jenisCount[label] = (jenisCount[label] ?? 0) + 1;
  });
  const jenisData = Object.entries(jenisCount).map(([type, value]) => ({ type, value }));

  // Distribusi Alat
  const alatCount: Record<string, number> = {};
  yearDocs.filter((d) => d.alatYangDigunakan).forEach((d) => {
    const alat = d.alatYangDigunakan!;
    alatCount[alat] = (alatCount[alat] ?? 0) + 1;
  });
  const alatData = Object.entries(alatCount).map(([alat, jumlah]) => ({ alat, jumlah }));

  // Distribusi Jenis Lahan
  const lahanJenisCount: Record<string, number> = {};
  lahanDocs.forEach((d) => {
    const jenis = d.jenisLahan ?? d.jenis ?? "Sawah";
    lahanJenisCount[jenis] = (lahanJenisCount[jenis] ?? 0) + 1;
  });
  const lahanJenisData = Object.entries(lahanJenisCount).map(([type, value]) => ({ type, value }));

  const chartTheme = {
    background: "transparent",
    defaultColor: "#22D3EE",
  };

  const years = Array.from(
    new Set(aktivitasDocs.map((d) => (d.tanggalMulai ?? "").slice(0, 4)).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));
  if (!years.includes(now.getFullYear().toString())) years.unshift(now.getFullYear().toString());

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>Analitik</Title>
          <Text style={{ color: "#94A3B8" }}>Analisa pola dan tren aktivitas pertanian</Text>
        </div>
        <Space>
          <Select
            value={selectedYear}
            style={{ width: 100 }}
            onChange={setSelectedYear}
            options={years.map((y) => ({ value: y, label: y }))}
          />
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* KPI */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Space>
                <ToolOutlined style={{ fontSize: 24, color: "#22D3EE" }} />
                <div>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>Aktivitas Pakai Alat</Text>
                  <Statistic value={pakaiAlat} suffix="kali"
                    styles={{ content: { color: "#F8FAFC", fontSize: 24 } }} />
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Space>
                <TeamOutlined style={{ fontSize: 24, color: "#E9C46A" }} />
                <div>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>Total HOK Bulan Ini</Text>
                  <Statistic value={totalHok} suffix="orang"
                    styles={{ content: { color: "#F8FAFC", fontSize: 24 } }} />
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Space>
                <DollarOutlined style={{ fontSize: 24, color: "#2D6A4F" }} />
                <div>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Biaya Bulan Ini</Text>
                  <Statistic value={rupiahFmt.format(totalBiayaBulanIni)}
                    styles={{ content: { color: "#F8FAFC", fontSize: 24 } }} />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Total Biaya */}
        <Card variant="borderless" style={{ marginBottom: 24 }}
          title={<Text strong style={{ color: "#F8FAFC" }}><DollarOutlined /> Total Biaya Produksi (Bulan Ini)</Text>}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Bahan Bakar</Text>}
                value={rupiahFmt.format(biayaBahanBakar)}
                styles={{ content: { color: "#E76F51", fontSize: 18 } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Saprodi</Text>}
                value={rupiahFmt.format(biayaSaprodi)}
                styles={{ content: { color: "#22D3EE", fontSize: 18 } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>HOK</Text>}
                value={rupiahFmt.format(biayaHok)}
                styles={{ content: { color: "#E9C46A", fontSize: 18 } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={<Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Keseluruhan</Text>}
                value={rupiahFmt.format(totalBiayaBulanIni)}
                styles={{ content: { color: "#2D6A4F", fontSize: 18, fontWeight: 700 } }} />
            </Col>
          </Row>
        </Card>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card variant="borderless" title={<Text strong style={{ color: "#F8FAFC" }}>Tren Aktivitas Bulanan ({selectedYear})</Text>}>
              <Column
                data={trenData}
                xField="bulan"
                yField="jumlah"
                theme={chartTheme}
                style={{ fill: "#22D3EE" }}
                axis={{ x: { labelFill: "#94A3B8" }, y: { labelFill: "#94A3B8", gridStroke: "#1E293B" } }}
                height={280}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card variant="borderless" title={<Text strong style={{ color: "#F8FAFC" }}>Distribusi Jenis Aktivitas</Text>}>
              {jenisData.length > 0 ? (
                <Pie
                  data={jenisData}
                  angleField="value"
                  colorField="type"
                  theme={chartTheme}
                  legend={{ color: { itemLabelFill: "#94A3B8" } }}
                  height={280}
                />
              ) : (
                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#475569" }}>Belum ada data</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card variant="borderless" title={<Text strong style={{ color: "#F8FAFC" }}>Distribusi Alat yang Digunakan</Text>}>
              {alatData.length > 0 ? (
                <Column
                  data={alatData}
                  xField="alat"
                  yField="jumlah"
                  theme={chartTheme}
                  style={{ fill: "#E9C46A" }}
                  axis={{ x: { labelFill: "#94A3B8" }, y: { labelFill: "#94A3B8", gridStroke: "#1E293B" } }}
                  height={280}
                />
              ) : (
                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#475569" }}>Belum ada data alat</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card variant="borderless" title={<Text strong style={{ color: "#F8FAFC" }}>Distribusi Jenis Lahan</Text>}>
              {lahanJenisData.length > 0 ? (
                <Pie
                  data={lahanJenisData}
                  angleField="value"
                  colorField="type"
                  theme={chartTheme}
                  legend={{ color: { itemLabelFill: "#94A3B8" } }}
                  height={280}
                />
              ) : (
                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#475569" }}>Belum ada data lahan</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
