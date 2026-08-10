"use client";

import { useState } from "react";
import styles from "./page.module.css";

// --- Tipos ---
interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  descricao_situacao_cadastral: string;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  codigo_municipio: number;
  porte: string;
  opcao_pelo_simples: boolean | null;
  opcao_pelo_mei: boolean | null;
  capital_social: number;
  cnaes_secundarios: { codigo: number; descricao: string }[];
  qsa: { nome_socio: string; qualificacao_socio: string }[];
  natureza_juridica: string;
  data_inicio_atividade: string;
  ddd_telefone_1?: string;
  telefone1?: string;
  email?: string;
}

// --- Constantes ---
const MOCK_NCMS = [
  { codigo: "8471.30.12", desc: "Maquinas automaticas p/ processamento dados" },
  { codigo: "8517.12.31", desc: "Telefones celulares e suas redes" },
  { codigo: "9032.89.82", desc: "Aparelhos reguladores c/ instrumentos de medida" },
];

// --- Helpers ---
function formatarData(dataDb: string): string {
  if (!dataDb) return "N/A";
  const partes = dataDb.split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return dataDb;
}

function estimarRegime(d: CNPJData): string {
  if (d.opcao_pelo_simples) return "Simples Nacional";
  return d.porte === "DEMAIS" ? "Lucro Real / Presumido" : "Lucro Presumido";
}

