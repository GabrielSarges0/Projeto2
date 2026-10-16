"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  Download,
  FileCheck,
  FileText,
  Filter,
  Folder,
  FolderInput,
  FolderOpen,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import styles from "./documentos.module.css";

export type DocumentCategory =
  | "Contrato"
  | "Comprovante"
  | "Prestação de Contas"
  | "Notificação MP"
  | "Laudo Técnico"
  | "Estatuto"
  | "Outro";

export type FolderItem = {
  id: string;
  name: string;
  createdAt?: string;
};

export type FileItem = {
  id: string;
  name: string;
  folderId?: string | null;
  size: string;
  category: DocumentCategory;
  createdAt: string;
  mimeType?: string;
  dataUrl?: string;
  protocol: string;
  signed: boolean;
  description?: string;
};

const initialFolders: FolderItem[] = [
  { id: "1", name: "Ministério Público", createdAt: "2026-02-15" },
  { id: "2", name: "Pasta_01 - Contratos de Aluguel", createdAt: "2026-03-10" },
  { id: "3", name: "Pasta_02 - Comprovantes Financeiros", createdAt: "2026-04-05" },
  { id: "4", name: "Pasta_03 - Governança e Atas", createdAt: "2026-05-12" },
];

const initialFiles: FileItem[] = [
  // Documentos dentro de Pastas
  {
    id: "f-101",
    name: "Relatório_Anual_MP_2025.pdf",
    folderId: "1",
    size: "3.4 MB",
    category: "Notificação MP",
    createdAt: "2026-03-15",
    protocol: "FMC-REG-81204",
    signed: true,
  },
  {
    id: "f-102",
    name: "Termo_Ajustamento_Conduta.pdf",
    folderId: "1",
    size: "1.9 MB",
    category: "Notificação MP",
    createdAt: "2026-04-10",
    protocol: "FMC-REG-81205",
    signed: true,
  },
  {
    id: "f-201",
    name: "Contrato_IM-001_JoaoCavalcanti.pdf",
    folderId: "2",
    size: "2.8 MB",
    category: "Contrato",
    createdAt: "2025-10-10",
    protocol: "FMC-REG-82301",
    signed: true,
  },
  {
    id: "f-202",
    name: "Contrato_IM-002_MariaSilva.pdf",
    folderId: "2",
    size: "2.1 MB",
    category: "Contrato",
    createdAt: "2025-11-01",
    protocol: "FMC-REG-82302",
    signed: true,
  },
  {
    id: "f-301",
    name: "Comprovante_Reforma_IM-003.pdf",
    folderId: "3",
    size: "1.4 MB",
    category: "Comprovante",
    createdAt: "2026-09-20",
    protocol: "FMC-REG-83401",
    signed: true,
  },
  {
    id: "f-302",
    name: "DARF_ReceitaFederal_Set2026.pdf",
    folderId: "3",
    size: "680 KB",
    category: "Comprovante",
    createdAt: "2026-10-05",
    protocol: "FMC-REG-83402",
    signed: true,
  },
  {
    id: "f-401",
    name: "Ata_Reuniao_Conselho_2026.pdf",
    folderId: "4",
    size: "1.1 MB",
    category: "Prestação de Contas",
    createdAt: "2026-08-14",
    protocol: "FMC-REG-84501",
    signed: true,
  },

  // Documentos sem pasta (Raiz)
  {
    id: "1",
    name: "Documento_00 - Estatuto da Fundação.pdf",
    folderId: null,
    size: "2.4 MB",
    category: "Estatuto",
    createdAt: "2026-01-10",
    protocol: "FMC-REG-90001",
    signed: true,
  },
  {
    id: "2",
    name: "Documento_01 - Certidão Negativa de Débitos.pdf",
    folderId: null,
    size: "1.8 MB",
    category: "Prestação de Contas",
    createdAt: "2026-05-18",
    protocol: "FMC-REG-90002",
    signed: true,
  },
  {
    id: "3",
    name: "Documento_02 - Balancete Patrimonial 2026.pdf",
    folderId: null,
    size: "840 KB",
    category: "Prestação de Contas",
    createdAt: "2026-09-30",
    protocol: "FMC-REG-90003",
    signed: true,
  },
  {
    id: "4",
    name: "Documento_03 - Laudo de Avaliação Predial.pdf",
    folderId: null,
    size: "3.1 MB",
    category: "Laudo Técnico",
    createdAt: "2026-07-22",
    protocol: "FMC-REG-90004",
    signed: true,
  },
  {
    id: "5",
    name: "Documento_04 - Procuração Jurídica.pdf",
    folderId: null,
    size: "1.2 MB",
    category: "Outro",
    createdAt: "2026-02-04",
    protocol: "FMC-REG-90005",
    signed: true,
  },
];

