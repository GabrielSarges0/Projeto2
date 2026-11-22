"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Download, History, Minus, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { FOLDER_IDS, createDocument, documentHref } from "@/lib/documents";
import { exportInventoryToCsv } from "@/lib/export-csv";
import { ACCEPTED_FILE_TYPES, fileTooLargeMessage } from "@/lib/files";
import { errorMessage, financialApi, notifyFinanceChanged } from "@/lib/financial-api";
import { MONTHS, formatCurrency, formatDate, formatMoneyInput, newId, normalizeText, parseMoney, toCents, todayIso } from "@/lib/format";
import { useRecords } from "@/lib/records";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_MOVEMENT_LABEL,
  INVENTORY_MOVEMENT_TYPES,
  inventoryItemSchema,
  inventoryMovementSchema,
  type InventoryItem,
  type InventoryMovement,
} from "@/lib/schemas";
import { useCan } from "@/lib/permissions";
import { useSession } from "@/lib/session";
import { useStaffDirectory } from "@/lib/staff";
import { amountError, lengthError, pastDateError } from "@/lib/validation";

const MAX_QUANTITY = 100_000;

export default function EstoquePage() {
  const itemsStore = useRecords("inventory", inventoryItemSchema);
  const movementsStore = useRecords("inventory-movements", inventoryMovementSchema);
  const { members: staff } = useStaffDirectory();
  const { show, node: toast } = useToast();
  const canEdit = useCan("edit");
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [search, setSearch] = useState("");
  const [purchaseFor, setPurchaseFor] = useState<InventoryItem | "new" | null>(null);
  const [withdrawFor, setWithdrawFor] = useState<InventoryItem | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const movements = movementsStore.items;
  const periodPurchases = movements.filter(
    (movement) => movement.type === "ENTRADA" && movement.date.slice(0, 4) === year && Number(movement.date.slice(5, 7)) === Number(month)
  );
  const periodSpentCents = periodPurchases.reduce((acc, movement) => acc + toCents((movement.unitPrice ?? 0) * movement.quantity), 0);
  const stockValueCents = itemsStore.items.reduce((acc, item) => acc + toCents(item.unitPrice * item.quantity), 0);
  const lowStock = itemsStore.items.filter((item) => item.quantity <= item.minQuantity);
  const years = Array.from(new Set([String(now.getFullYear()), ...movements.map((movement) => movement.date.slice(0, 4))])).sort().reverse();

  const items = useMemo(() => {
    const term = normalizeText(search);
    return itemsStore.items
      .filter((item) => !term || normalizeText(`${item.name} ${item.packageSpec} ${item.category}`).includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [itemsStore.items, search]);

  return (
    <AppShell>
      <section className="ui-page" aria-labelledby="estoque-title">
        <div className="ui-page-header">
          <div>
            <h1 id="estoque-title">Gestão de itens e estoque (DML)</h1>
            <p>Materiais de limpeza e insumos de obra: compras, retiradas, descartes e histórico.</p>
          </div>
          <div className="ui-row-actions">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => exportInventoryToCsv(itemsStore.items)}
              title="Exportar inventário completo em planilha CSV"
            >
              <Download size={18} aria-hidden="true" /> Exportar Inventário
            </button>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setHistoryOpen(true)}>
              <History size={18} aria-hidden="true" /> Histórico
            </button>
            {canEdit ? (
              <button type="button" className="ui-btn ui-btn-primary" onClick={() => setPurchaseFor("new")}>
                <Plus size={18} aria-hidden="true" /> Registrar compra / entrada
              </button>
            ) : null}
          </div>
        </div>

        <div className="ui-toolbar">
          <div className="ui-field">
            <label htmlFor="est-ano">Ano</label>
            <select id="est-ano" className="ui-input" value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="ui-field">
            <label htmlFor="est-mes">Mês</label>
            <select id="est-mes" className="ui-input" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="ui-field" style={{ flex: "2 1 200px" }}>
            <label htmlFor="est-busca">Buscar item</label>
            <input id="est-busca" className="ui-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, embalagem ou categoria" />
          </div>
        </div>

        <div className="ui-stat-grid">
          <div className="ui-card">
            <span className="ui-stat-label">
              Gasto em compras ({MONTHS[Number(month) - 1]}/{year})
            </span>
            <div className="ui-stat-value">{formatCurrency(periodSpentCents / 100)}</div>
          </div>
          <div className="ui-card">
            <span className="ui-stat-label">Valor em estoque hoje</span>
            <div className="ui-stat-value">{formatCurrency(stockValueCents / 100)}</div>
          </div>
          <div className="ui-card">
            <span className="ui-stat-label">Itens abaixo do mínimo</span>
            <div className="ui-stat-value" style={{ color: lowStock.length ? "var(--ui-warning)" : undefined }}>
              {lowStock.length}
            </div>
          </div>
        </div>

        {itemsStore.error ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {itemsStore.error}
          </p>
        ) : null}

        <div className="ui-table-wrap">
          <table className="ui-table">
            <caption className="sr-only">Itens em estoque</caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Embalagem</th>
                <th scope="col">Preço unitário</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Total</th>
                <th scope="col">Última compra</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itemsStore.loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="ui-skeleton" style={{ height: 22 }} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ui-empty">
                    {itemsStore.items.length === 0 ? "Nenhum item cadastrado. Registre a primeira compra." : "Nenhum item encontrado."}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="ui-field-hint">{item.category}</div>
                    </td>
                    <td>{item.packageSpec}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>
                      <strong style={{ color: item.quantity <= item.minQuantity ? "var(--ui-warning)" : undefined }}>{item.quantity} un.</strong>
                      {item.quantity <= item.minQuantity ? <div className="ui-field-hint">abaixo do mínimo ({item.minQuantity})</div> : null}
                    </td>
                    <td>{formatCurrency(toCents(item.unitPrice * item.quantity) / 100)}</td>
                    <td>{formatDate(item.lastPurchaseDate)}</td>
                    <td>
                      <div className="ui-row-actions">
                        {canEdit ? (
                          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setPurchaseFor(item)} aria-label={`Registrar compra de ${item.name}`}>
                            <Plus size={14} aria-hidden="true" /> Entrada
                          </button>
                        ) : null}
                        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setWithdrawFor(item)} disabled={item.quantity === 0} aria-label={`Retirar ${item.name}`}>
                          <Minus size={14} aria-hidden="true" /> Retirar
                        </button>
                        {canEdit ? (
                          <button type="button" className="ui-icon-btn" onClick={() => setEditing(item)} aria-label={`Editar ${item.name}`} title="Editar item">
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {purchaseFor ? (
        <PurchaseModal
          item={purchaseFor === "new" ? null : purchaseFor}
          items={itemsStore.items}
          onClose={() => setPurchaseFor(null)}
          onDone={(message, tone) => {
            setPurchaseFor(null);
            show(message, tone);
          }}
          saveItem={itemsStore.save}
          saveMovement={movementsStore.save}
        />
      ) : null}
      {withdrawFor ? (
        <WithdrawModal
          item={withdrawFor}
          employees={staff.map((member) => `${member.name} (${member.role})`)}
          onClose={() => setWithdrawFor(null)}
          onDone={(message) => {
            setWithdrawFor(null);
            show(message);
          }}
          saveItem={itemsStore.save}
          saveMovement={movementsStore.save}
        />
      ) : null}
      {editing ? (
        <EditItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async (item) => {
            await itemsStore.save(item);
            setEditing(null);
            show("Item atualizado.");
          }}
        />
      ) : null}
      {historyOpen ? <InventoryHistory movements={movements} onClose={() => setHistoryOpen(false)} /> : null}
      {toast}
    </AppShell>
  );
}

