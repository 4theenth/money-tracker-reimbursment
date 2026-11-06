import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Kelola keuangan pribadi dan reimbursement kantor",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-theme="light"
      suppressHydrationWarning
      className={`${publicSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NotificationProvider>
          <AppShell>{children}</AppShell>
        </NotificationProvider>
      </body>
    </html>
  );
}
