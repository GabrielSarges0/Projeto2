"use client";

import { useEffect, useState } from "react";
import {
  Boxes,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Minus,
  PackageCheck,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  FMCInventoryItem,
  getStoredInventory,
  saveInventory,
  saveMovement,
} from "@/lib/shared-store";
import styles from "./estoque.module.css";

export default function EstoquePage() {
  const [items, setItems] = useState<FMCInventoryItem[]>([]);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("Outubro");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedItemForWithdraw, setSelectedItemForWithdraw] = useState<FMCInventoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // Formulário de Adicionar Item
  const [newItemName, setNewItemName] = useState("");
  const [newPackageSpec, setNewPackageSpec] = useState(""); // Ex: detergente 540ml, tinta 1l, 10x
  const [newPrice, setNewPrice] = useState<number>(5.0);
  const [newQty, setNewQty] = useState<number>(10);
  const [newCategory, setNewCategory] = useState<"Limpeza" | "Obra / Manutenção" | "Escritório">("Limpeza");

  // Formulário de Baixa / Retirada
  const [withdrawQty, setWithdrawQty] = useState<number>(1);
  const [withdrawEmployee, setWithdrawEmployee] = useState("João Pereira (Limpeza)");
  const [withdrawReason, setWithdrawReason] = useState("Limpeza rotineira dos blocos A e B");

  useEffect(() => {
    setItems(getStoredInventory());

    function handleUpdate() {
      setItems(getStoredInventory());
    }

    window.addEventListener("fmc_inventory_updated", handleUpdate);
    return () => window.removeEventListener("fmc_inventory_updated", handleUpdate);
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  // Gasto total calculado
  const totalSpent = items.reduce(
    (acc, curr) => acc + curr.unitPrice * curr.quantity,
    0
  );

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) {
      showToast("Informe o nome do item.");
      return;
    }

    const newItem: FMCInventoryItem = {
      id: `est-${Date.now()}`,
      name: newItemName.trim(),
      packageSpec: newPackageSpec.trim() || "Unidade padrão",
      unitPrice: Number(newPrice),
      quantity: Number(newQty),
      purchaseDate: "02/11/2026",
      category: newCategory,
    };

    const updated = [newItem, ...items];
    saveInventory(updated);
    setItems(updated);

    // Integrar como Saída de Caixa (BP06/BP08)
    saveMovement({
      id: `mov-est-${Date.now()}`,
      date: "2026-11-02",
      tenantName: `Compra Estoque: ${newItem.name} (${newItem.packageSpec})`,
      propertyRegistration: "DML - Fundação",
      amount: newItem.unitPrice * newItem.quantity,
      type: "EXPENSE",
      category: "Manutenção / Insumos",
      observations: `Aquisição de ${newItem.quantity} unidades (${newItem.packageSpec}) a R$ ${newItem.unitPrice.toFixed(2)} cada.`,
    });

    setIsAddModalOpen(false);
    showToast("Item adicionado ao estoque e despesa registrada!");
    setNewItemName("");
    setNewPackageSpec("");
  }

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemForWithdraw) return;

    if (withdrawQty <= 0 || withdrawQty > selectedItemForWithdraw.quantity) {
      showToast(`Quantidade inválida. Estoque atual: ${selectedItemForWithdraw.quantity}`);
      return;
    }

    const updated = items.map((i) => {
      if (i.id === selectedItemForWithdraw.id) {
        return {
          ...i,
          quantity: i.quantity - withdrawQty,
        };
      }
      return i;
    });

    saveInventory(updated);
    setItems(updated);
    setIsWithdrawModalOpen(false);
    showToast(`Retirada de ${withdrawQty} un registrada por ${withdrawEmployee}!`);
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Gestão de Itens e Estoque (DML)</h1>
          <p className={styles.subtitle}>
            Controle de insumos de limpeza, materiais de obra e quantidade por embalagem (BP08).
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          Registrar Compra / Entrada
        </button>
      </div>

      {/* Barra de Filtros e Gasto Total do Figma */}
      <div className={styles.filterBar}>
        <div className={periodControlsClass(styles)}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={18} color="#092a54" />
            <select
              className={styles.selectPeriod}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <select
            className={styles.selectPeriod}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="Setembro">Setembro</option>
            <option value="Outubro">Outubro</option>
            <option value="Novembro">Novembro</option>
            <option value="Dezembro">Dezembro</option>
          </select>
        </div>

        <div className={styles.spentCard}>
          <span className={styles.spentLabel}>Gasto total:</span>
          <span className={styles.spentValue}>
            R${" "}
            {totalSpent.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Tabela de Estoque do Figma com Quantidade por Pacote */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd por Pacote / Embalagem</th>
              <th>Preço Unitário</th>
              <th>Qtd em Estoque</th>
              <th>Total Investido</th>
              <th>Data Compra</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemTotal = item.unitPrice * item.quantity;

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {item.category}
                    </div>
                  </td>
                  <td>
                    <span className={styles.packageBadge}>
                      <Boxes size={13} />
                      {item.packageSpec}
                    </span>
                  </td>
                  <td>
                    R${" "}
                    {item.unitPrice.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <strong style={{ color: item.quantity <= 10 ? "#c2410c" : "#092a54" }}>
                      {item.quantity} unidades
                    </strong>
                  </td>
                  <td>
                    <strong>
                      R${" "}
                      {itemTotal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                  <td>{item.purchaseDate}</td>
                  <td>
                    <div className={styles.actionsArea}>
                      <button
                        className={styles.btnAction}
                        onClick={() => {
                          setSelectedItemForWithdraw(item);
                          setWithdrawQty(1);
                          setIsWithdrawModalOpen(true);
                        }}
                      >
                        <Minus size={14} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                        Retirar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
                  Nenhum item cadastrado no estoque.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Adicionar Item ao Estoque */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Registrar Compra / Entrada no Estoque</h2>
              <button
                className={styles.btnClose}
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nome do Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Detergente, Tinta, Papel Higiênico..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Quantidade por Pacote / Volume (ex: 540ml, 1l, 10x) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 540ml; 1l; 10x; Galão 5L; Caixa 100 un"
                    value={newPackageSpec}
                    onChange={(e) => setNewPackageSpec(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className={styles.formGroup}>
                    <label>Preço Unitário (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Quantidade Comprada *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newQty}
                      onChange={(e) => setNewQty(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as "Limpeza" | "Obra / Manutenção" | "Escritório")
                    }
                  >
                    <option value="Limpeza">Materiais de Limpeza</option>
                    <option value="Obra / Manutenção">Insumos de Obra e Manutenção</option>
                    <option value="Escritório">Material de Apoio e Escritório</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar e Registrar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Retirada de Item */}
      {isWithdrawModalOpen && selectedItemForWithdraw && (
        <div className={styles.modalOverlay} onClick={() => setIsWithdrawModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Registrar Retirada / Uso de Insumo</h2>
              <button
                className={styles.btnClose}
                onClick={() => setIsWithdrawModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWithdraw}>
              <div className={styles.modalBody}>
                <p style={{ margin: 0, fontSize: 14, color: "#1e293b" }}>
                  Item: <strong>{selectedItemForWithdraw.name}</strong> ({selectedItemForWithdraw.packageSpec})
                  <br />
                  Estoque atual disponível: <strong>{selectedItemForWithdraw.quantity} unidades</strong>
                </p>

                <div className={styles.formGroup}>
                  <label>Quantidade a Retirar *</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItemForWithdraw.quantity}
                    value={withdrawQty}
                    onChange={(e) => setWithdrawQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Funcionário Responsável</label>
                  <select
                    value={withdrawEmployee}
                    onChange={(e) => setWithdrawEmployee(e.target.value)}
                  >
                    <option value="João Pereira (Limpeza)">João Pereira (Limpeza)</option>
                    <option value="Fernandes Alves (Serviços Gerais)">Fernandes Alves (Serviços Gerais)</option>
                    <option value="Mariana Costa (Porteiro)">Mariana Costa (Porteiro)</option>
                    <option value="Carlos Lima (Técnico)">Carlos Lima (Técnico)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Finalidade / Justificativa</label>
                  <input
                    type="text"
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="Ex: Reforma hidráulica no Bloco C"
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsWithdrawModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Confirmar Baixa
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

function periodControlsClass(styles: any) {
  return styles.periodControls;
}
