"use client";

import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Typography,
  Avatar,
  Row,
  Col,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  BellOutlined,
  SaveOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function PengaturanPage() {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleSaveProfile = () => {
    message.success("Profil berhasil disimpan!");
  };

  const handleSavePassword = () => {
    message.success("Kata sandi berhasil diperbarui!");
    passwordForm.resetFields();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#F8FAFC" }}>
          Pengaturan
        </Title>
        <Text style={{ color: "#94A3B8" }}>
          Kelola profil dan preferensi akun admin
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Profile & Password */}
        <Col xs={24} lg={14}>
          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Profil Admin
              </Text>
            }
            style={{ marginBottom: 24 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <Avatar
                size={72}
                style={{ backgroundColor: "#2D6A4F" }}
                icon={<UserOutlined />}
              />
              <div>
                <Text
                  strong
                  style={{ color: "#F8FAFC", display: "block", fontSize: 16 }}
                >
                  Admin
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 13 }}>
                  admin@petatani.id
                </Text>
              </div>
            </div>

            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleSaveProfile}
              initialValues={{ nama: "Admin", email: "admin@petatani.id" }}
            >
              <Form.Item
                label={<Text style={{ color: "#94A3B8" }}>Nama</Text>}
                name="nama"
                rules={[{ required: true, message: "Masukkan nama" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#64748B" }} />}
                  placeholder="Nama admin"
                />
              </Form.Item>
              <Form.Item
                label={<Text style={{ color: "#94A3B8" }}>Email</Text>}
                name="email"
                rules={[
                  { required: true, message: "Masukkan email" },
                  { type: "email", message: "Format email tidak valid" },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: "#64748B" }} />}
                  placeholder="Email admin"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                style={{
                  background: "linear-gradient(135deg, #2D6A4F, #40916C)",
                  border: "none",
                }}
              >
                Simpan Profil
              </Button>
            </Form>
          </Card>

          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Ubah Kata Sandi
              </Text>
            }
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleSavePassword}
            >
              <Form.Item
                label={
                  <Text style={{ color: "#94A3B8" }}>Kata Sandi Saat Ini</Text>
                }
                name="currentPassword"
                rules={[
                  { required: true, message: "Masukkan kata sandi saat ini" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#64748B" }} />}
                  placeholder="Kata sandi lama"
                />
              </Form.Item>
              <Form.Item
                label={
                  <Text style={{ color: "#94A3B8" }}>Kata Sandi Baru</Text>
                }
                name="newPassword"
                rules={[
                  { required: true, message: "Masukkan kata sandi baru" },
                  { min: 8, message: "Minimal 8 karakter" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#64748B" }} />}
                  placeholder="Kata sandi baru (min. 8 karakter)"
                />
              </Form.Item>
              <Form.Item
                label={
                  <Text style={{ color: "#94A3B8" }}>
                    Konfirmasi Kata Sandi Baru
                  </Text>
                }
                name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Konfirmasi kata sandi baru" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Kata sandi baru tidak cocok")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#64748B" }} />}
                  placeholder="Ulangi kata sandi baru"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LockOutlined />}
                style={{
                  background: "linear-gradient(135deg, #334155, #475569)",
                  border: "none",
                }}
              >
                Perbarui Kata Sandi
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Notifications & App Info */}
        <Col xs={24} lg={10}>
          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                <BellOutlined style={{ marginRight: 8 }} />
                Notifikasi
              </Text>
            }
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                {
                  label: "Petani baru mendaftar",
                  desc: "Notifikasi saat ada petani baru",
                  defaultChecked: true,
                },
                {
                  label: "Aktivitas panen",
                  desc: "Notifikasi saat ada aktivitas panen dicatat",
                  defaultChecked: true,
                },
                {
                  label: "Laporan mingguan",
                  desc: "Ringkasan mingguan dikirim via email",
                  defaultChecked: false,
                },
                {
                  label: "Alert lahan tidak aktif",
                  desc: "Lahan tanpa aktivitas lebih dari 7 hari",
                  defaultChecked: true,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <div>
                    <Text
                      style={{
                        color: "#F8FAFC",
                        display: "block",
                        fontSize: 14,
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 12 }}>
                      {item.desc}
                    </Text>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
            </div>
          </Card>

          <Card
            variant="borderless"
            title={
              <Text strong style={{ color: "#F8FAFC" }}>
                Tentang Aplikasi
              </Text>
            }
          >
            {[
              { label: "Versi", value: "1.0.0" },
              { label: "Lingkungan", value: "Development" },
              { label: "Firebase Project", value: "petatani" },
              { label: "Dibuat", value: "2026" },
            ].map((item, i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom:
                    i < arr.length - 1 ? "1px solid #334155" : "none",
                }}
              >
                <Text style={{ color: "#94A3B8" }}>{item.label}</Text>
                <Text style={{ color: "#F8FAFC" }}>{item.value}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
