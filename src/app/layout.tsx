import type { Metadata } from "next";
import { Do_Hyeon, IBM_Plex_Sans_KR } from "next/font/google";

import "./globals.css";

const displayFont = Do_Hyeon({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "PlusMinus Lab",
  description:
    "유리수의 덧셈과 뺄셈을 셈돌, 우체부, 토끼 모델로 학습하는 게이미피케이션 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} app-shell font-[var(--font-body)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

