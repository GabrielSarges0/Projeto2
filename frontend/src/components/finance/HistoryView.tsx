"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Paperclip } from "lucide-react";
import { documentHref } from "@/lib/documents";
import { exportFinancialMovementsToCsv } from "@/lib/export-csv";
import { errorMessage, financialApi, type FinancialMovement } from "@/lib/financial-api";
import { MONTHS, formatCurrency, formatDate, normalizeText } from "@/lib/format";
import type { DocumentItem } from "@/lib/schemas";
import styles from "@/app/financeiro/financeiro.module.css";

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

export function HistoryView({ receipts, onBack }: { receipts: Map<number, DocumentItem>; onBack: () => void }) {
  const [movements, setMovements] = useState<FinancialMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [year, setYear] = useState("ALL");
  const [month, setMonth] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMovements(await financialApi.allMovements());
    } catch (err) {
      setError(errorMessage(err, "Não foi possível carregar o histórico."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    void load();
  }, [load]);

  const years = useMemo(() => Array.from(new Set(movements.map((item) => item.date.slice(0, 4)))).sort().reverse(), [movements]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return movements.filter((item) => {
      if (type !== "ALL" && item.type !== type) return false;
      if (year !== "ALL" && item.date.slice(0, 4) !== year) return false;
      if (month !== "ALL" && Number(item.date.slice(5, 7)) !== Number(month)) return false;
      if (!term) return true;
      return normalizeText(`${item.tenantName} ${item.propertyRegistration} ${formatDate(item.date)}`).includes(term);
    });
  }, [movements, search, type, year, month]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((item) => {
      if (item.type === "INCOME") income += Math.round(item.amount * 100);
      else expense += Math.round(item.amount * 100);
    });
    return { income: income / 100, expense: expense / 100, balance: (income - expense) / 100 };
  }, [filtered]);

  return (
    <section className="ui-page" aria-labelledby="history-title">
      <div className="ui-page-header">
        <div>
          <h1 id="history-title">Histórico financeiro</h1>
          <p>Todas as entradas e saídas registradas, com filtros.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="ui-btn ui-btn-secondary"
            onClick={() => exportFinancialMovementsToCsv(filtered, "historico_filtrado")}
            title="Exportar registros filtrados em planilha CSV"
          >
            <Download size={16} aria-hidden="true" /> Exportar CSV
          </button>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onBack}>
            ← Voltar ao mês
          </button>
        </div>
      </div>

      <div className="ui-toolbar">
        <div className="ui-field">
          <label htmlFor="hist-search">Buscar</label>
          <input id="hist-search" className="ui-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, imóvel ou data" />
        </div>
        <div className="ui-field">
          <label htmlFor="hist-type">Tipo</label>
          <select id="hist-type" className="ui-input" value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
            <option value="ALL">Todos</option>
            <option value="INCOME">Entradas</option>
            <option value="EXPENSE">Saídas</option>
          </select>
        </div>
        <div className="ui-field">
          <label htmlFor="hist-year">Ano</label>
          <select id="hist-year" className="ui-input" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="ALL">Todos</option>
            {years.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="ui-field">
          <label htmlFor="hist-month">Mês</label>
          <select id="hist-month" className="ui-input" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="ALL">Todos</option>
            {MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ui-stat-grid">
        <div className="ui-card">
          <span className="ui-stat-label">Entradas</span>
          <div className="ui-stat-value" style={{ color: "var(--ui-success)" }}>{formatCurrency(totals.income)}</div>
        </div>
        <div className="ui-card">
          <span className="ui-stat-label">Saídas</span>
          <div className="ui-stat-value" style={{ color: "var(--ui-danger)" }}>{formatCurrency(totals.expense)}</div>
        </div>
        <div className="ui-card">
          <span className="ui-stat-label">Saldo do filtro</span>
          <div className="ui-stat-value">{formatCurrency(totals.balance)}</div>
        </div>
      </div>

      {error ? (
        <p className="ui-alert ui-alert-error" role="alert">
          {error}{" "}
          <button type="button" className="ui-link" onClick={() => void load()}>
            Tentar de novo
          </button>
        </p>
      ) : null}

      <div className="ui-table-wrap">
        <table className="ui-table">
          <caption className="sr-only">Movimentações financeiras</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Tipo</th>
              <th scope="col">Descrição / inquilino</th>
              <th scope="col">Imóvel</th>
              <th scope="col" style={{ textAlign: "right" }}>
                Valor
              </th>
              <th scope="col">Comprovante</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="ui-skeleton" style={{ height: 24 }} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="ui-empty">
                  Nenhuma movimentação encontrada com esses filtros.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const receipt = receipts.get(item.id);
                return (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <span className={`ui-badge ${item.type === "INCOME" ? "ui-badge-success" : "ui-badge-danger"}`}>
                        {item.type === "INCOME" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td>{item.tenantName}</td>
                    <td>{item.propertyRegistration}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }} className={item.type === "INCOME" ? styles.positiveAmount : styles.negativeAmount}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td>
                      {receipt ? (
                        <Link href={documentHref(receipt.id)} className="ui-link">
                          <Paperclip size={13} aria-hidden="true" /> {receipt.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