type SaveItem = (item: InventoryItem) => Promise<void>;
type SaveMovement = (movement: InventoryMovement) => Promise<void>;

function PurchaseModal({
  item,
  items,
  onClose,
  onDone,
  saveItem,
  saveMovement,
}: {
  item: InventoryItem | null;
  items: InventoryItem[];
  onClose: () => void;
  onDone: (message: string, tone?: "success" | "error") => void;
  saveItem: SaveItem;
  saveMovement: SaveMovement;
}) {
  const session = useSession();
  const [name, setName] = useState(item?.name ?? "");
  const [packageSpec, setPackageSpec] = useState(item?.packageSpec ?? "");
  const [category, setCategory] = useState<InventoryItem["category"]>(item?.category ?? "Limpeza");
  const [unitPrice, setUnitPrice] = useState(item ? formatMoneyInput(String(toCents(item.unitPrice))) : "");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(todayIso());
  const [registerExpense, setRegisterExpense] = useState(true);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const qty = Number(quantity);
  const price = parseMoney(unitPrice);
  const totalCents = Number.isFinite(price) && Number.isInteger(qty) ? toCents(price) * qty : 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!item) {
      const nameError = lengthError(name, "o nome do item", 2, 80);
      if (nameError) found.name = nameError;
      else if (items.some((other) => normalizeText(other.name) === normalizeText(name) && normalizeText(other.packageSpec) === normalizeText(packageSpec))) {
        found.name = "Este item com esta embalagem já existe: use “Entrada” na linha dele.";
      }
      const specError = lengthError(packageSpec, "a embalagem", 2, 60);
      if (specError) found.packageSpec = specError;
    }
    const priceError = amountError(price, { label: "Preço unitário", max: 100_000 });
    if (priceError) found.unitPrice = priceError;
    if (!/^\d+$/.test(quantity) || qty < 1 || qty > MAX_QUANTITY) found.quantity = `Quantidade inteira de 1 a ${MAX_QUANTITY.toLocaleString("pt-BR")}.`;
    const dateError = pastDateError(date, "Data da compra");
    if (dateError) found.date = dateError;
    if (!found.unitPrice && !found.quantity && totalCents > 100_000_000) found.quantity = "Total da compra acima de R$ 1.000.000,00.";
    if (receipt) {
      const tooLarge = fileTooLargeMessage(receipt);
      if (tooLarge) found.receipt = tooLarge;
    }
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const target: InventoryItem = item
        ? { ...item, quantity: item.quantity + qty, unitPrice: toCents(price) / 100, lastPurchaseDate: date > item.lastPurchaseDate ? date : item.lastPurchaseDate }
        : {
            id: newId("est"),
            name: name.trim(),
            packageSpec: packageSpec.trim(),
            category,
            unitPrice: toCents(price) / 100,
            quantity: qty,
            minQuantity: 5,
            lastPurchaseDate: date,
          };
      let attachmentDocId: string | null = null;
      if (receipt) {
        const doc = await createDocument({ name: receipt.name, folderId: FOLDER_IDS.estoque, category: "Comprovante", description: `Compra de ${qty} × ${target.name}.`, file: receipt });
        attachmentDocId = doc.id;
      }
      await saveItem(target);
      await saveMovement({
        id: newId("mov"),
        itemId: target.id,
        itemName: target.name,
        type: "ENTRADA",
        quantity: qty,
        unitPrice: toCents(price) / 100,
        date,
        responsible: session?.user.name ?? "",
        reason: "Compra",
        attachmentDocId,
        attachmentName: receipt?.name ?? null,
        createdBy: session?.user.name ?? "",
        createdAt: new Date().toISOString(),
      });
      let warning = "";
      if (registerExpense) {
        try {
          await financialApi.createExpense({
            description: `Insumos / DML · ${qty} × ${target.name} (${target.packageSpec})`.slice(0, 160),
            propertyRegistration: "GERAL",
            transactionDate: date,
            grossAmount: totalCents / 100,
          });
          notifyFinanceChanged();
        } catch (err) {
          warning = ` Atenção: a saída no Financeiro não foi registrada (${errorMessage(err)}).`;
        }
      }
      onDone(`Entrada de ${qty} × ${target.name} registrada.${registerExpense && !warning ? " Saída lançada no Financeiro." : ""}${warning}`, warning ? "error" : "success");
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setSaving(false);
    }
  }

  return (
    <Modal
      title={item ? `Entrada de ${item.name}` : "Registrar compra / novo item"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="purchase-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Salvar entrada"}
          </button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        {!item ? (
          <div className="ui-form-grid">
            <Field label="Nome do item" error={errors.name} required>
              {(props) => <input {...props} data-autofocus className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ex.: Detergente" />}
            </Field>
            <Field label="Embalagem / quantidade por pacote" error={errors.packageSpec} required>
              {(props) => <input {...props} className="ui-input" value={packageSpec} onChange={(e) => setPackageSpec(e.target.value)} maxLength={60} placeholder="Ex.: 540 ml; 1 L; 10 un." />}
            </Field>
            <Field label="Categoria">
              {(props) => (
                <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as InventoryItem["category"])}>
                  {INVENTORY_CATEGORIES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 14 }}>
            Estoque atual: <strong>{item.quantity} un.</strong> ({item.packageSpec})
          </p>
        )}
        <div className="ui-form-grid">
          <Field label="Preço unitário" error={errors.unitPrice} required>
            {(props) => <input {...props} className="ui-input" inputMode="numeric" placeholder="R$ 0,00" value={unitPrice} onChange={(e) => setUnitPrice(formatMoneyInput(e.target.value))} />}
          </Field>
          <Field label="Quantidade comprada" error={errors.quantity} required>
            {(props) => <input {...props} className="ui-input" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, "").slice(0, 6))} />}
          </Field>
          <Field label="Data da compra" error={errors.date} required>
            {(props) => <input {...props} type="date" className="ui-input" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Recibo da compra" error={errors.receipt} hint="Opcional (Backlog 8.2).">
            {(props) => <input {...props} type="file" className="ui-input" accept={ACCEPTED_FILE_TYPES} onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />}
          </Field>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Total da compra: <strong>{formatCurrency(totalCents / 100)}</strong>
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 24 }}>
          <input type="checkbox" checked={registerExpense} onChange={(e) => setRegisterExpense(e.target.checked)} /> Lançar como saída no Financeiro (despesa geral)
        </label>
        {errors.form ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {errors.form}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function WithdrawModal({
  item,
  employees,
  onClose,
  onDone,
  saveItem,
  saveMovement,
}: {
  item: InventoryItem;
  employees: string[];
  onClose: () => void;
  onDone: (message: string) => void;
  saveItem: SaveItem;
  saveMovement: SaveMovement;
}) {
  const session = useSession();
  const [type, setType] = useState<"RETIRADA" | "DESCARTE">("RETIRADA");
  const [quantity, setQuantity] = useState("1");
  const [responsible, setResponsible] = useState(employees[0] ?? session?.user.name ?? "");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayIso());
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const qty = Number(quantity);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!/^\d+$/.test(quantity) || qty < 1) found.quantity = "Informe uma quantidade inteira maior que zero.";
    else if (qty > item.quantity) found.quantity = `Só há ${item.quantity} un. em estoque.`;
    if (responsible.trim().length < 3) found.responsible = "Informe o responsável.";
    const reasonError = lengthError(reason, "a finalidade / motivo", 5, 300);
    if (reasonError) found.reason = reasonError;
    const dateError = pastDateError(date, "Data");
    if (dateError) found.date = dateError;
    if (type === "DESCARTE" && !photo) found.photo = "No descarte, anexe uma foto do item (Backlog 8.3).";
    if (photo) {
      const tooLarge = fileTooLargeMessage(photo);
      if (tooLarge) found.photo = tooLarge;
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      let attachmentDocId: string | null = null;
      if (photo) {
        const doc = await createDocument({ name: photo.name, folderId: FOLDER_IDS.estoque, category: "Outro", description: `${INVENTORY_MOVEMENT_LABEL[type]} de ${qty} × ${item.name}: ${reason.trim()}`, file: photo });
        attachmentDocId = doc.id;
      }
      await saveItem({ ...item, quantity: item.quantity - qty });
      await saveMovement({
        id: newId("mov"),
        itemId: item.id,
        itemName: item.name,
        type,
        quantity: qty,
        unitPrice: item.unitPrice,
        date,
        responsible: responsible.trim(),
        reason: reason.trim(),
        attachmentDocId,
        attachmentName: photo?.name ?? null,
        createdBy: session?.user.name ?? "",
        createdAt: new Date().toISOString(),
      });
      onDone(`${INVENTORY_MOVEMENT_LABEL[type]} de ${qty} × ${item.name} registrada por ${responsible.trim()}.`);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Retirar ${item.name}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="withdraw-form" className="ui-btn ui-btn-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Salvando..." : "Confirmar baixa"}
          </button>
        </>
      }
    >
      <form id="withdraw-form" onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          Disponível: <strong>{item.quantity} un.</strong> ({item.packageSpec})
        </p>
        <div className="ui-form-grid">
          <Field label="Tipo de baixa">
            {(props) => (
              <select {...props} className="ui-input" value={type} onChange={(e) => setType(e.target.value as "RETIRADA" | "DESCARTE")}>
                <option value="RETIRADA">Retirada para uso</option>
                <option value="DESCARTE">Descarte (item inutilizado)</option>
              </select>
            )}
          </Field>
          <Field label="Quantidade" error={errors.quantity} required>
            {(props) => <input {...props} data-autofocus className="ui-input" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, "").slice(0, 6))} />}
          </Field>
          <Field label="Responsável" error={errors.responsible} required>
            {(props) => (
              <input {...props} className="ui-input" list="estoque-funcionarios" value={responsible} onChange={(e) => setResponsible(e.target.value)} maxLength={120} />
            )}
          </Field>
          <Field label="Data" error={errors.date} required>
            {(props) => <input {...props} type="date" className="ui-input" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />}
          </Field>
        </div>
        <datalist id="estoque-funcionarios">
          {employees.map((employee) => (
            <option key={employee} value={employee} />
          ))}
        </datalist>
        <Field label="Finalidade / motivo" error={errors.reason} required>
          {(props) => <input {...props} className="ui-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Ex.: Limpeza dos blocos A e B" />}
        </Field>
        <Field label={type === "DESCARTE" ? "Foto do item" : "Foto (opcional)"} error={errors.photo} required={type === "DESCARTE"}>
          {(props) => <input {...props} type="file" className="ui-input" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />}
        </Field>
        {errors.form ? (
          <p className="ui-alert ui-alert-error" role="alert">
            {errors.form}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function EditItemModal({ item, onClose, onSave }: { item: InventoryItem; onClose: () => void; onSave: (item: InventoryItem) => Promise<void> }) {
  const [name, setName] = useState(item.name);
  const [packageSpec, setPackageSpec] = useState(item.packageSpec);
  const [category, setCategory] = useState(item.category);
  const [minQuantity, setMinQuantity] = useState(String(item.minQuantity));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || packageSpec.trim().length < 2) return setError("Preencha nome e embalagem.");
    if (!/^\d{1,5}$/.test(minQuantity)) return setError("Estoque mínimo deve ser um número inteiro.");
    setSaving(true);
    try {
      await onSave({ ...item, name: name.trim(), packageSpec: packageSpec.trim(), category, minQuantity: Number(minQuantity) });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Editar ${item.name}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="edit-item-form" className="ui-btn ui-btn-primary" disabled={saving}>
            Salvar
          </button>
        </>
      }
    >
      <form id="edit-item-form" onSubmit={handleSubmit} noValidate className="ui-form-grid">
        <Field label="Nome" required>
          {(props) => <input {...props} className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
        </Field>
        <Field label="Embalagem" required>
          {(props) => <input {...props} className="ui-input" value={packageSpec} onChange={(e) => setPackageSpec(e.target.value)} maxLength={60} />}
        </Field>
        <Field label="Categoria">
          {(props) => (
            <select {...props} className="ui-input" value={category} onChange={(e) => setCategory(e.target.value as InventoryItem["category"])}>
              {INVENTORY_CATEGORIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Estoque mínimo (alerta)" hint="A quantidade fica em destaque abaixo deste valor.">
          {(props) => <input {...props} className="ui-input" inputMode="numeric" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value.replace(/\D/g, "").slice(0, 5))} />}
        </Field>
        {error ? (
          <p className="ui-alert ui-alert-error" role="alert" style={{ gridColumn: "1 / -1" }}>
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function InventoryHistory({ movements, onClose }: { movements: InventoryMovement[]; onClose: () => void }) {
  const [type, setType] = useState<InventoryMovement["type"] | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const term = normalizeText(search);
  // Datas ISO (yyyy-mm-dd) comparam como texto. Período invertido não filtra para não sumir com tudo sem explicação.
  const rangeError = from && to && to < from ? "A data final não pode ser anterior à inicial." : null;
  const rows = movements
    .filter((movement) => {
      if (type !== "ALL" && movement.type !== type) return false;
      if (!rangeError && from && movement.date < from) return false;
      if (!rangeError && to && movement.date > to) return false;
      return !term || normalizeText(`${movement.itemName} ${movement.responsible} ${movement.reason}`).includes(term);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <Modal title="Histórico do estoque (DML)" wide onClose={onClose}>
      <div className="ui-toolbar">
        <div className="ui-field">
          <label htmlFor="hist-tipo">Tipo</label>
          <select id="hist-tipo" className="ui-input" value={type} onChange={(e) => setType(e.target.value as InventoryMovement["type"] | "ALL")}>
            <option value="ALL">Todos</option>
            {INVENTORY_MOVEMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {INVENTORY_MOVEMENT_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
        <Field label="De">
          {(props) => <input {...props} type="date" className="ui-input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />}
        </Field>
        <Field label="Até" error={rangeError}>
          {(props) => <input {...props} type="date" className="ui-input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />}
        </Field>
        <div className="ui-field" style={{ flex: "2 1 180px" }}>
          <label htmlFor="hist-busca">Buscar</label>
          <input id="hist-busca" className="ui-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Item, responsável ou motivo" />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="ui-empty">Nenhuma movimentação com esses filtros.</p>
      ) : (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Tipo</th>
                <th scope="col">Item</th>
                <th scope="col">Qtd.</th>
                <th scope="col">Responsável</th>
                <th scope="col">Motivo</th>
                <th scope="col">Anexo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((movement) => (
                <tr key={movement.id}>
                  <td>{formatDate(movement.date)}</td>
                  <td>
                    <span className={`ui-badge ${movement.type === "ENTRADA" ? "ui-badge-success" : movement.type === "DESCARTE" ? "ui-badge-danger" : "ui-badge-info"}`}>
                      {INVENTORY_MOVEMENT_LABEL[movement.type]}
                    </span>
                  </td>
                  <td>{movement.itemName}</td>
                  <td>
                    {movement.type === "ENTRADA" ? "+" : "−"}
                    {movement.quantity}
                  </td>
                  <td>{movement.responsible || "—"}</td>
                  <td>{movement.reason}</td>
                  <td>
                    {movement.attachmentDocId ? (
                      <Link className="ui-link" href={documentHref(movement.attachmentDocId)}>
                        {movement.attachmentName ?? "Abrir"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