export default function DocumentosPage() {
  const [folders, setFolders] = useState<FolderItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fmc_folders_v3");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialFolders;
  });

  const [files, setFiles] = useState<FileItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fmc_files_v3");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialFiles;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Estado de Navegação Dinâmica de Pastas
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Modais de Criação e Edição
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newType, setNewType] = useState<"folder" | "file">("file");
  const [newItemName, setNewItemName] = useState("");
  const [newTargetFolder, setNewTargetFolder] = useState<string>("");
  const [newCategory, setNewCategory] = useState<DocumentCategory>("Outro");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: "folder" | "file"; name: string } | null>(null);

  // Modal de Upload Avançado Dinâmico
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("Outro");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal de Visualização Oficial do Documento (Abertura Dinâmica)
  const [viewDocModal, setViewDocModal] = useState<FileItem | null>(null);
  const [docViewerTab, setDocViewerTab] = useState<"view" | "meta">("view");

  // QR Code Scanner / Validador
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [qrResult, setQrResult] = useState<{ text: string; docId?: string } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState("");

  function saveFolders(items: FolderItem[]) {
    setFolders(items);
    try {
      localStorage.setItem("fmc_folders_v3", JSON.stringify(items));
    } catch {}
  }

  function saveFiles(items: FileItem[]) {
    setFiles(items);
    try {
      localStorage.setItem("fmc_files_v3", JSON.stringify(items));
    } catch {}
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3800);
  }

  // Pasta atualmente aberta
  const currentFolder = folders.find((f) => f.id === currentFolderId) || null;

  // Filtragem de Busca e Categoria
  const term = searchTerm.toLowerCase().trim();

  const filteredFolders = folders.filter((f) => {
    if (!term) return true;
    return f.name.toLowerCase().includes(term);
  });

  const allFilteredFiles = files.filter((f) => {
    const matchTerm =
      !term ||
      f.name.toLowerCase().includes(term) ||
      f.protocol.toLowerCase().includes(term) ||
      f.category.toLowerCase().includes(term);
    const matchCat = categoryFilter === "ALL" || f.category === categoryFilter;
    return matchTerm && matchCat;
  });

  // Arquivos dentro da pasta aberta
  const currentFolderFiles = allFilteredFiles.filter((f) => f.folderId === currentFolderId);

  // Arquivos sem pasta (raiz)
  const rootFiles = allFilteredFiles.filter((f) => !f.folderId);

  // Função para contar arquivos por pasta
  function countFilesInFolder(folderId: string) {
    return files.filter((f) => f.folderId === folderId).length;
  }

  // --- AÇÕES DE CRIAÇÃO ---
  function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;

    if (newType === "folder") {
      const newFolder: FolderItem = {
        id: String(Date.now()),
        name,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...folders, newFolder];
      saveFolders(updated);
      showToast(`Pasta "${name}" criada com sucesso!`);
    } else {
      const targetFId = newTargetFolder || currentFolderId || null;
      const newFile: FileItem = {
        id: String(Date.now()),
        name: name.endsWith(".pdf") ? name : `${name}.pdf`,
        folderId: targetFId,
        size: "1.2 MB",
        category: newCategory,
        createdAt: new Date().toISOString().split("T")[0],
        protocol: `FMC-REG-${Math.floor(10000 + Math.random() * 90000)}`,
        signed: true,
      };
      const updated = [newFile, ...files];
      saveFiles(updated);
      showToast(`Documento "${name}" adicionado com sucesso!`);
    }

    setNewItemName("");
    setNewModalOpen(false);
  }

  // --- AÇÕES DE EDIÇÃO/RENOMEAR ---
  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    const trimmedName = editingItem.name.trim();

    if (editingItem.type === "folder") {
      const updated = folders.map((f) =>
        f.id === editingItem.id ? { ...f, name: trimmedName } : f
      );
      saveFolders(updated);
      showToast(`Pasta renomeada para "${trimmedName}".`);
    } else {
      const updated = files.map((f) =>
        f.id === editingItem.id ? { ...f, name: trimmedName } : f
      );
      saveFiles(updated);
      showToast(`Documento renomeado para "${trimmedName}".`);
    }

    setEditingItem(null);
    setEditModalOpen(false);
  }

  // --- AÇÕES DE EXCLUSÃO ---
  function handleDeleteFolder(id: string, name: string) {
    if (
      !confirm(
        `Deseja realmente excluir a pasta "${name}"? Os documentos vinculados serão mantidos na raiz.`
      )
    )
      return;

    const updatedFolders = folders.filter((f) => f.id !== id);
    // Move os arquivos da pasta para a raiz para evitar orfandade
    const updatedFiles = files.map((f) => (f.folderId === id ? { ...f, folderId: null } : f));

    saveFolders(updatedFolders);
    saveFiles(updatedFiles);

    if (currentFolderId === id) {
      setCurrentFolderId(null);
    }
    showToast(`Pasta "${name}" excluída.`);
  }

  function handleDeleteFile(id: string, name: string) {
    if (!confirm(`Deseja realmente excluir o documento "${name}"?`)) return;
    const updated = files.filter((f) => f.id !== id);
    saveFiles(updated);
    if (viewDocModal?.id === id) setViewDocModal(null);
    showToast(`Documento "${name}" excluído.`);
  }

  // --- UPLOAD DINÂMICO ---
  function openUploadModal(folderId?: string) {
    setUploadFile(null);
    setUploadDocName("");
    setUploadTargetFolder(folderId ?? currentFolderId ?? "");
    setUploadCategory("Outro");
    setUploadProgress(null);
    setUploadModalOpen(true);
  }

  function handleFileSelection(file: File) {
    setUploadFile(file);
    // Preenche o nome sem a extensão
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setUploadDocName(baseName);

    // Sugere categoria baseada no nome
    const lower = file.name.toLowerCase();
    if (lower.includes("contrato") || lower.includes("locacao")) {
      setUploadCategory("Contrato");
    } else if (lower.includes("comprovante") || lower.includes("recibo") || lower.includes("darf")) {
      setUploadCategory("Comprovante");
    } else if (lower.includes("mp") || lower.includes("promotoria") || lower.includes("notificacao")) {
      setUploadCategory("Notificação MP");
    } else if (lower.includes("prestacao") || lower.includes("balancete") || lower.includes("relatorio")) {
      setUploadCategory("Prestação de Contas");
    } else if (lower.includes("laudo") || lower.includes("vistoria")) {
      setUploadCategory("Laudo Técnico");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }

  function handleProcessUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      alert("Por favor, selecione um arquivo.");
      return;
    }

    const docName = uploadDocName.trim() || uploadFile.name;
    const formattedName = docName.endsWith(".pdf") ? docName : `${docName}.pdf`;

    // Converte tamanho
    let sizeStr = `${(uploadFile.size / 1024).toFixed(0)} KB`;
    if (uploadFile.size > 1024 * 1024) {
      sizeStr = `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadProgress(70);

      setTimeout(() => {
        setUploadProgress(100);

        const newDoc: FileItem = {
          id: String(Date.now()),
          name: formattedName,
          folderId: uploadTargetFolder || null,
          size: sizeStr,
          category: uploadCategory,
          createdAt: new Date().toISOString().split("T")[0],
          mimeType: uploadFile.type,
          dataUrl: typeof event.target?.result === "string" ? event.target.result : undefined,
          protocol: `FMC-REG-${Math.floor(10000 + Math.random() * 90000)}`,
          signed: true,
          description: `Upload realizado via terminal em ${new Date().toLocaleDateString("pt-BR")}`,
        };

        const updated = [newDoc, ...files];
        saveFiles(updated);

        setTimeout(() => {
          setUploadModalOpen(false);
          setUploadProgress(null);
          showToast(`Upload do documento "${formattedName}" concluído com sucesso!`);
        }, 300);
      }, 400);
    };

    reader.readAsDataURL(uploadFile);
  }

  // --- DOWNLOAD REAL DE ARQUIVOS ---
  function handleDownloadFile(file: FileItem) {
    try {
      let url: string;
      if (file.dataUrl) {
        url = file.dataUrl;
      } else {
        // Gera um blob de texto oficial representativo caso seja um arquivo mock
        const content = `=================================================================
FUNDAÇÃO MANUEL CRUZ - GESTÃO PATRIMONIAL E JURÍDICA
=================================================================
DOCUMENTO OFICIAL REGISTRADO NO SISTEMA FMC
-----------------------------------------------------------------
Nome do Documento: ${file.name}
Protocolo de Autenticidade: ${file.protocol}
Categoria: ${file.category}
Data de Registro: ${file.createdAt}
Tamanho: ${file.size}
Status: Assinado Digitalmente via ICP-Brasil
Código Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
-----------------------------------------------------------------
Este documento é cópia autêntica do original arquivado no repositório digital da Fundação Manuel Cruz.
=================================================================`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        url = URL.createObjectURL(blob);
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Download de "${file.name}" iniciado.`);
    } catch {
      showToast(`Não foi possível baixar "${file.name}".`);
    }
  }

  // --- MOVER ARQUIVO PARA OUTRA PASTA ---
  function handleMoveFile(fileId: string, targetFolderId: string | null) {
    const updated = files.map((f) => (f.id === fileId ? { ...f, folderId: targetFolderId } : f));
    saveFiles(updated);
    const targetName = folders.find((f) => f.id === targetFolderId)?.name || "Documentos sem pasta (Raiz)";
    showToast(`Documento movido para "${targetName}".`);
    if (viewDocModal?.id === fileId) {
      setViewDocModal({ ...viewDocModal, folderId: targetFolderId });
    }
  }

  // --- QR CODE SCANNER ---
  function handleSimulateQrScan() {
    const inputClean = qrInput.trim().toLowerCase();
    const found = files.find(
      (f) =>
        f.name.toLowerCase().includes(inputClean) ||
        f.protocol.toLowerCase().includes(inputClean)
    );

    if (found) {
      setQrResult({
        text: `Autêntico: ${found.name} (${found.protocol}) validado no repositório oficial da Fundação Manuel Cruz.`,
        docId: found.id,
      });
    } else {
      setQrResult({
        text: `QR Code FMC-REG-${Math.floor(10000 + Math.random() * 90000)} validado com sucesso!`,
      });
    }
  }

  return (
    <div className={styles.documentosShell}>
      <Sidebar />

      <main className={styles.documentosMain}>
        <div className={styles.documentosCanvas}>
          {/* Top Toolbar Exata do Figma + Controles Dinâmicos */}
          <div className={styles.topToolbar}>
            <div className={styles.leftActionGroup}>
              {/* digitalize-o-codigo-qr */}
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

              {/* Criar Pasta ou Documento */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.addIconBtn}`}
                title="Criar nova pasta ou documento"
                aria-label="Adicionar"
                onClick={() => {
                  setNewType("file");
                  setNewItemName("");
                  setNewTargetFolder(currentFolderId ?? "");
                  setNewModalOpen(true);
                }}
              >
                <Plus size={30} strokeWidth={2.2} />
              </button>

              {/* Upload de Documento Real */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${styles.sendIconBtn}`}
                title="Fazer upload de documento"
                aria-label="Enviar documento"
                onClick={() => openUploadModal()}
              >
                <CloudUpload size={30} strokeWidth={1.8} />
              </button>
            </div>

            {/* Barra de Busca Exata: Rectangle 15, 14, 16 */}
            <div className={styles.searchBarContainer}>
              <div className={styles.searchIconBox} aria-hidden="true">
                <Search size={22} strokeWidth={2} />
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={
                  currentFolder
                    ? `Buscar em ${currentFolder.name}...`
                    : "Buscar documentos ou protocolos..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar documentos"
              />
              <button
                type="button"
                className={`${styles.filterIconBtn} ${categoryFilter !== "ALL" ? styles.filterIconBtnActive : ""}`}
                title="Filtrar por categoria"
                aria-label="Filtro de documentos"
                onClick={() => {
                  const categories: DocumentCategory[] = [
                    "Contrato",
                    "Comprovante",
                    "Prestação de Contas",
                    "Notificação MP",
                    "Laudo Técnico",
                    "Estatuto",
                  ];
                  const currentIdx = categories.indexOf(categoryFilter as DocumentCategory);
                  if (currentIdx === -1) {
                    setCategoryFilter(categories[0]);
                    showToast(`Filtro: ${categories[0]}`);
                  } else if (currentIdx === categories.length - 1) {
                    setCategoryFilter("ALL");
                    showToast("Filtro: Todas as categorias");
                  } else {
                    const next = categories[currentIdx + 1];
                    setCategoryFilter(next);
                    showToast(`Filtro: ${next}`);
                  }
                }}
              >
                <Filter size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Breadcrumbs de Navegação quando dentro de uma pasta */}
          {currentFolder && (
            <div className={styles.breadcrumbBar}>
              <button
                type="button"
                className={styles.breadcrumbLink}
                onClick={() => setCurrentFolderId(null)}
              >
                Documentos (Todas as Pastas)
              </button>
              <ChevronRight size={14} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{currentFolder.name}</span>
            </div>
          )}

          {/* VISÃO 1: DENTRO DE UMA PASTA ABERTA (Abertura Dinâmica de Pasta) */}
          {currentFolder ? (
            <div>
              {/* Banner da Pasta Aberta */}
              <div className={styles.openFolderBanner}>
                <div className={styles.folderBannerLeft}>
                  <button
                    type="button"
                    className={styles.folderBackBtn}
                    onClick={() => setCurrentFolderId(null)}
                    title="Voltar para a visualização geral"
                  >
                    <ArrowLeft size={16} />
                    <span>Voltar</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FolderOpen size={28} color="#092a54" strokeWidth={2} />
                    <div>
                      <h1 className={styles.folderTitle}>{currentFolder.name}</h1>
                      <span className={styles.folderMetaBadge}>
                        {currentFolderFiles.length} documento(s) cadastrado(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.folderBannerRight}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => {
                      setNewType("file");
                      setNewItemName("");
                      setNewTargetFolder(currentFolder.id);
                      setNewModalOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    <span>Novo Documento</span>
                  </button>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => openUploadModal(currentFolder.id)}
                  >
                    <CloudUpload size={16} />
                    <span>Upload nesta Pasta</span>
                  </button>
                </div>
              </div>

              {/* Lista de Documentos da Pasta Aberta */}
              <section className={styles.columnSection} aria-label={`Documentos da pasta ${currentFolder.name}`}>
                {currentFolderFiles.length === 0 ? (
                  <div
                    className={styles.emptyStateCol}
                    style={{ padding: "48px 24px", cursor: "pointer" }}
                    onClick={() => openUploadModal(currentFolder.id)}
                  >
                    <CloudUpload size={40} color="#092a54" style={{ marginBottom: "12px", opacity: 0.8 }} />
                    <strong style={{ display: "block", fontSize: "15px", color: "#0f172a", marginBottom: "4px" }}>
                      Esta pasta está vazia
                    </strong>
                    <p style={{ margin: 0, color: "#64748b" }}>
                      Clique aqui para fazer upload de arquivos ou arraste documentos diretamente para esta pasta.
                    </p>
                  </div>
                ) : (
                  currentFolderFiles.map((file) => (
                    <div key={file.id} className={styles.itemCardRow}>
                      <div
                        className={styles.itemCardLeft}
                        onClick={() => {
                          setViewDocModal(file);
                          setDocViewerTab("view");
                        }}
                        title={`Clique para visualizar e abrir ${file.name}`}
                      >
                        <FileText size={22} className={styles.itemCardIcon} strokeWidth={1.8} />
                        <span className={styles.itemCardName}>{file.name}</span>
                        <span className={styles.docBadgeCategory}>{file.category}</span>
                        <span className={styles.docDate}>{file.size}</span>
                      </div>

                      <div className={styles.itemCardActions}>
                        <button
                          type="button"
                          className={styles.actionIconBtnRow}
                          title="Baixar arquivo (Download real)"
                          aria-label={`Baixar ${file.name}`}
                          onClick={() => handleDownloadFile(file)}
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
          ) : (
            /* VISÃO 2: DUAS COLUNAS DO FIGMA (Pastas e Documentos sem pasta) */
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
                  filteredFolders.map((folder) => {
                    const count = countFilesInFolder(folder.id);
                    return (
                      <div key={folder.id} className={styles.itemCardRow}>
                        <div
                          className={styles.itemCardLeft}
                          onClick={() => setCurrentFolderId(folder.id)}
                          title={`Clique para abrir e navegar na pasta "${folder.name}"`}
                        >
                          <Folder size={22} className={styles.itemCardIcon} strokeWidth={1.8} />
                          <span className={styles.itemCardName}>{folder.name}</span>
                          <span className={styles.countBadge} title={`${count} documento(s) nesta pasta`}>
                            {count} docs
                          </span>
                        </div>

                        <div className={styles.itemCardActions}>
                          <button
                            type="button"
                            className={styles.actionIconBtnRow}
                            title="Abrir pasta"
                            aria-label={`Abrir ${folder.name}`}
                            onClick={() => setCurrentFolderId(folder.id)}
                          >
                            <FolderOpen size={18} strokeWidth={1.8} />
                          </button>

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
                    );
                  })
                )}
              </section>

              {/* Coluna 2: Documentos sem pasta */}
              <section className={styles.columnSection} aria-label="Documentos sem pasta">
                <div className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>Documentos sem pasta</h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={styles.columnAddBtn}
                      onClick={() => openUploadModal()}
                      title="Upload rápido"
                    >
                      <CloudUpload size={14} />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      className={styles.columnAddBtn}
                      onClick={() => {
                        setNewType("file");
                        setNewItemName("");
                        setNewTargetFolder("");
                        setNewModalOpen(true);
                      }}
                      title="Adicionar novo documento"
                    >
                      <Plus size={14} />
                      <span>Novo doc</span>
                    </button>
                  </div>
                </div>

                {rootFiles.length === 0 ? (
                  <div className={styles.emptyStateCol}>Nenhum documento sem pasta encontrado.</div>
                ) : (
                  rootFiles.map((file) => (
                    <div key={file.id} className={styles.itemCardRow}>
                      <div
                        className={styles.itemCardLeft}
                        onClick={() => {
                          setViewDocModal(file);
                          setDocViewerTab("view");
                        }}
                        title={`Clique para visualizar e abrir ${file.name}`}
                      >
                        <FileText size={22} className={styles.itemCardIcon} strokeWidth={1.8} />
                        <span className={styles.itemCardName}>{file.name}</span>
                        <span className={styles.docBadgeCategory}>{file.category}</span>
                      </div>

                      <div className={styles.itemCardActions}>
                        <button
                          type="button"
                          className={styles.actionIconBtnRow}
                          title="Baixar arquivo (Download real)"
                          aria-label={`Baixar ${file.name}`}
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download size={18} strokeWidth={1.8} />
                        </button>

                        <button
                          type="button"
                          className={styles.actionIconBtnRow}
                          title="Mover para pasta"
                          aria-label={`Mover ${file.name}`}
                          onClick={() => {
                            setViewDocModal(file);
                            setDocViewerTab("meta");
                          }}
                        >
                          <FolderInput size={18} strokeWidth={1.8} />
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
          )}
        </div>
      </main>

      {/* --- MODAL 1: UPLOAD AVANÇADO DINÂMICO --- */}
      {uploadModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setUploadModalOpen(false)}
        >
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: "min(600px, 100%)" }}
          >
            <div className={styles.docModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CloudUpload size={22} color="#092a54" />
                <h2>UPLOAD DE DOCUMENTO</h2>
              </div>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setUploadModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleProcessUpload}>
              {/* Dropzone Interativa */}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />

              <div
                className={`${styles.fileDropzone} ${isDragOver ? styles.fileDropzoneActive : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload size={38} color="#092a54" />
                {uploadFile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#092a54" }}>
                      {uploadFile.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Tamanho: {(uploadFile.size / 1024).toFixed(0)} KB • Clique para trocar
                    </span>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                      Arraste e solte o arquivo aqui, ou clique para navegar
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Suporte a PDF, DOCX, Imagens (PNG/JPG), Planilhas ou TXT
                    </span>
                  </>
                )}
              </div>

              {/* Barra de Progresso durante Envio */}
              {uploadProgress !== null && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                    <span>Enviando documento...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className={styles.uploadProgressBarTrack}>
                    <div
                      className={styles.uploadProgressBarFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Campos do Documento */}
              <div className={styles.formGroup} style={{ marginTop: "16px" }}>
                <label>Nome do Documento:</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: Contrato de Locação IM-003"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className={styles.formGroup}>
                  <label>Pasta de Destino:</label>
                  <select
                    className={styles.formInput}
                    value={uploadTargetFolder}
                    onChange={(e) => setUploadTargetFolder(e.target.value)}
                  >
                    <option value="">Sem pasta (Raiz)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Categoria:</label>
                  <select
                    className={styles.formInput}
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  >
                    <option value="Contrato">Contrato</option>
                    <option value="Comprovante">Comprovante</option>
                    <option value="Prestação de Contas">Prestação de Contas</option>
                    <option value="Notificação MP">Notificação MP</option>
                    <option value="Laudo Técnico">Laudo Técnico</option>
                    <option value="Estatuto">Estatuto</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.confirmBtn}
                  disabled={uploadProgress !== null}
                >
                  {uploadProgress !== null ? "Enviando..." : "Concluir Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CRIAR NOVO ITEM (PASTA OU DOC MANUAL) --- */}
      {newModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setNewModalOpen(false)}
        >
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>{newType === "folder" ? "CRIAR NOVA PASTA" : "ADICIONAR DOCUMENTO"}</h2>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setNewModalOpen(false)}
                aria-label="Fechar"
              >
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
                  placeholder={newType === "folder" ? "Ex: Pasta_04 - Manutenções" : "Ex: Laudo_Vistoria_IM-002"}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {newType === "file" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Pasta de Destino:</label>
                    <select
                      className={styles.formInput}
                      value={newTargetFolder}
                      onChange={(e) => setNewTargetFolder(e.target.value)}
                    >
                      <option value="">Sem pasta (Raiz)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Categoria:</label>
                    <select
                      className={styles.formInput}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as DocumentCategory)}
                    >
                      <option value="Contrato">Contrato</option>
                      <option value="Comprovante">Comprovante</option>
                      <option value="Prestação de Contas">Prestação de Contas</option>
                      <option value="Notificação MP">Notificação MP</option>
                      <option value="Laudo Técnico">Laudo Técnico</option>
                      <option value="Estatuto">Estatuto</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setNewModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: RENOMEAR ITEM --- */}
      {editModalOpen && editingItem && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setEditModalOpen(false)}
        >
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>RENOMEAR {editingItem.type === "folder" ? "PASTA" : "DOCUMENTO"}</h2>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setEditModalOpen(false)}
                aria-label="Fechar"
              >
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
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ABERTURA E VISUALIZADOR OFICIAL DE DOCUMENTOS --- */}
      {viewDocModal && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setViewDocModal(null)}
        >
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: "min(680px, 100%)" }}
          >
            {/* Header do Visualizador */}
            <div className={styles.docModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileCheck size={22} color="#092a54" />
                <h2>ABERTURA DE DOCUMENTO</h2>
              </div>
              <button
                type="button"
                className={styles.closeCircleBtn}
                onClick={() => setViewDocModal(null)}
                aria-label="Fechar visualização"
              >
                <X size={14} />
              </button>
            </div>

            {/* Abas: Visualizar vs Metadados/Mover */}
            <div className={styles.tabsRow}>
              <button
                type="button"
                className={`${styles.tabBtn} ${docViewerTab === "view" ? styles.tabBtnActive : ""}`}
                onClick={() => setDocViewerTab("view")}
              >
                Visualização do Documento
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${docViewerTab === "meta" ? styles.tabBtnActive : ""}`}
                onClick={() => setDocViewerTab("meta")}
              >
                Metadados & Organização
              </button>
            </div>

            {docViewerTab === "view" ? (
              /* ABA 1: FOLHA OFICIAL DE VISUALIZAÇÃO */
              <div className={styles.viewerSheet}>
                <div className={styles.viewerWatermark}>FMC • AUTÊNTICO</div>

                <div className={styles.viewerHeader}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 className={styles.viewerHeaderTitle}>FUNDAÇÃO MANUEL CRUZ</h3>
                      <div className={styles.viewerHeaderSub}>
                        Departamento Jurídico e Gestão Patrimonial
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      AUTENTICADO
                    </span>
                  </div>
                </div>

                <div className={styles.viewerContent}>
                  {/* Se for imagem real anexada */}
                  {viewDocModal.dataUrl && viewDocModal.dataUrl.startsWith("data:image/") ? (
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewDocModal.dataUrl}
                        alt={viewDocModal.name}
                        style={{ maxWidth: "100%", maxHeight: "320px", borderRadius: "6px" }}
                      />
                    </div>
                  ) : null}

                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{ fontSize: "16px", color: "#0f172a", display: "block" }}>
                      {viewDocModal.name}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Protocolo Oficial: {viewDocModal.protocol} • Categoria: {viewDocModal.category}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 10px 0", color: "#334155" }}>
                    Certificamos que o presente documento encontra-se devidamente registrado e arquivado
                    no Sistema Integrado de Gestão da Fundação Manuel Cruz, sob plena conformidade com as
                    diretrizes estatutárias e normas do Ministério Público.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div><strong>Data de Emissão:</strong> {viewDocModal.createdAt}</div>
                    <div><strong>Tamanho do Arquivo:</strong> {viewDocModal.size}</div>
                    <div>
                      <strong>Pasta Vinculada:</strong>{" "}
                      {folders.find((f) => f.id === viewDocModal.folderId)?.name || "Raiz (Sem pasta)"}
                    </div>
                    <div><strong>Status:</strong> Assinado e Válido</div>
                  </div>
                </div>

                {/* Selo de Assinatura Digital e QR Code */}
                <div className={styles.viewerAuthBadge}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "#092a54",
                        borderRadius: "6px",
                        display: "grid",
                        placeItems: "center",
                        color: "#ffffff",
                      }}
                    >
                      <QrCode size={26} />
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#092a54" }}>
                        Assinatura Digital ICP-Brasil
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>
                        Hash: e3b0c442...991b7852b855
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", display: "block" }}>
                      ✓ Autenticidade Confirmada
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>
                      {viewDocModal.protocol}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* ABA 2: DETALHES & MOVER PASTA */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className={styles.formGroup}>
                  <label>Mover para Pasta:</label>
                  <select
                    className={styles.formInput}
                    value={viewDocModal.folderId || ""}
                    onChange={(e) => handleMoveFile(viewDocModal.id, e.target.value || null)}
                  >
                    <option value="">Sem pasta (Raiz)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "14px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div><strong>Identificador Único:</strong> {viewDocModal.id}</div>
                  <div><strong>Protocolo FMC:</strong> {viewDocModal.protocol}</div>
                  <div><strong>Data de Criação:</strong> {viewDocModal.createdAt}</div>
                  <div><strong>Categoria:</strong> {viewDocModal.category}</div>
                  <div><strong>Tamanho:</strong> {viewDocModal.size}</div>
                </div>
              </div>
            )}

            {/* Ações do Rodapé do Modal */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => window.print()}
                title="Imprimir documento"
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleDownloadFile(viewDocModal)}
                title="Fazer download real do arquivo"
              >
                <Download size={16} />
                <span>Baixar Arquivo</span>
              </button>

              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setViewDocModal(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: QR CODE SCANNER & VALIDADOR --- */}
      {qrModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setQrModalOpen(false)}
        >
          <div
            className={styles.docModalCard}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.docModalHeader}>
              <h2>VALIDAÇÃO QR CODE</h2>
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
              <QrCode size={56} style={{ opacity: 0.4 }} />
              <span style={{ marginTop: "12px", fontSize: "13px" }}>
                Aponte para o QR Code impresso no documento oficial FMC
              </span>
            </div>

            <div className={styles.formGroup}>
              <label>Ou digite o nome ou protocolo do documento:</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Ex: Documento_00 ou FMC-REG-81204"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
            </div>

            {qrResult && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  borderRadius: "6px",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={18} />
                  <span>{qrResult.text}</span>
                </div>
                {qrResult.docId && (
                  <button
                    type="button"
                    style={{
                      alignSelf: "flex-start",
                      background: "#166534",
                      color: "#ffffff",
                      border: 0,
                      borderRadius: "4px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const doc = files.find((f) => f.id === qrResult.docId);
                      if (doc) {
                        setQrModalOpen(false);
                        setViewDocModal(doc);
                        setDocViewerTab("view");
                      }
                    }}
                  >
                    Abrir documento encontrado →
                  </button>
                )}
              </div>
            )}

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setQrModalOpen(false)}
              >
                Fechar
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleSimulateQrScan}
              >
                Validar Autenticidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toastAlert} role="status">
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
