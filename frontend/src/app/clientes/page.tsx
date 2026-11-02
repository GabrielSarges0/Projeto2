"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Home,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  FMCClient,
  getPropertyMetricsFromStore,
  getStoredClients,
  saveClients,
} from "@/lib/shared-store";
import styles from "./clientes.module.css";

export default function ClientesPage() {
  const [clients, setClients] = useState<FMCClient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [selectedClient, setSelectedClient] = useState<FMCClient | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [metrics, setMetrics] = useState({
    totalProperties: 124,
    occupied: 92,
    available: 32,
    underMaintenance: 32,
    sampleOccupied: 2,
    sampleAvailable: 2,
    sampleMaintenance: 1,
  });

  // Formulário de Novo Cliente
  const [newName, setNewName] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newAge, setNewAge] = useState(35);
  const [newResidents, setNewResidents] = useState(2);
  const [newProfession, setNewProfession] = useState("");
  const [newAssets, setNewAssets] = useState("");
  const [newPropertyCode, setNewPropertyCode] = useState("IM-008");
  const [newPropertyAddress, setNewPropertyAddress] = useState("Rua D, 95 - Centro");
  const [newRent, setNewRent] = useState(1500);
  const [newGuarantorName, setNewGuarantorName] = useState("");
  const [newGuarantorCpf, setNewGuarantorCpf] = useState("");
  const [newGuarantorRel, setNewGuarantorRel] = useState("Parente");
  const [newGuarantorAssets, setNewGuarantorAssets] = useState("");

  useEffect(() => {
    setClients(getStoredClients());
    setMetrics(getPropertyMetricsFromStore());

    function handleUpdate() {
      setClients(getStoredClients());
      setMetrics(getPropertyMetricsFromStore());
    }

    window.addEventListener("fmc_clients_updated", handleUpdate);
    window.addEventListener("fmc_properties_updated", handleUpdate);
    return () => {
      window.removeEventListener("fmc_clients_updated", handleUpdate);
      window.removeEventListener("fmc_properties_updated", handleUpdate);
    };
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  // Filtragem
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm);

    const matchesStatus =
      statusFilter === "TODOS" || c.contractStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Contratos próximos ao vencimento
  const expiringContracts = clients.filter(
    (c) => c.contractStatus === "Próximo ao Vencimento"
  );

  function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCpf.trim()) {
      showToast("Preencha o nome e CPF do inquilino.");
      return;
    }

    const newClientObj: FMCClient = {
      id: `cli-${Date.now()}`,
      name: newName.trim(),
      cpf: newCpf.trim(),
      age: Number(newAge),
      phone: "(92) 99000-0000",
      email: `${newName.toLowerCase().replace(/\s+/g, ".")}@cliente.com`,
      residentsCount: Number(newResidents),
      profession: newProfession.trim() || "Profissional Autônomo",
      assetsDeclared: newAssets.trim() || "Comprovação de renda e bens regulares",
      propertyCode: newPropertyCode,
      propertyAddress: newPropertyAddress,
      monthlyRent: Number(newRent),
      contractStatus: "Ativo",
      contractStartDate: "02/11/2026",
      contractEndDate: "02/11/2027",
      guarantorName: newGuarantorName.trim() || "Sem fiador (Caução)",
      guarantorCpf: newGuarantorCpf.trim() || "-",
      guarantorRelationship: newGuarantorRel,
      guarantorPhone: "(92) 99111-1111",
      guarantorAssets: newGuarantorAssets.trim() || "Garantia locatícia padrão",
      documents: [
        {
          id: `doc-${Date.now()}`,
          name: `Contrato_Locacao_${newPropertyCode}.pdf`,
          category: "Contratos",
        },
      ],
    };

    const updated = [newClientObj, ...clients];
    saveClients(updated);
    setClients(updated);
    setIsNewModalOpen(false);
    showToast("Cliente e contrato cadastrados com sucesso!");

    // Limpar campos
    setNewName("");
    setNewCpf("");
  }

  function handleRenewContract(clientId: string) {
    const updated = clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          contractStatus: "Renovado" as const,
          contractEndDate: "15/11/2027",
        };
      }
      return c;
    });
    saveClients(updated);
    setClients(updated);
    if (selectedClient && selectedClient.id === clientId) {
      setSelectedClient({
        ...selectedClient,
        contractStatus: "Renovado",
        contractEndDate: "15/11/2027",
      });
    }
    showToast("Contrato renovado por mais 12 meses com sucesso!");
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Olá Administrador</h1>
          <p className={styles.subtitle}>
            Bem-vindo(a) ao painel de gestão de clientes, inquilinos e contratos da Fundação Manuel Cruz.
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setIsNewModalOpen(true)}
        >
          <Plus size={18} />
          Novo Inquilino / Contrato
        </button>
      </div>

      {/* Cards de Topo (Métricas de Gestão do Figma) */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: "#092a54" }}>
            <Home size={22} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total de Imóveis</span>
            <span className={styles.metricValue}>{metrics.totalProperties}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: "#16a34a" }}>
            <UserCheck size={22} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Ocupados</span>
            <span className={styles.metricValue}>{metrics.occupied}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: "#3c8dbc" }}>
            <Building2 size={22} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Disponíveis</span>
            <span className={styles.metricValue}>{metrics.available}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: "#d97706" }}>
            <Wrench size={22} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Desocupados / Manutenção</span>
            <span className={styles.metricValue}>{metrics.underMaintenance}</span>
          </div>
        </div>
      </div>

      {/* Card: Contratos próximos ao vencimento (Figma / Print) */}
      <div className={styles.expiryCard}>
        <div className={styles.expiryHeader}>
          <div className={styles.expiryTitle}>
            <AlertTriangle size={18} />
            Contratos próximos ao vencimento
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {expiringContracts.length} contratos requerem renovação
          </span>
        </div>
        <div className={styles.expiryList}>
          {expiringContracts.map((client) => (
            <div key={client.id} className={styles.expiryItem}>
              <div className={styles.expiryItemLeft}>
                <span className={styles.expiryName}>{client.name}</span>
                <span className={styles.expiryDetails}>
                  {client.propertyCode} ({client.propertyAddress}) — Vence em{" "}
                  {client.contractEndDate} (R${" "}
                  {client.monthlyRent.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                  )
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={styles.btnDetails}
                  onClick={() => setSelectedClient(client)}
                >
                  Ver Perfil
                </button>
                <button
                  className={styles.btnRenew}
                  onClick={() => handleRenewContract(client.id)}
                >
                  Renovar
                </button>
              </div>
            </div>
          ))}
          {expiringContracts.length === 0 && (
            <p style={{ margin: 0, fontSize: 14, color: "#16a34a" }}>
              Nenhum contrato vencendo nos próximos 30 dias.
            </p>
          )}
        </div>
      </div>

      {/* Barra de Ferramentas / Busca */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por inquilino, imóvel, CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="TODOS">Todos os Contratos</option>
          <option value="Ativo">Ativos</option>
          <option value="Próximo ao Vencimento">Próximo ao Vencimento</option>
          <option value="Renovado">Renovados</option>
        </select>
      </div>

      {/* Tabela de Inquilinos e Fiadores (Tela 11.1 do Backlog) */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Inquilino</th>
              <th>Imóvel Vinculado</th>
              <th>Fiador</th>
              <th>Aluguel Mensal</th>
              <th>Situação do Contrato</th>
              <th>Vencimento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const isWarning = client.contractStatus === "Próximo ao Vencimento";
              const isRenewed = client.contractStatus === "Renovado";

              return (
                <tr key={client.id}>
                  <td>
                    <div className={styles.clientNameCell}>
                      <strong>{client.name}</strong>
                      <span className={styles.clientCpf}>{client.cpf}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{client.propertyCode}</strong>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {client.propertyAddress}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span>{client.guarantorName}</span>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {client.guarantorRelationship}
                    </div>
                  </td>
                  <td>
                    <strong>
                      R${" "}
                      {client.monthlyRent.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        isWarning
                          ? styles.badgeWarning
                          : isRenewed || client.contractStatus === "Ativo"
                          ? styles.badgeActive
                          : styles.badgePending
                      }`}
                    >
                      {client.contractStatus}
                    </span>
                  </td>
                  <td>{client.contractEndDate}</td>
                  <td>
                    <button
                      className={styles.btnDetails}
                      onClick={() => setSelectedClient(client)}
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
                  Nenhum cliente ou inquilino encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes do Cliente Selecionado (Tela 11.2 do Backlog) */}
      {selectedClient && (
        <div className={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Detalhes do Inquilino & Contrato (BP11)</h2>
              <button
                className={styles.btnClose}
                onClick={() => setSelectedClient(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Seção 1: Dados do Inquilino */}
              <div className={styles.detailSection}>
                <h3>
                  <Users size={16} />
                  Informações do Inquilino
                </h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nome Completo</span>
                    <span className={styles.detailValue}>{selectedClient.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CPF</span>
                    <span className={styles.detailValue}>{selectedClient.cpf}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Idade</span>
                    <span className={styles.detailValue}>{selectedClient.age} anos</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Pessoas na Residência</span>
                    <span className={styles.detailValue}>
                      {selectedClient.residentsCount} pessoa(s)
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Profissão</span>
                    <span className={styles.detailValue}>{selectedClient.profession}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Contato / E-mail</span>
                    <span className={styles.detailValue}>{selectedClient.phone}</span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                    <span className={styles.detailLabel}>Bens Declarados para Aluguel</span>
                    <span className={styles.detailValue}>{selectedClient.assetsDeclared}</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Imóvel e Contrato */}
              <div className={styles.detailSection}>
                <h3>
                  <Home size={16} />
                  Imóvel Alugado e Termos Contratuais
                </h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Código do Imóvel</span>
                    <span className={styles.detailValue}>{selectedClient.propertyCode}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Valor Mensal</span>
                    <span className={styles.detailValue}>
                      R${" "}
                      {selectedClient.monthlyRent.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                    <span className={styles.detailLabel}>Endereço do Imóvel</span>
                    <span className={styles.detailValue}>{selectedClient.propertyAddress}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Início do Contrato</span>
                    <span className={styles.detailValue}>{selectedClient.contractStartDate}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vencimento do Contrato</span>
                    <span className={styles.detailValue}>{selectedClient.contractEndDate}</span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Dados do Fiador */}
              <div className={styles.detailSection}>
                <h3>
                  <Shield size={16} />
                  Dados do Fiador
                </h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nome do Fiador</span>
                    <span className={styles.detailValue}>{selectedClient.guarantorName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CPF do Fiador</span>
                    <span className={styles.detailValue}>{selectedClient.guarantorCpf}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Parentesco / Vínculo</span>
                    <span className={styles.detailValue}>
                      {selectedClient.guarantorRelationship}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Contato Fiador</span>
                    <span className={styles.detailValue}>{selectedClient.guarantorPhone}</span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                    <span className={styles.detailLabel}>Bens e Garantias do Fiador</span>
                    <span className={styles.detailValue}>{selectedClient.guarantorAssets}</span>
                  </div>
                </div>
              </div>

              {/* Seção 4: Documentos Anexados */}
              <div className={styles.detailSection}>
                <h3>
                  <FileText size={16} />
                  Documentos Pessoais & Contrato Anexados
                </h3>
                <div className={styles.docList}>
                  {selectedClient.documents.map((doc) => (
                    <div key={doc.id} className={styles.docItem}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {doc.name} ({doc.category})
                      </span>
                      <Link
                        href="/documentos"
                        className={styles.docLink}
                        target="_blank"
                      >
                        <ExternalLink size={14} />
                        Abrir em Documentos
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Link href="/formulario" className={styles.btnSecondary}>
                Emitir Recibo / Termo
              </Link>
              {selectedClient.contractStatus === "Próximo ao Vencimento" && (
                <button
                  className={styles.btnRenew}
                  onClick={() => handleRenewContract(selectedClient.id)}
                >
                  Renovar por 12 Meses
                </button>
              )}
              <button
                className={styles.btnPrimary}
                onClick={() => setSelectedClient(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Novo Cliente */}
      {isNewModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Cadastrar Novo Inquilino e Contrato</h2>
              <button
                className={styles.btnClose}
                onClick={() => setIsNewModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div className={styles.modalBody}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Nome do Inquilino *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>CPF do Inquilino *</label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={newCpf}
                      onChange={(e) => setNewCpf(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Idade</label>
                    <input
                      type="number"
                      value={newAge}
                      onChange={(e) => setNewAge(Number(e.target.value))}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Pessoas na Casa</label>
                    <input
                      type="number"
                      value={newResidents}
                      onChange={(e) => setNewResidents(Number(e.target.value))}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Profissão</label>
                    <input
                      type="text"
                      placeholder="Ex: Contador"
                      value={newProfession}
                      onChange={(e) => setNewProfession(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Valor Aluguel (R$)</label>
                    <input
                      type="number"
                      value={newRent}
                      onChange={(e) => setNewRent(Number(e.target.value))}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Código do Imóvel</label>
                    <input
                      type="text"
                      value={newPropertyCode}
                      onChange={(e) => setNewPropertyCode(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Endereço do Imóvel</label>
                    <input
                      type="text"
                      value={newPropertyAddress}
                      onChange={(e) => setNewPropertyAddress(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                    <label className={styles.detailLabel}>Bens Declarados do Inquilino</label>
                    <input
                      type="text"
                      placeholder="Ex: Carro quitado, contracheque servidor"
                      value={newAssets}
                      onChange={(e) => setNewAssets(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Nome do Fiador</label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos da Silva"
                      value={newGuarantorName}
                      onChange={(e) => setNewGuarantorName(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>CPF do Fiador</label>
                    <input
                      type="text"
                      placeholder="111.222.333-44"
                      value={newGuarantorCpf}
                      onChange={(e) => setNewGuarantorCpf(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                    <label className={styles.detailLabel}>Bens do Fiador</label>
                    <input
                      type="text"
                      placeholder="Ex: Imóvel quitado em Manaus"
                      value={newGuarantorAssets}
                      onChange={(e) => setNewGuarantorAssets(e.target.value)}
                      style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </div>
  );
}
