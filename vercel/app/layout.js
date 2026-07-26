import "./globals.css";

export const metadata = {
  title: "アクチュアリー2次試験 生保2過去問演習",
  description: "生保2の過去問と所見を、毎日の課題・章別・検索から効率よく学べる演習サイト",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#123b2d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
