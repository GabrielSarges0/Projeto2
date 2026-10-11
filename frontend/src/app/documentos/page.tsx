"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Plus,
  QrCode,
  Search,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import styles from "./documentos.module.css";

type DocItem = {
  id: string;
  protocol: string;
  title: string;
  category: "Contratos" | "Comprovantes" | "Ministério Público" | "Laudos";
  propertyRef: string;
  date: string;
  status: "VÁLIDO" | "PENDENTE" | "ARQUIVADO";
  fileSize: string;
};

const initialDocuments: DocItem[] = [
  {
    id: "1",
    protocol: "DOC-2026-081",
    title: "Contrato de Locação Residencial",
    category: "Contratos",
    propertyRef: "IM-001 (João Pedro Cavalcanti)",
    date: "10/10/2025",
    status: "VÁLIDO",
    fileSize: "2.4 MB",
  },
  {
    id: "2",
    protocol: "DOC-2026-075",
    title: "Termo de Vistoria Inicial de Entrada",
    category: "Laudos",
    propertyRef: "IM-001 (Apto 402 - Graças)",
    date: "08/10/2025",
    status: "VÁLIDO",
    fileSize: "5.1 MB",
  },
  {
    id: "3",
    protocol: "DOC-2026-068",
    title: "Contrato de Locação Comercial",
    category: "Contratos",
    propertyRef: "IM-002 (Maria Helena Silva)",
    date: "01/11/2025",
    status: "VÁLIDO",
    fileSize: "1.8 MB",
  },
  {
    id: "4",
    protocol: "DOC-2026-052",
    title: "Ata de Reunião da Diretoria nº 14/2026",
    category: "Ministério Público",
    propertyRef: "Governança FMC",
    date: "15/09/2026",
    status: "VÁLIDO",
    fileSize: "840 KB",
  },
  {
    id: "5",
    protocol: "DOC-2026-041",
    title: "Relatório Semestral de Prestação de Contas (MP)",
    category: "Ministério Público",
    propertyRef: "Curadoria de Fundações",
    date: "01/09/2026",
    status: "PENDENTE",
    fileSize: "4.6 MB",
  },
  {
    id: "6",
    protocol: "DOC-2026-033",
    title: "Comprovante de Pagamento de IPTU - Exercício 2026",
    category: "Comprovantes",
    propertyRef: "IM-001 / IM-002",
    date: "10/08/2026",
    status: "VÁLIDO",
    fileSize: "320 KB",
  },
  {
    id: "7",
    protocol: "DOC-2026-019",
    title: "Laudo de Manutenção Hidráulica e Elétrica",
    category: "Laudos",
    propertyRef: "IM-001 (Prestador Rocha)",
    date: "10/10/2026",
    status: "VÁLIDO",
    fileSize: "1.2 MB",
  },
];

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<DocItem[]>(initialDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modais
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [newDocModalOpen, setNewDocModalOpen] = useState(false);
  const [sendDocModalOpen, setSendDocModalOpen] = useState(false);
  const [viewDocModal, setViewDocModal] = useState<DocItem | null>(null);

  // Formulário Novo Documento
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<DocItem["category"]>("Contratos");
  const [newProperty, setNewProperty] = useState("IM-001");
  const [newDate, setNewDate] = useState("2026-10-11");

  // Formulário Envio
  const [sendRecipient, setSendRecipient] = useState("Ministério Público - Curadoria");
  const [sendDocId, setSendDocId] = useState("");
  const [sendNotes, setSendNotes] = useState("");

  // QR Code Simulator
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("fmc_docs");
    if (saved) {
      try {
        setDocuments(JSON.parse(saved) as DocItem[]);
      } catch {
        // mantém padrão
      }
    }
  }, []);

  function saveDocuments(docs: DocItem[]) {
    setDocuments(docs);
    try {
      localStorage.setItem("fmc_docs", JSON.stringify(docs));
    } catch {
      // ignora
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  }

  // Filtragem
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === "TODOS" || doc.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      doc.title.toLowerCase().includes(term) ||
      doc.protocol.toLowerCase().includes(term) ||
      doc.propertyRef.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: DocItem = {
      id: String(Date.now()),
      protocol: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      category: newCategory,
      propertyRef: newProperty.trim(),
      date: newDate.split("-").reverse().join("/"),
      status: "VÁLIDO",
      fileSize: "1.5 MB",
    };

    const updated = [newDoc, ...documents];
    saveDocuments(updated);
    setNewDocModalOpen(false);
    setNewTitle("");
    showToast(`Documento ${newDoc.protocol} cadastrado com sucesso!`);
  }

  function handleSendDocument(e: React.FormEvent) {
    e.preventDefault();
    setSendDocModalOpen(false);
    showToast(`Documento transmitido com protocolo oficial para: ${sendRecipient}`);
    setSendNotes("");
  }

  function handleSimulateQrScan() {
    const target = documents.find(
      (d) => d.protocol.toLowerCase() === qrCodeInput.trim().toLowerCase()
    );
    if (target) {
      setQrScanResult(`Autêntico: ${target.protocol} - ${target.title} (${target.status})`);
    } else {
      setQrScanResult(`QR Code validado com sucesso na base FMC. Protocolo: FMC-REG-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }

  return (
    <div className={styles.documentosShell}>
      <Sidebar />

      <main className={styles.documentosMain}>
        <div className={styles.documentosCanvas}>
          {/* Toolbar Exata do Figma */}
          <div className={styles.topToolbar}>
            <div className={styles.leftActionGroup}>
              {/* digitalize-o-codigo-qr 1 (32x32) */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.qrIconBtn}`}
                title="Escanear e validar QR Code de autenticidade documental"
                aria-label="Digitalizar código QR"
                onClick={() => {
                  setQrScanResult(null);
                  setQrCodeInput("");
                  setQrModalOpen(true);
                }}
              >
                <QrCode size={32} />
              </button>

              {/* mais 3 (40x40) */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.addIconBtn}`}
                title="Adicionar novo documento à fundação"
                aria-label="Adicionar documento"
                onClick={() => setNewDocModalOpen(true)}
              >
                <Plus size={24} strokeWidth={2.5} />
              </button>

              {/* envio 1 (36x36) */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.sendIconBtn}`}
                title="Enviar documento para Ministério Público ou Inquilino"
                aria-label="Enviar documento"
                onClick={() => {
                  setSendDocId(documents[0]?.protocol ?? "");
                  setSendDocModalOpen(true);
                }}
              >
                <Send size={32} />
              </button>
            </div>

            {/* Barra de Busca Exata: Rectangle 15, Rectangle 14, Rectangle 16 */}
            <div className={styles.searchBarContainer}>
              <div className={styles.searchIconBox} aria-hidden="true">
                <Search size={22} />
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar documentos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar documentos"
              />
              <button
                type="button"
                className={`${styles.filterIconBtn} ${showFilterMenu ? styles.filterIconBtnActive : ""}`}
                title="Filtrar documentos por tipo"
                aria-label="Filtro de documentos"
                onClick={() => setShowFilterMenu((v) => !v)}
              >
                <Filter size={20} />
              </button>
            </div>
          </div>

          {/* Categorias / Filtro Rápido */}
          <nav className={styles.categoryTabs} aria-label="Categorias de documentos">
            {["TODOS", "Contratos", "Ministério Público", "Comprovantes", "Laudos"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.tabBtn} ${
                    selectedCategory === cat ? styles.tabBtnActive : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              )
            )}
          </nav>

          {/* Painel com Tabela de Documentos */}
          <section className={styles.documentsPanel}>
            <div className={styles.panelTopHeader}>
              <h2>ACERVO DOCUMENTAL DA FUNDAÇÃO MANUEL CRUZ</h2>
              <span className={styles.panelCountBadge}>
                {filteredDocuments.length} documento(s) encontrado(s)
              </span>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className={styles.emptyDocs}>
                Nenhum documento encontrado com os critérios de busca selecionados.
              </div>
            ) : (
              <table className={styles.docTable}>
                <thead>
                  <tr>
                    <th>Protocolo</th>
                    <th>Documento</th>
                    <th>Categoria</th>
                    <th>Referência / Imóvel</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className={styles.docRow}>
                      <td>
                        <span className={styles.protocolBadge}>{doc.protocol}</span>
                      </td>
                      <td>
                        <div className={styles.docTitleCell}>
                          <span className={styles.docTitle}>{doc.title}</span>
                          <span className={styles.docSubtitle}>{doc.fileSize} · PDF Assinado Digitalmente</span>
                        </div>
                      </td>
                      <td>{doc.category}</td>
                      <td>{doc.propertyRef}</td>
                      <td>{doc.date}</td>
                      <td>
                        <span
                          className={`${styles.statusTag} ${
                            doc.status === "VÁLIDO"
                              ? styles.statusValido
                              : doc.status === "PENDENTE"
                              ? styles.statusPendente
                              : styles.statusArquivado
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={styles.actionBtnSmall}
                            title="Visualizar documento"
                            aria-label={`Visualizar ${doc.title}`}
                            onClick={() => setViewDocModal(doc)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtnSmall}
                            title="Baixar arquivo oficial"
                            aria-label={`Baixar ${doc.title}`}
                            onClick={() => showToast(`Download do arquivo ${doc.protocol}.pdf iniciado!`)}
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>

      {/* Modal 1: Leitor e Validador QR Code */}
      {qrModalOpen ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setQrModalOpen(false)}>
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>DIGITALIZAÇÃO E VALIDAÇÃO QR CODE</h2>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setQrModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <div className={styles.scannerViewfinder}>
              <div className={styles.scanLine} />
              <QrCode size={64} style={{ opacity: 0.4 }} />
              <span style={{ marginTop: "12px", fontSize: "13px" }}>
                Aponte a câmera ou insira o código abaixo para validar autenticidade
              </span>
            </div>

            <div className={styles.formGroup}>
              <label>Código ou Hash do QR Code (ex: DOC-2026-081):</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Insira o protocolo do documento..."
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
              />
            </div>

            {qrScanResult ? (
              <div
                style={{
                  padding: "12px",
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  borderRadius: "6px",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={18} />
                <span>{qrScanResult}</span>
              </div>
            ) : null}

            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setQrModalOpen(false)}>
                Fechar
              </button>
              <button type="button" className={styles.confirmBtn} onClick={handleSimulateQrScan}>
                Validar QR Code
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal 2: Adicionar Novo Documento */}
      {newDocModalOpen ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setNewDocModalOpen(false)}>
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>CADASTRAR NOVO DOCUMENTO</h2>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setNewDocModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument}>
              <div className={styles.formGroup}>
                <label>Título do Documento:</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: Contrato de Locação - IM-003"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Categoria:</label>
                <select
                  className={styles.formInput}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DocItem["category"])}
                >
                  <option value="Contratos">Contratos de Locação</option>
                  <option value="Ministério Público">Ministério Público & Atas</option>
                  <option value="Comprovantes">Comprovantes & Faturas</option>
                  <option value="Laudos">Laudos e Vistorias</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Imóvel / Referência:</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: IM-001 (Apto 402)"
                  value={newProperty}
                  onChange={(e) => setNewProperty(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Data de Emissão:</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Arquivo Digital (PDF / Imagem):</label>
                <div
                  className={styles.fileDropzone}
                  onClick={() => showToast("Arquivo pronto para upload.")}
                >
                  <UploadCloud size={32} color="#092a54" />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    Clique ou arraste o documento em PDF aqui
                  </span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>
                    Tamanho máximo: 25 MB (Assinatura digital ICP-Brasil aceita)
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setNewDocModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Salvar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal 3: Envio de Documento */}
      {sendDocModalOpen ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setSendDocModalOpen(false)}>
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>TRANSMISSÃO OFICIAL DE DOCUMENTO</h2>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setSendDocModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSendDocument}>
              <div className={styles.formGroup}>
                <label>Documento a Enviar:</label>
                <select
                  className={styles.formInput}
                  value={sendDocId}
                  onChange={(e) => setSendDocId(e.target.value)}
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.protocol}>
                      {d.protocol} - {d.title} ({d.propertyRef})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Destinatário Oficial:</label>
                <select
                  className={styles.formInput}
                  value={sendRecipient}
                  onChange={(e) => setSendRecipient(e.target.value)}
                >
                  <option value="Ministério Público - Curadoria de Fundações">
                    Ministério Público - Curadoria de Fundações
                  </option>
                  <option value="Inquilino / Locatário">Inquilino / Locatário</option>
                  <option value="Assessoria Jurídica e Contábil">Assessoria Jurídica e Contábil</option>
                  <option value="Conselho Fiscal e Curador da FMC">Conselho Fiscal e Curador da FMC</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Observações ou Despacho de Envio:</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Escreva detalhes do protocolo ou comprovante de transmissão..."
                  value={sendNotes}
                  onChange={(e) => setSendNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setSendDocModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Transmitir Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal 4: Visualizar Documento */}
      {viewDocModal ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setViewDocModal(null)}>
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>DETALHES DO DOCUMENTO</h2>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setViewDocModal(null)}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div>
                <strong>Protocolo:</strong> {viewDocModal.protocol}
              </div>
              <div>
                <strong>Título:</strong> {viewDocModal.title}
              </div>
              <div>
                <strong>Categoria:</strong> {viewDocModal.category}
              </div>
              <div>
                <strong>Imóvel / Destino:</strong> {viewDocModal.propertyRef}
              </div>
              <div>
                <strong>Data de Registro:</strong> {viewDocModal.date}
              </div>
              <div>
                <strong>Tamanho:</strong> {viewDocModal.fileSize}
              </div>
              <div>
                <strong>Status de Validade:</strong>{" "}
                <span style={{ color: viewDocModal.status === "VÁLIDO" ? "#166534" : "#854d0e", fontWeight: 700 }}>
                  {viewDocModal.status}
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setViewDocModal(null)}>
                Fechar
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => {
                  showToast(`Download de ${viewDocModal.protocol}.pdf concluído com sucesso!`);
                  setViewDocModal(null);
                }}
              >
                Baixar PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast Alert */}
      {toastMessage ? (
        <div className={styles.toastAlert} role="status">
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
