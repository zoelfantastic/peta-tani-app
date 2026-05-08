import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "./AntdProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peta Tani - Dashboard Admin",
  description: "Dashboard monitoring dan analitik untuk manajemen pertanian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AntdRegistry>
          <AntdProvider>{children}</AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
