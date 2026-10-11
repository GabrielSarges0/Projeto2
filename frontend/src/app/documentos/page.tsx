"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CloudUpload,
  Download,
  FileText,
  Filter,
  Folder,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import styles from "./documentos.module.css";

type FolderItem = {
  id: string;
  name: string;
};

type FileItem = {
  id: string;
  name: string;
  folderId?: string;
  size: string;
};

const initialFolders: FolderItem[] = [
  { id: "1", name: "Ministério Público" },
  { id: "2", name: "Pasta_01" },
  { id: "3", name: "Pasta_02" },
  { id: "4", name: "Pasta_03" },
];

const initialFiles: FileItem[] = [
  { id: "1", name: "Documento_00", size: "2.4 MB" },
  { id: "2", name: "Documento_01", size: "1.8 MB" },
  { id: "3", name: "Documento_02", size: "840 KB" },
  { id: "4", name: "Documento_03", size: "3.1 MB" },
  { id: "5", name: "Documento_04", size: "1.2 MB" },
];

export default function DocumentosPage() {
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newType, setNewType] = useState<"folder" | "file">("file");
  const [newItemName, setNewItemName] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: "folder" | "file"; name: string } | null>(null);

  const [viewDocModal, setViewDocModal] = useState<FileItem | null>(null);

  // QR Code
  const [qrInput, setQrInput] = useState("");
  const [qrResult, setQrResult] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const savedFolders = localStorage.getItem("fmc_folders_v2");
    const savedFiles = localStorage.getItem("fmc_files_v2");
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch {}
    }
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch {}
    }
  }, []);

  function saveFolders(items: FolderItem[]) {
    setFolders(items);
    try {
      localStorage.setItem("fmc_folders_v2", JSON.stringify(items));
    } catch {}
  }

  function saveFiles(items: FileItem[]) {
    setFiles(items);
    try {
      localStorage.setItem("fmc_files_v2", JSON.stringify(items));
    } catch {}
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  }

  // Filtragem pela busca
  const term = searchTerm.toLowerCase();
  const filteredFolders = folders.filter((f) => !term || f.name.toLowerCase().includes(term));
  const filteredFiles = files.filter((f) => !term || f.name.toLowerCase().includes(term));

  function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;

    if (newType === "folder") {
      const updated = [...folders, { id: String(Date.now()), name }];
      saveFolders(updated);
      showToast(`Pasta "${name}" criada com sucesso!`);
    } else {
      const updated = [...files, { id: String(Date.now()), name, size: "1.5 MB" }];
      saveFiles(updated);
      showToast(`Documento "${name}" adicionado com sucesso!`);
    }

    setNewItemName("");
    setNewModalOpen(false);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    if (editingItem.type === "folder") {
      const updated = folders.map((f) => (f.id === editingItem.id ? { ...f, name: editingItem.name.trim() } : f));
      saveFolders(updated);
      showToast(`Pasta renomeada para "${editingItem.name.trim()}".`);
    } else {
      const updated = files.map((f) => (f.id === editingItem.id ? { ...f, name: editingItem.name.trim() } : f));
      saveFiles(updated);
      showToast(`Documento renomeado para "${editingItem.name.trim()}".`);
    }

    setEditingItem(null);
    setEditModalOpen(false);
  }

  function handleDeleteFolder(id: string, name: string) {
    if (!confirm(`Deseja realmente excluir a pasta "${name}"?`)) return;
    const updated = folders.filter((f) => f.id !== id);
    saveFolders(updated);
    showToast(`Pasta "${name}" excluída.`);
  }

  function handleDeleteFile(id: string, name: string) {
    if (!confirm(`Deseja realmente excluir o documento "${name}"?`)) return;
    const updated = files.filter((f) => f.id !== id);
    saveFiles(updated);
    showToast(`Documento "${name}" excluído.`);
  }

  function handleSimulateQrScan() {
    const found = files.find((f) => f.name.toLowerCase() === qrInput.trim().toLowerCase());
    if (found) {
      setQrResult(`Autêntico: ${found.name} (Validado no banco oficial da Fundação Manuel Cruz).`);
    } else {
      setQrResult(`QR Code FMC-REG-${Math.floor(10000 + Math.random() * 90000)} validado com sucesso!`);
    }
  }

  return (
    <div className={styles.documentosShell}>
      <Sidebar />

      <main className={styles.documentosMain}>
        <div className={styles.documentosCanvas}>
          {/* Top Toolbar Exata do Figma */}
          <div className={styles.topToolbar}>
            <div className={styles.leftActionGroup}>
              {/* digitalize-o-codigo-qr 1 */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.qrIconBtn}`}
                title="Escanear e validar código QR"
                aria-label="Digitalizar código QR"
                onClick={() => {
                  setQrResult(null);
                  setQrInput("");
                  setQrModalOpen(true);
                }}
              >
                <QrCode size={28} strokeWidth={1.8} />
              </button>

              {/* mais 3 */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.addIconBtn}`}
                title="Criar nova pasta ou documento"
                aria-label="Adicionar"
                onClick={() => {
                  setNewType("file");
                  setNewItemName("");
                  setNewModalOpen(true);
                }}
              >
                <Plus size={30} strokeWidth={2.2} />
              </button>

              {/* envio 1 */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.sendIconBtn}`}
                title="Fazer upload de documento"
                aria-label="Enviar documento"
                onClick={() => {
                  setNewType("file");
                  setNewItemName("Documento_Novo");
                  setNewModalOpen(true);
                }}
              >
                <CloudUpload size={30} strokeWidth={1.8} />
              </button>
            </div>

            {/* Barra de Busca Exata: Rectangle 15, Rectangle 14, Rectangle 16 */}
            <div className={styles.searchBarContainer}>
              <div className={styles.searchIconBox} aria-hidden="true">
                <Search size={22} strokeWidth={2} />
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
                className={styles.filterIconBtn}
                title="Filtro"
                aria-label="Filtro de documentos"
                onClick={() => showToast("Filtro ativo")}
              >
                <Filter size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Duas Colunas do Figma: Pastas e Documentos sem pasta */}
          <div className={styles.documentosGrid}>
            {/* Coluna 1: Pastas */}
            <section className={styles.columnSection} aria-label="Pastas">
              <div className={styles.columnHeader}>
                <h2 className={styles.columnTitle}>Pastas</h2>
                <button
                  type="button"
                  className={styles.columnAddBtn}
                  onClick={() => {
                    setNewType("folder");
                    setNewItemName("");
                    setNewModalOpen(true);
                  }}
                  title="Criar nova pasta"
                >
                  <Plus size={14} />
                  <span>Nova pasta</span>
                </button>
              </div>

              {filteredFolders.length === 0 ? (
                <div className={styles.emptyStateCol}>Nenhuma pasta encontrada.</div>
              ) : (
                filteredFolders.map((folder) => (
                  <div key={folder.id} className={styles.itemCardRow}>
                    <div
                      className={styles.itemCardLeft}
                      onClick={() => showToast(`Abrindo pasta "${folder.name}"`)}
                      title={`Abrir pasta ${folder.name}`}
                    >
                      <Folder size={22} className={styles.itemCardIcon} strokeWidth={1.8} />
                      <span className={styles.itemCardName}>{folder.name}</span>
                    </div>
                    <div className={styles.itemCardActions}>
                      <button
                        type="button"
                        className={styles.actionIconBtnRow}
                        title="Renomear pasta"
                        aria-label={`Renomear ${folder.name}`}
                        onClick={() => {
                          setEditingItem({ id: folder.id, type: "folder", name: folder.name });
                          setEditModalOpen(true);
                        }}
                      >
                        <Pencil size={18} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtnRow}
                        title="Excluir pasta"
                        aria-label={`Excluir ${folder.name}`}
                        onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      >
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Coluna 2: Documentos sem pasta */}
            <section className={styles.columnSection} aria-label="Documentos sem pasta">
              <div className={styles.columnHeader}>
                <h2 className={styles.columnTitle}>Documentos sem pasta</h2>
                <button
                  type="button"
                  className={styles.columnAddBtn}
                  onClick={() => {
                    setNewType("file");
                    setNewItemName("");
                    setNewModalOpen(true);
                  }}
                  title="Adicionar novo documento"
                >
                  <Plus size={14} />
                  <span>Novo documento</span>
                </button>
              </div>

              {filteredFiles.length === 0 ? (
                <div className={styles.emptyStateCol}>Nenhum documento encontrado.</div>
              ) : (
                filteredFiles.map((file) => (
                  <div key={file.id} className={styles.itemCardRow}>
                    <div
                      className={styles.itemCardLeft}
                      onClick={() => setViewDocModal(file)}
                      title={`Visualizar ${file.name}`}
                    >
                      <FileText size={22} className={styles.itemCardIcon} strokeWidth={1.8} />
                      <span className={styles.itemCardName}>{file.name}</span>
                    </div>
                    <div className={styles.itemCardActions}>
                      <button
                        type="button"
                        className={styles.actionIconBtnRow}
                        title="Baixar documento"
                        aria-label={`Baixar ${file.name}`}
                        onClick={() => showToast(`Download de "${file.name}.pdf" iniciado.`)}
                      >
                        <Download size={18} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtnRow}
                        title="Renomear documento"
                        aria-label={`Renomear ${file.name}`}
                        onClick={() => {
                          setEditingItem({ id: file.id, type: "file", name: file.name });
                          setEditModalOpen(true);
                        }}
                      >
                        <Pencil size={18} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionIconBtnRow}
                        title="Excluir documento"
                        aria-label={`Excluir ${file.name}`}
                        onClick={() => handleDeleteFile(file.id, file.name)}
                      >
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Modal: Criar Item (Pasta ou Documento) */}
      {newModalOpen ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setNewModalOpen(false)}>
          <div className={styles.docModalCard} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.docModalHeader}>
              <h2>{newType === "folder" ? "CRIAR NOVA PASTA" : "ADICIONAR DOCUMENTO"}</h2>
              <button type="button" className={styles.closeCircleBtn} onClick={() => setNewModalOpen(false)} aria-label="Fechar">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className={styles.formGroup}>
                <label>Tipo:</label>
                <select
                  className={styles.formInput}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "folder" | "file")}
                >
                  <option value="file">Documento</option>
                  <option value="folder">Pasta</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{newType === "folder" ? "Nome da Pasta:" : "Nome do Documento:"}</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder={newType === "folder" ? "Ex: Pasta_04" : "Ex: Documento_05"}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {newType === "file" ? (
                <div className={styles.formGroup}>
                  <label>Arquivo:</label>
                  <div className={styles.fileDropzone} onClick={() => showToast("Arquivo anexado com sucesso.")}>
                    <CloudUpload size={32} color="#092a54" />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Clique para anexar o arquivo</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Formatos suportados: PDF, DOCX, Imagens</span>
                  </div>
                </div>
              ) : null}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setNewModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal: Editar/Renomear Item */}
      {editModalOpen && editingItem ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setEditModalOpen(false)}>
          <div className={styles.docModalCard} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.docModalHeader}>
              <h2>RENOMEAR {editingItem.type === "folder" ? "PASTA" : "DOCUMENTO"}</h2>
              <button type="button" className={styles.closeCircleBtn} onClick={() => setEditModalOpen(false)} aria-label="Fechar">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className={styles.formGroup}>
                <label>Novo Nome:</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal: Visualizar Documento */}
      {viewDocModal ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setViewDocModal(null)}>
          <div className={styles.docModalCard} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.docModalHeader}>
              <h2>VISUALIZAÇÃO DE DOCUMENTO</h2>
              <button type="button" className={styles.closeCircleBtn} onClick={() => setViewDocModal(null)} aria-label="Fechar">
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div><strong>Nome:</strong> {viewDocModal.name}</div>
              <div><strong>Tamanho:</strong> {viewDocModal.size}</div>
              <div><strong>Formato:</strong> PDF Digitalizado (FMC)</div>
              <div><strong>Status:</strong> Assinado e Válido</div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setViewDocModal(null)}>
                Fechar
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => {
                  showToast(`Download de "${viewDocModal.name}.pdf" concluído.`);
                  setViewDocModal(null);
                }}
              >
                Baixar Arquivo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: QR Code Scanner */}
      {qrModalOpen ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setQrModalOpen(false)}>
          <div className={styles.docModalCard} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.docModalHeader}>
              <h2>VALIDAÇÃO QR CODE</h2>
              <button type="button" className={styles.closeCircleBtn} onClick={() => setQrModalOpen(false)} aria-label="Fechar">
                <X size={14} />
              </button>
            </div>

            <div className={styles.scannerViewfinder}>
              <div className={styles.scanLine} />
              <QrCode size={56} style={{ opacity: 0.4 }} />
              <span style={{ marginTop: "12px", fontSize: "13px" }}>Aponte para o QR Code impresso no documento</span>
            </div>

            <div className={styles.formGroup}>
              <label>Ou digite o nome/protocolo:</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Ex: Documento_00"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
            </div>

            {qrResult ? (
              <div
                style={{
                  padding: "10px 14px",
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
                <span>{qrResult}</span>
              </div>
            ) : null}

            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setQrModalOpen(false)}>
                Fechar
              </button>
              <button type="button" className={styles.confirmBtn} onClick={handleSimulateQrScan}>
                Validar
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
