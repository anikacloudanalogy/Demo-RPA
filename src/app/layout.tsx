import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galaxy Toyota RPA Orchestrator | Salesforce to CTDMS Bot Portal",
  description: "Enterprise RPA queue coordination dashboard and remote dealer form-punch automation simulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
