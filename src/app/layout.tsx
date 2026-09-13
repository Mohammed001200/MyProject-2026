import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://civora.app"),
  title: {
    default: "CIVORA — Life admin, finally clear",
    template: "%s · CIVORA",
  },
  description:
    "CIVORA turns important documents into clear explanations, deadlines, and actions — all in one calm place.",
  applicationName: "CIVORA",
  keywords: [
    "life administration",
    "document intelligence",
    "personal organization",
    "deadlines",
  ],
  openGraph: {
    title: "CIVORA — Life admin, finally clear",
    description:
      "Understand important documents, catch deadlines, and know what to do next.",
    type: "website",
    siteName: "CIVORA",
  },
  twitter: {
    card: "summary_large_image",
    title: "CIVORA — Life admin, finally clear",
    description:
      "Understand important documents, catch deadlines, and know what to do next.",
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1513" },
  ],
  colorScheme: "light dark",
};

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('civora-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
