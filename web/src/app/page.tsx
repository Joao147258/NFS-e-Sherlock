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

interface XMLData {
  cnpjPrestador: string;
  valorServicos: string;
  aliquota: string;
  itemListaServico: string;
  ibgeTomador: string;
  ibgePrestadorXML: string;
  ibgeIncidenciaXML: string;
  localTributacao: string;
  fileName: string;
}

// --- Constantes ---
const MOCK_NCMS = [
  { codigo: "8471.30.12", desc: "Maquinas automaticas p/ processamento dados" },
  { codigo: "8517.12.31", desc: "Telefones celulares e suas redes" },
  { codigo: "9032.89.82", desc: "Aparelhos reguladores c/ instrumentos de medida" },
];

// Servicos onde o ISS fica no TOMADOR ou OBRA (LC 116/2003)
const EXCECOES_LC116 = [
  "3.05", "7.02", "7.04", "7.05", "7.09", "7.10", "7.11", "7.12",
  "7.16", "7.17", "7.18", "7.19", "11.01", "11.02", "11.04",
  "16.01", "17.05", "17.10", "20.01", "20.02", "20.03",
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

  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const [xmlError, setXmlError] = useState("");

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

  // --- Upload e parse do XML ---
  const handleXMLUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setXmlError("");
    setXmlData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlString = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0)
          throw new Error("O arquivo nao e um XML valido ou esta corrompido.");

        // Extrair CNPJ do Prestador
        let cnpjPrestador = "";
        const prestadorNode =
          xmlDoc.getElementsByTagName("Prestador")[0];
        if (prestadorNode) {
          cnpjPrestador =
            prestadorNode.getElementsByTagName("Cnpj")[0]?.textContent ||
            prestadorNode.getElementsByTagName("CNPJ")[0]?.textContent ||
            "";
        }
        if (!cnpjPrestador) {
          cnpjPrestador =
            xmlDoc.getElementsByTagName("Cnpj")[0]?.textContent ||
            xmlDoc.getElementsByTagName("CNPJ")[0]?.textContent ||
            "";
        }

        // Extrair campos financeiros e fiscais
        const valorServicos =
          xmlDoc.getElementsByTagName("ValorServicos")[0]?.textContent ||
          xmlDoc.getElementsByTagName("vServ")[0]?.textContent ||
          "0.00";

        const aliquota =
          xmlDoc.getElementsByTagName("Aliquota")[0]?.textContent ||
          xmlDoc.getElementsByTagName("vAliq")[0]?.textContent ||
          "0.00";

        const itemListaServico =
          xmlDoc.getElementsByTagName("ItemListaServico")[0]?.textContent ||
          xmlDoc.getElementsByTagName("cServ")[0]?.textContent ||
          "N/A";

        // IBGE do Tomador
        let ibgeTomador = "";
        const tomadorNode =
          xmlDoc.getElementsByTagName("Tomador")[0] ||
          xmlDoc.getElementsByTagName("TomadorServico")[0];
        if (tomadorNode) {
          ibgeTomador =
            tomadorNode.getElementsByTagName("CodigoMunicipio")[0]
              ?.textContent ||
            tomadorNode.getElementsByTagName("cMun")[0]?.textContent ||
            "";
        }

        // IBGE de Incidencia (onde o ISS foi recolhido)
        let ibgeIncidenciaXML = "";
        const servicoNode = xmlDoc.getElementsByTagName("Servico")[0];
        if (servicoNode) {
          ibgeIncidenciaXML =
            servicoNode.getElementsByTagName("CodigoMunicipio")[0]
              ?.textContent ||
            servicoNode.getElementsByTagName("cMun")[0]?.textContent ||
            "";
        }

        // IBGE do Prestador (do proprio XML)
        let ibgePrestadorXML = "";
        if (prestadorNode) {
          ibgePrestadorXML =
            prestadorNode.getElementsByTagName("CodigoMunicipio")[0]
              ?.textContent ||
            prestadorNode.getElementsByTagName("cMun")[0]?.textContent ||
            "";
        }

        // Local de tributacao
        const localTributacao =
          xmlDoc.getElementsByTagName("LocalPrestacao")[0]?.textContent ||
          xmlDoc.getElementsByTagName("LocalTributacao")[0]?.textContent ||
          xmlDoc.getElementsByTagName("MunicipioPrestacao")[0]?.textContent ||
          "N/A";

        setXmlData({
          cnpjPrestador: cnpjPrestador.replace(/\D/g, ""),
          valorServicos,
          aliquota,
          itemListaServico,
          ibgeTomador,
          ibgePrestadorXML,
          ibgeIncidenciaXML,
          localTributacao,
          fileName: file.name,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro critico ao auditar o lote XML. Tags ausentes.";
        setXmlError(message);
      }
    };
    reader.readAsText(file);
  };

  // --- Logicas de auditoria (cross-check) ---
  const isCnpjDivergent =
    data && xmlData
      ? data.cnpj.replace(/\D/g, "") !== xmlData.cnpjPrestador
      : false;

  const isAliquotaAlert =
    data && xmlData
      ? parseFloat(xmlData.aliquota) === 0 && !data.opcao_pelo_simples
      : false;

  // Auditoria geografica (LC 116/2003)
  let isGeometricDivergent = false;
  let geoMessage = "";

  if (data && xmlData && xmlData.itemListaServico !== "N/A") {
    const cleanItem = xmlData.itemListaServico.trim().replace(/^0+/, "");
    const isExcecaoLC116 =
      EXCECOES_LC116.includes(cleanItem) ||
      EXCECOES_LC116.includes(xmlData.itemListaServico.trim());

    const prestadorIbgeReal =
      data.codigo_municipio?.toString() || xmlData.ibgePrestadorXML;

    if (isExcecaoLC116) {
      if (
        xmlData.ibgeIncidenciaXML &&
        xmlData.ibgeIncidenciaXML !== xmlData.ibgeTomador &&
        xmlData.ibgeTomador !== ""
      ) {
        isGeometricDivergent = true;
        geoMessage = `SERVICO DE EXCECAO (Item ${xmlData.itemListaServico}): O ISS e devido no local da obra/tomador (IBGE esperado: ${xmlData.ibgeTomador}). No entanto, o XML desvia o montante para a prefeitura IBGE ${xmlData.ibgeIncidenciaXML}. A Sefaz de destino pode aplicar Auto de Infracao.`;
      } else {
        geoMessage = `Regra de Excecao validada com Sucesso. A Receita aceitara a Retencao fora da Sede: Incidencia apontada corretamente para o Tomador/Local da Obra (IBGE: ${xmlData.ibgeIncidenciaXML || xmlData.ibgeTomador}).`;
      }
    } else {
      if (
        xmlData.ibgeIncidenciaXML &&
        prestadorIbgeReal &&
        xmlData.ibgeIncidenciaXML !== prestadorIbgeReal
      ) {
        isGeometricDivergent = true;
        geoMessage = `VIOLACAO DE REGRA GERAL (Art. 3 - Item ${xmlData.itemListaServico}): O imposto pertence obrigatoriamente a Sede do Prestador (IBGE Oficial Brasil API: ${prestadorIbgeReal}). O lote XML foi montado retendo ilegalmente na cidade IBGE ${xmlData.ibgeIncidenciaXML}. Lote sera rejeitado.`;
      } else {
        geoMessage = `Regra Geral mantida: Incidencia Tributaria ocorre na propria Sede do Prestador (IBGE: ${prestadorIbgeReal}). Nenhum desvio de ISS detectado.`;
      }
    }
  } else if (xmlData && xmlData.itemListaServico === "N/A") {
    geoMessage =
      "A Tag <ItemListaServico> nao pode ser encontrada neste Lote RPS. Impossivel julgar o enquadramento geografico da LC 116.";
  }

  // --- Render ---
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>NFS-e Sherlock</h1>
        <p className={styles.subtitle}>
          Raio-x empresarial com Auditoria Integrada de Lote de NFSe.
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

        {/* Upload XML (so aparece apos consulta) */}
        {data && (
          <div className={styles.dropzoneWrapper}>
            <label className={styles.dropzone}>
              <input
                type="file"
                accept=".xml"
                onChange={handleXMLUpload}
                className={styles.fileInput}
              />
              <div className={styles.dropzoneText}>
                <strong>+ Arraste um Lote RPS/DPS (.xml)</strong>{" "}
                cruzamento com base IBGE da Receita
              </div>
            </label>
            {xmlError && (
              <div className={styles.errorMessage}>{xmlError}</div>
            )}
          </div>
        )}
      </section>

      {/* Relatorio de auditoria fiscal (XML + CNPJ) */}
      {xmlData && data && (
        <section className={`${styles.resultSection} ${styles.auditorSection}`}>
          <h2 className={styles.sectionTitle}>
            Relatorio de Auditor Fiscal Eletronico ({xmlData.fileName})
          </h2>
          <div className={styles.bentoGrid}>
            {/* Auditoria Geografica */}
            <div
              className={`${styles.card} ${
                isGeometricDivergent
                  ? styles.cardAlertDanger
                  : styles.cardAlertSuccess
              } ${styles.cardSpanTwo}`}
            >
              <h2 className={styles.cardTitle}>
                Auditoria Geografica (LC 116/2003 - IBGE)
              </h2>
              <div className={styles.cardNormalText}>
                {isGeometricDivergent ? (
                  <>
                    <strong>ERRO TERRITORIAL: </strong> {geoMessage}
                  </>
                ) : (
                  <>
                    <strong>COMPLIANCE ATINGIDO: </strong> {geoMessage}
                  </>
                )}
              </div>
            </div>

            {/* Auditoria de Aliquota */}
            <div
              className={`${styles.card} ${
                isAliquotaAlert
                  ? styles.cardAlertWarning
                  : styles.cardAlertSuccess
              } ${styles.cardSpanOne}`}
            >
              <h2 className={styles.cardTitle}>Auditoria de Aliquota de ISS</h2>
              {isAliquotaAlert ? (
                <div className={styles.cardNormalText}>
                  <strong>ATENCAO (Risco Tributario):</strong> A aliquota no
                  RPS esta vazia ou 0%. Como a empresa{" "}
                  <strong>nao e Simples Nacional</strong>, aliquotas zeradas
                  gerarao Rejeicao (Falta de recolhimento).
                </div>
              ) : (
                <div className={styles.cardNormalText}>
                  <strong>OK:</strong> Nenhuma infracao agressiva encontrada na
                  aliquota ({xmlData.aliquota}%). Carga tributaria coerente.
                </div>
              )}
            </div>

            {/* Divergencia de CNPJ */}
            <div
              className={`${styles.card} ${
                isCnpjDivergent ? styles.cardAlertDanger : styles.cardDarkBlue
              } ${styles.cardSpanOne}`}
            >
              <h2 className={styles.cardTitle}>
                Divergencia de Titularidade (CNPJ)
              </h2>
              {isCnpjDivergent ? (
                <div className={styles.cardNormalText}>
                  <strong>CRITICO:</strong> Fraude/Erro de Assinatura. Lote
                  gerado para ({xmlData.cnpjPrestador}), diferindo do consultado.
                </div>
              ) : (
                <div className={styles.cardNormalText}>
                  <strong>OK:</strong> O CNPJ Prestador do lote corresponde
                  perfeitamente ({xmlData.cnpjPrestador}).
                </div>
              )}
            </div>

            {/* Resumo financeiro do XML */}
            <div
              className={`${styles.card} ${styles.cardSpanTwo} ${styles.cardDarkBlue}`}
            >
              <h2 className={styles.cardTitle}>
                Resumo Financeiro do Arquivo XML Extraido
              </h2>
              <div
                className={styles.cardNormalText}
                style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
              >
                <div>
                  <strong>Valor Faturamentos:</strong> R${" "}
                  {xmlData.valorServicos}
                </div>
                <div>
                  <strong>ISS Declarado:</strong> {xmlData.aliquota}%
                </div>
                <div>
                  <strong>Item Sec. ISS LC 116:</strong>{" "}
                  {xmlData.itemListaServico}
                </div>
              </div>
            </div>

            {/* Detalhamento IBGE do XML */}
            <div
              className={`${styles.card} ${styles.cardSpanOne} ${styles.cardDarkBlue}`}
            >
              <h2 className={styles.cardTitle}>
                Detalhamento Local IBGE Extrato (XML)
              </h2>
              <ul className={styles.taxList}>
                <li>
                  <strong>Sede Prestador XML:</strong>{" "}
                  {xmlData.ibgePrestadorXML || "N/A"}
                </li>
                <li>
                  <strong>Sede Tomador XML:</strong>{" "}
                  {xmlData.ibgeTomador || "N/A"}
                </li>
                <li>
                  <strong>Cod. Municipio Incidencia:</strong>{" "}
                  <span style={{ color: "#fca5a5" }}>
                    {xmlData.ibgeIncidenciaXML || "N/A"}
                  </span>
                </li>
                <li>
                  <strong>Tag Especifica (Local Tributacao):</strong>{" "}
                  <span style={{ color: "#fde047" }}>
                    {xmlData.localTributacao !== "N/A"
                      ? xmlData.localTributacao
                      : "Nao constou no XML"}
                  </span>
                </li>
                <li
                  style={{
                    borderTop: "1px solid #333",
                    paddingTop: "0.8rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <strong>Matriz Base Oficial (API):</strong>{" "}
                  {data?.codigo_municipio || "N/A"}
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Resultados do CNPJ */}
      <section className={styles.resultSection}>
        {/* Estado vazio */}
        {!data && !loading && !error && (
          <div className={styles.placeholderState}>
            Aguardando validacao e acesso na Malha Fiscal da Receita...
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
