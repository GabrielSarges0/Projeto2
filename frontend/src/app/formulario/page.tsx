"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  FileSignature,
  FileText,
  Printer,
  Save,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import styles from "./formulario.module.css";

type FormTemplate = "recibo" | "contrato" | "vistoria" | "prestacao";

export default function FormularioPage() {
  const [template, setTemplate] = useState<FormTemplate>("recibo");

  // Dados comuns
  const [imovel, setImovel] = useState("IM-001 - Rua A, 120 - Boa Vista");
  const [inquilino, setInquilino] = useState("João Pedro Cavalcanti");
  const [cpfCnpj, setCpfCnpj] = useState("123.456.789-00");
  const [valor, setValor] = useState("3.200,00");
  const [dataEmissao, setDataEmissao] = useState("2026-10-28");
  const [mesReferencia, setMesReferencia] = useState("Outubro / 2026");

  // Dados específicos do contrato
  const [prazoMeses, setPrazoMeses] = useState("12");
  const [garantia, setGarantia] = useState("Caução equivalente a 3 meses de aluguel");

  // Dados específicos da vistoria
  const [estadoPintura, setEstadoPintura] = useState("Novo / Recém-pintado");
  const [instalacoes, setInstalacoes] = useState("Hidráulica e elétrica 100% revisadas");
  const [chaves, setChaves] = useState("02 cópias de chaves da porta principal e 01 do portão");

  // Dados prestação de contas
  const [totalReceitas, setTotalReceitas] = useState("24.750,00");
  const [totalDespesas, setTotalDespesas] = useState("9.900,00");
  const [destinacao, setDestinacao] = useState("Manutenção patrimonial e assistência social filantrópica");
  const [authKey] = useState("FMC-728104-AUTH");

  const [toastMessage, setToastMessage] = useState("");

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleSaveToDocuments() {
    try {
      const savedDocs = localStorage.getItem("fmc_files_v3");
      const list = savedDocs ? JSON.parse(savedDocs) : [];

      let title = "";
      let category = "Outro";
      let folderId: string | null = null;

      if (template === "recibo") {
        title = `Recibo_Aluguel_${inquilino.replace(/\s+/g, "_")}_${mesReferencia.replace(/[^a-zA-Z0-9]/g, "")}.pdf`;
        category = "Comprovante";
        folderId = "3"; // Pasta 2 - Comprovantes Financeiros
      } else if (template === "contrato") {
        title = `Contrato_Locacao_${imovel.split(" ")[0]}_${inquilino.replace(/\s+/g, "_")}.pdf`;
        category = "Contrato";
        folderId = "2"; // Pasta 1 - Contratos
      } else if (template === "vistoria") {
        title = `Termo_Vistoria_${imovel.split(" ")[0]}.pdf`;
        category = "Laudo Técnico";
      } else {
        title = `Prestacao_Contas_Trimestral_${mesReferencia.replace(/[^a-zA-Z0-9]/g, "")}.pdf`;
        category = "Prestação de Contas";
        folderId = "1"; // Ministério Público
      }

      const newFile = {
        id: String(Date.now()),
        name: title,
        folderId,
        size: "1.2 MB",
        category,
        createdAt: dataEmissao,
        protocol: `FMC-FORM-${Math.floor(10000 + Math.random() * 90000)}`,
        signed: true,
        description: `Documento formatado automaticamente via Formulários Inteligentes FMC em ${new Date().toLocaleDateString("pt-BR")}`,
      };

      list.unshift(newFile);
      localStorage.setItem("fmc_files_v3", JSON.stringify(list));
      showToast(`Documento "${title}" gerado e salvo na Central de Documentos!`);
    } catch {
      showToast("Documento gerado com sucesso!");
    }
  }

  return (
    <AppShell>
      <div className={styles.formularioContainer}>
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Link
                href="/documentos"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#092a54",
                  textDecoration: "none",
                  background: "#f1f5f9",
                  padding: "4px 10px",
                  borderRadius: "14px",
                }}
              >
                <ArrowLeft size={14} /> Central de Documentos
              </Link>
            </div>
            <h1>Formatação Automatizada de Documentos (BP02)</h1>
            <p>Gere recibos, contratos e laudos padronizados da Fundação Manuel Cruz prontos para assinatura e arquivo</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className={styles.printBtn} onClick={() => window.print()}>
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button type="button" className={styles.saveToDocsBtn} onClick={handleSaveToDocuments}>
              <Save size={16} /> Salvar em Documentos
            </button>
          </div>
        </div>

        {/* Abas dos 4 Modelos Oficiais */}
        <div className={styles.templateTabs}>
          <button
            type="button"
            className={`${styles.templateTab} ${template === "recibo" ? styles.templateTabActive : ""}`}
            onClick={() => setTemplate("recibo")}
          >
            <FileText size={16} /> Recibo de Pagamento de Aluguel
          </button>
          <button
            type="button"
            className={`${styles.templateTab} ${template === "contrato" ? styles.templateTabActive : ""}`}
            onClick={() => setTemplate("contrato")}
          >
            <FileSignature size={16} /> Contrato de Locação Padrão
          </button>
          <button
            type="button"
            className={`${styles.templateTab} ${template === "vistoria" ? styles.templateTabActive : ""}`}
            onClick={() => setTemplate("vistoria")}
          >
            <ShieldCheck size={16} /> Termo de Vistoria Predial
          </button>
          <button
            type="button"
            className={`${styles.templateTab} ${template === "prestacao" ? styles.templateTabActive : ""}`}
            onClick={() => setTemplate("prestacao")}
          >
            <FileCheck size={16} /> Prestação de Contas Trimestral
          </button>
        </div>

        {/* Duas Colunas: Formulário à Esquerda + Visualização em Tempo Real à Direita */}
        <div className={styles.twoColumns}>
          {/* Coluna 1: Campos do Formulário */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionHeading}>Parâmetros do Documento</h3>

            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label>Imóvel Vinculado</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={imovel}
                  onChange={(e) => setImovel(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Data de Emissão</label>
                <input
                  type="date"
                  className={styles.inputField}
                  value={dataEmissao}
                  onChange={(e) => setDataEmissao(e.target.value)}
                />
              </div>
            </div>

            {template !== "prestacao" && (
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label>Nome do Inquilino / Locatário</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={inquilino}
                    onChange={(e) => setInquilino(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>CPF / CNPJ</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                  />
                </div>
              </div>
            )}

            {template === "recibo" && (
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label>Mês de Referência</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Valor Líquido Quitado (R$)</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
              </div>
            )}

            {template === "contrato" && (
              <>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label>Valor Mensal do Aluguel (R$)</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Prazo de Vigência (Meses)</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={prazoMeses}
                      onChange={(e) => setPrazoMeses(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label>Garantia Locatícia</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={garantia}
                    onChange={(e) => setGarantia(e.target.value)}
                  />
                </div>
              </>
            )}

            {template === "vistoria" && (
              <>
                <div className={styles.fieldGroup}>
                  <label>Estado da Pintura e Paredes</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={estadoPintura}
                    onChange={(e) => setEstadoPintura(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Instalações Hidráulicas e Elétricas</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={instalacoes}
                    onChange={(e) => setInstalacoes(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Chaves Entregues</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={chaves}
                    onChange={(e) => setChaves(e.target.value)}
                  />
                </div>
              </>
            )}

            {template === "prestacao" && (
              <>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label>Total de Receitas do Período (R$)</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={totalReceitas}
                      onChange={(e) => setTotalReceitas(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Total de Despesas Operacionais (R$)</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={totalDespesas}
                      onChange={(e) => setTotalDespesas(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label>Finalidade e Destinação Estatutária</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={destinacao}
                    onChange={(e) => setDestinacao(e.target.value)}
                  />
                </div>
              </>
            )}

            <div style={{ marginTop: 12, padding: "10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", color: "#475569" }}>
              💡 Os dados preenchidos são formatados em tempo real na folha ao lado com timbres oficiais da Fundação.
            </div>
          </div>

          {/* Coluna 2: Folha Oficial Formatada (Pré-visualização) */}
          <div className={styles.previewCard}>
            <div>
              <div className={styles.previewHeader}>
                <h2>FUNDAÇÃO MANUEL CRUZ</h2>
                <p>INSTITUIÇÃO FILANTRÓPICA DE GESTÃO PATRIMONIAL E SOCIAL • FUNDADA EM 1941</p>
                <p>CNPJ: 00.123.456/0001-00 • RECIFE - PE</p>
              </div>

              {template === "recibo" && (
                <>
                  <div className={styles.previewTitle}>RECIBO OFICIAL DE QUITAÇÃO DE ALUGUEL</div>
                  <div className={styles.previewBody}>
                    <p>
                      Declaramos para os devidos fins que recebemos do(a) Sr.(a) <strong>{inquilino}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{cpfCnpj}</strong>, a quantia líquida e certa de <strong>R$ {valor}</strong>, referente ao pagamento do aluguel do imóvel localizado em <strong>{imovel}</strong>, correspondente ao mês de referência de <strong>{mesReferencia}</strong>.
                    </p>
                    <p>
                      Com o pagamento desta quantia, a <strong>FUNDAÇÃO MANUEL CRUZ</strong> confere plena, rasa e geral quitação das obrigações locatícias ordinárias do período acima mencionado.
                    </p>
                  </div>
                </>
              )}

              {template === "contrato" && (
                <>
                  <div className={styles.previewTitle}>INSTRUMENTO PARTICULAR DE LOCAÇÃO IMOBILIÁRIA</div>
                  <div className={styles.previewBody}>
                    <p>
                      Pelo presente instrumento, de um lado a <strong>FUNDAÇÃO MANUEL CRUZ</strong>, inscrita no CNPJ sob o nº 00.123.456/0001-00, doravante denominada <strong>LOCADORA</strong>, e de outro lado <strong>{inquilino}</strong>, portador(a) do CPF/CNPJ nº <strong>{cpfCnpj}</strong>, denominado(a) <strong>LOCATÁRIO(A)</strong>, têm entre si justo e acordado:
                    </p>
                    <p>
                      <strong>CLÁUSULA PRIMEIRA:</strong> O objeto deste contrato é a locação do imóvel situado em <strong>{imovel}</strong>, pelo prazo determinado de <strong>{prazoMeses} meses</strong>.
                    </p>
                    <p>
                      <strong>CLÁUSULA SEGUNDA:</strong> O aluguel mensal ajustado é de <strong>R$ {valor}</strong>, pagável até o 10º dia útil de cada mês. Garantia: {garantia}.
                    </p>
                  </div>
                </>
              )}

              {template === "vistoria" && (
                <>
                  <div className={styles.previewTitle}>TERMO DE VISTORIA E RECEBIMENTO DE IMÓVEL</div>
                  <div className={styles.previewBody}>
                    <p>
                      Aos <strong>{dataEmissao}</strong>, realizou-se a vistoria técnica e cadastral do imóvel <strong>{imovel}</strong>, destinado à ocupação por <strong>{inquilino}</strong> (CPF/CNPJ: {cpfCnpj}).
                    </p>
                    <p>
                      <strong>1. Estado de Conservação Geral:</strong> {estadoPintura}.<br />
                      <strong>2. Instalações Hidráulicas e Elétricas:</strong> {instalacoes}.<br />
                      <strong>3. Claves Entregues:</strong> {chaves}.
                    </p>
                    <p>As partes conferem e atestam as condições acima descritas sem ressalvas.</p>
                  </div>
                </>
              )}

              {template === "prestacao" && (
                <>
                  <div className={styles.previewTitle}>RELATÓRIO DE PRESTAÇÃO DE CONTAS TRIMESTRAL</div>
                  <div className={styles.previewBody}>
                    <p>
                      A <strong>FUNDAÇÃO MANUEL CRUZ</strong> apresenta perante a Curadoria de Fundações do Ministério Público a prestação de contas dos imóveis geridos referente a <strong>{mesReferencia}</strong>:
                    </p>
                    <p>
                      • <strong>Receitas Brutas Arrecadadas:</strong> R$ {totalReceitas}<br />
                      • <strong>Despesas Operacionais e Manutenção:</strong> R$ {totalDespesas}<br />
                      • <strong>Destinação dos Recursos:</strong> {destinacao}.
                    </p>
                    <p>Todos os balancetes e notas fiscais encontram-se digitalizados e autenticados no acervo central.</p>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className={styles.previewSignatures}>
                <div className={styles.signatureLine}>
                  <strong>FUNDAÇÃO MANUEL CRUZ</strong>
                  <br />
                  Gestor de Patrimônio / Representante Legal
                </div>
                <div className={styles.signatureLine}>
                  <strong>{template === "prestacao" ? "CURADORIA DE FUNDAÇÕES (MP)" : inquilino}</strong>
                  <br />
                  {template === "prestacao" ? "Fiscalização Ministerial" : "Locatário(a) / Declarante"}
                </div>
              </div>

              <div className={styles.previewFooterStamp}>
                <span>Data de Registro: {dataEmissao}</span>
                <span>Chave Digital: {authKey}</span>
              </div>
            </div>
          </div>
        </div>

        {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
      </div>
    </AppShell>
  );
}
