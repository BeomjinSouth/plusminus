import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Noto_Serif_KR } from "next/font/google";

import "./globals.css";

const displayFont = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "700"],
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
    "유리수의 덧셈과 뺄셈을 셈돌, 카드 점수 미션, 토끼 모델로 학습하는 수업용 웹앱",
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
