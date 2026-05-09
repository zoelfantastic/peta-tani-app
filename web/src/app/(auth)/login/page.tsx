"use client";

import { Card, Form, Input, Button, Typography, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const firebaseUser = result.user;
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? values.email,
        nama: firebaseUser.displayName ?? values.email.split("@")[0],
      });
      message.success("Berhasil masuk!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        message.error("Email atau kata sandi salah.");
      } else if (code === "auth/user-not-found") {
        message.error("Akun tidak ditemukan.");
      } else if (code === "auth/too-many-requests") {
        message.error("Terlalu banyak percobaan. Coba beberapa saat lagi.");
      } else {
        message.error("Gagal masuk. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" variant="borderless">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 8,
              filter: "drop-shadow(0 4px 12px rgba(45, 106, 79, 0.3))",
            }}
          >
            🌾
          </div>
          <Title level={3} style={{ margin: 0, color: "#F8FAFC" }}>
            Peta Tani
          </Title>
          <Text style={{ color: "#94A3B8", fontSize: 14 }}>
            Dashboard Admin — Monitoring Pertanian
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Masukkan email Anda" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#94A3B8" }} />}
              placeholder="Email admin"
              autoComplete="email"
              id="login-email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Masukkan kata sandi" },
              { min: 6, message: "Minimal 6 karakter" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
              placeholder="Kata sandi"
              autoComplete="current-password"
              id="login-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              id="login-submit"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: "linear-gradient(135deg, #2D6A4F, #40916C)",
                border: "none",
                boxShadow: "0 4px 12px rgba(45, 106, 79, 0.4)",
              }}
            >
              Masuk
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Text style={{ color: "#64748B", fontSize: 12 }}>
            © 2026 Peta Tani. Hak Cipta Dilindungi.
          </Text>
        </div>
      </Card>
    </div>
  );
}
