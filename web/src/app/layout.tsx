import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFS-e Sherlock — Auditoria Fiscal Inteligente",
  description:
    "Raio-x empresarial com auditoria integrada de lote de NFSe. Cross-check de CNPJ com IBGE e LC 116/2003.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
