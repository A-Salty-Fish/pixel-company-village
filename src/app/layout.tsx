import type { Metadata } from "next";
import { documentTitle } from "@/features/village-release/changelog";
import "./globals.css";

export const metadata: Metadata = {
  title: documentTitle(),
  description: "同事们的像素农场景趣雷达。代理信号≠绩效；摸鱼分是趣味雷达。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