// --- Componente principal ---
export default function Home() {
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CNPJData | null>(null);

  // --- Mask CNPJ ---
  const handleMask = (value: string): string => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };

  // --- Buscar CNPJ ---
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      setError("CNPJ deve conter 14 digitos");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`
      );
      if (!response.ok)
        throw new Error("CNPJ nao encontrado na base da Receita Federal");
      const result = await response.json();
      setData(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar dados";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>NFS-e Sherlock</h1>
        <p className={styles.subtitle}>
          Raio-x empresarial — consulte dados publicos de CNPJ na base da
          Receita Federal.
        </p>
      </header>

      {/* Busca CNPJ */}
      <section className={styles.searchSection}>
        <form onSubmit={handleSearch} className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="00.000.000/0001-00"
            className={styles.input}
            value={cnpj}
            onChange={(e) => setCnpj(handleMask(e.target.value))}
            autoFocus
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
        {error && <div className={styles.errorMessage}>{error}</div>}
      </section>

      {/* Resultados do CNPJ */}
      <section className={styles.resultSection}>
        {/* Estado vazio */}
        {!data && !loading && !error && (
          <div className={styles.placeholderState}>
            Digite um CNPJ para consultar os dados publicos da Receita Federal.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className={styles.placeholderState}>
            <div className={styles.spinner}></div>
            Sincronizando com as bases da Receita Federal...
          </div>
        )}

        {/* Dados do CNPJ */}
        {data && (
          <div className={styles.bentoGrid}>
            {/* Cabecalho / identidade */}
            <div className={`${styles.card} ${styles.cardMain}`}>
              <h2 className={styles.cardTitle}>
                Identidade Institucional Oficial
              </h2>
              <div className={styles.cardBigText}>
                {data.nome_fantasia || data.razao_social}
              </div>
              <div className={styles.cardSubText}>{data.razao_social}</div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div className={styles.badge}>{data.cnpj}</div>
                <div className={styles.badge}>
                  Abertura: {formatarData(data.data_inicio_atividade)}
                </div>
              </div>
            </div>

            {/* Status Receita */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Status Receita</h2>
              <div
                className={`${styles.statusBadge} ${
                  data.descricao_situacao_cadastral === "ATIVA"
                    ? styles.statusActive
                    : styles.statusInactive
                }`}
              >
                {data.descricao_situacao_cadastral}
              </div>
            </div>

            {/* Matriz tributaria */}
            <div className={`${styles.card} ${styles.cardSpanOne}`}>
              <h2 className={styles.cardTitle}>
                Matriz Tributaria Geografica
              </h2>
              <ul className={styles.taxList}>
                <li>
                  <strong style={{ color: "#60a5fa" }}>
                    Regime de Imposto:
                  </strong>{" "}
                  {estimarRegime(data)}
                </li>
                <li>
                  <strong>Cod. Municipio IBGE:</strong>{" "}
                  <span style={{ color: "#fca5a5", fontWeight: "bold" }}>
                    {data.codigo_municipio}
                  </span>
                </li>
                <li>
                  <strong>Capital Inicial:</strong>{" "}
                  {data.capital_social
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(data.capital_social)
                    : "N/A"}
                </li>
              </ul>
            </div>

            {/* Contato e natureza juridica */}
            <div className={`${styles.card} ${styles.cardSpanTwo}`}>
              <h2 className={styles.cardTitle}>
                Contato e Natureza Juridica
              </h2>
              <ul className={styles.taxList}>
                <li>
                  <strong>Transito de Documentos (E-mail):</strong>{" "}
                  {data.email ? data.email.toLowerCase() : "Nao listado"}
                </li>
                <li>
                  <strong>Fixo Oficial:</strong>{" "}
                  {data.ddd_telefone_1 || data.telefone1 || "Nao listado"}
                </li>
                <li>
                  <strong>Formato Juridico:</strong>{" "}
                  <span style={{ fontSize: "0.9rem" }}>
                    {data.natureza_juridica?.substring(0, 45)}...
                  </span>
                </li>
              </ul>
            </div>

            {/* CNAE primario */}
            <div className={`${styles.card} ${styles.cardSpanTwo}`}>
              <h2 className={styles.cardTitle}>
                Atividade Regulatoria Primaria (CNAE)
              </h2>
              <div className={styles.cardNormalText}>
                {data.cnae_fiscal_descricao}
              </div>
            </div>

            {/* NCMs simulados */}
            <div
              className={`${styles.card} ${styles.cardSpanOne}`}
              style={{ borderStyle: "dashed", borderColor: "#3b82f6" }}
            >
              <h2 className={styles.cardTitle}>
                NCMs Emissores (Simulacao ERP via Base de Dados API)
              </h2>
              <div className={styles.cnaeGrid}>
                {MOCK_NCMS.map((ncm, idx) => (
                  <div key={idx} className={styles.cnaeBadge} title={ncm.desc}>
                    NCM {ncm.codigo}
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#555",
                  marginTop: "1rem",
                }}
              >
                * Ficticio. Acoplado do sistema legado de notas de entrada (ERP
                Data Base).
              </p>
            </div>

            {/* CNAEs secundarios */}
            <div className={`${styles.card} ${styles.cardFullWidth}`}>
              <h2 className={styles.cardTitle}>
                Grade de Atividades Flexiveis Secundarias (CNAE)
              </h2>
              {data.cnaes_secundarios &&
              data.cnaes_secundarios.length > 0 ? (
                <div className={styles.cnaeGrid}>
                  {data.cnaes_secundarios.map((cnae, idx) => (
                    <div key={idx} className={styles.cnaeBadge}>
                      {cnae.descricao}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.cardNormalText}>
                  Nenhuma licenca flexivel catalogada.
                </div>
              )}
            </div>

            {/* Endereco */}
            <div className={`${styles.card} ${styles.cardAddress}`}>
              <h2 className={styles.cardTitle}>
                Endereco Fiscal Base (Sede para Impostos)
              </h2>
              <div
                className={styles.cardNormalText}
                style={{ fontSize: "0.95rem" }}
              >
                <strong>
                  {data.logradouro}, {data.numero}
                </strong>
                <br />
                {data.bairro}
                <br />
                {data.municipio} - {data.uf}
                <br />
                CEP Registrado: {data.cep}
              </div>
            </div>

            {/* QSA */}
            <div className={`${styles.card} ${styles.cardPartners}`}>
              <h2 className={styles.cardTitle}>
                Corpo Acionario / Quadro Societario Limitado (QSA)
              </h2>
              {data.qsa && data.qsa.length > 0 ? (
                <ul className={styles.partnersList}>
                  {data.qsa.map((socio, idx) => (
                    <li key={idx}>
                      <strong>{socio.nome_socio}</strong>
                      <span>{socio.qualificacao_socio}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.cardNormalText}>
                  Ausencia de registro societario publico restrito CVM/RFB.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
