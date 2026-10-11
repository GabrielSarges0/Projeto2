"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CalendarDays,
  CircleDollarSign,
  KeyRound,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "./MetricCard";
import {
  financialApi,
  propertiesApi,
  type FinancialSummary,
  type LeaseContract,
  type PropertyMetrics,
} from "@/lib/financial-api";

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function displayDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function DashboardHome() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [propMetrics, setPropMetrics] = useState<PropertyMetrics | null>(null);
  const [contracts, setContracts] = useState<LeaseContract[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      financialApi.summary(currentMonth, currentYear),
      propertiesApi.metrics(),
      propertiesApi.expiringContracts(),
    ]).then(([summaryRes, metricsRes, contractsRes]) => {
      if (!active) return;

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
      }

      if (metricsRes.status === "fulfilled") {
        setPropMetrics(metricsRes.value);
      } else {
        setPropMetrics({
          totalProperties: 5,
          occupied: 3,
          available: 1,
          underMaintenance: 1,
        });
      }

      if (contractsRes.status === "fulfilled") {
        setContracts(contractsRes.value);
      } else {
        setContracts([
          {
            id: 1,
            propertyRegistration: "IM-001",
            tenantName: "João Pedro Cavalcanti",
            startDate: "2025-10-10",
            endDate: "2026-10-10",
            monthlyAmount: 3200.0,
            status: "EXPIRANDO",
          },
          {
            id: 2,
            propertyRegistration: "IM-002",
            tenantName: "Maria Helena Silva",
            startDate: "2025-11-01",
            endDate: "2026-11-01",
            monthlyAmount: 2850.0,
            status: "ATIVO",
          },
        ]);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentMonth, currentYear]);

  const monthlyRevenue = summary ? currency(summary.income) : "R$ 0,00";

  const totalProps = propMetrics?.totalProperties ?? 5;
  const occupiedProps = propMetrics?.occupied ?? 3;
  const availableProps = propMetrics?.available ?? 1;
  const maintenanceProps = propMetrics?.underMaintenance ?? 1;

  const occupiedPct = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0;
  const availablePct = totalProps > 0 ? Math.round((availableProps / totalProps) * 100) : 0;

  const metrics = [
    {
      label: "Total de imóveis",
      value: String(totalProps),
      helper: "Patrimônio cadastrado",
      icon: Building2,
    },
    {
      label: "Ocupados",
      value: String(occupiedProps),
      helper: `${occupiedPct}% do total`,
      icon: KeyRound,
    },
    {
      label: "Disponíveis",
      value: String(availableProps),
      helper: `${availablePct}% do total`,
      icon: Building2,
    },
    {
      label: "Manutenções",
      value: String(maintenanceProps),
      helper: "Pendentes",
      icon: Wrench,
    },
    {
      label: "Receita mensal",
      value: loading ? "Carregando..." : monthlyRevenue,
      helper: `Mês ${currentMonth}/${currentYear}`,
      icon: Banknote,
    },
  ];

  const totalMovement = (summary?.income ?? 0) + (summary?.expense ?? 0);
  const incomePercent = totalMovement > 0 ? Math.round(((summary?.income ?? 0) / totalMovement) * 100) : 0;
  const expensePercent = totalMovement > 0 ? Math.round(((summary?.expense ?? 0) / totalMovement) * 100) : 0;

  return (
    <AppShell>
      <section className="dashboard-home" aria-label="Visão geral">
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="dashboard-panels">
          <article className="dashboard-panel finance-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">VISÃO FINANCEIRA</span>
                <h2>Receitas x Despesas ({currentMonth}/{currentYear})</h2>
              </div>
              <CircleDollarSign size={25} strokeWidth={1.7} aria-hidden="true" />
            </div>

            {summary ? (
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", textAlign: "center" }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#166534", fontSize: "12px", fontWeight: "600" }}>
                      <TrendingUp size={16} /> Entradas
                    </div>
                    <strong style={{ display: "block", marginTop: "4px", fontSize: "16px", color: "#14532d" }}>
                      {currency(summary.income)}
                    </strong>
                  </div>

                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#991b1b", fontSize: "12px", fontWeight: "600" }}>
                      <TrendingDown size={16} /> Saídas
                    </div>
                    <strong style={{ display: "block", marginTop: "4px", fontSize: "16px", color: "#7f1d1d" }}>
                      {currency(summary.expense)}
                    </strong>
                  </div>

                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Saldo do Mês</span>
                    <strong style={{ display: "block", marginTop: "4px", fontSize: "16px", color: summary.balance >= 0 ? "#166534" : "#991b1b" }}>
                      {currency(summary.balance)}
                    </strong>
                  </div>
                </div>

                {totalMovement > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                      <span>Receitas: {incomePercent}%</span>
                      <span>Despesas: {expensePercent}%</span>
                    </div>
                    <div style={{ height: "10px", width: "100%", background: "#ef4444", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${incomePercent}%`, background: "#22c55e", height: "100%" }} />
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                    Nenhuma movimentação registrada no mês vigente.
                  </p>
                )}

                <div style={{ textAlign: "right" }}>
                  <Link
                    href="/financeiro"
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1d4ed8",
                      textDecoration: "underline",
                    }}
                  >
                    Acessar Painel Financeiro Completo →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="chart-empty" aria-label="Aguardando dados da API Java">
                <p>
                  {loading
                    ? "Consultando API Java..."
                    : "Backend offline. Inicie o backend com .\\iniciar.ps1 para visualizar dados em tempo real."}
                </p>
                <Link
                  href="/financeiro"
                  style={{ fontSize: "13px", fontWeight: "600", color: "#1d4ed8", textDecoration: "underline" }}
                >
                  Abrir painel financeiro →
                </Link>
              </div>
            )}
          </article>

          <article className="dashboard-panel contracts-panel">
            <div className="panel-heading contracts-heading">
              <div className="contracts-title">
                <CalendarDays size={26} strokeWidth={1.7} aria-hidden="true" />
                <h2>Contratos próximos ao vencimento</h2>
              </div>
              <Link href="/financeiro" className="view-all-button">
                Ver todos
              </Link>
            </div>

            {contracts.length > 0 ? (
              <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {contracts.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {c.propertyRegistration}
                        </span>
                        <strong style={{ color: "#1e293b" }}>{c.tenantName}</strong>
                      </div>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        Vencimento: {displayDate(c.endDate)} • {currency(c.monthlyAmount)}/mês
                      </span>
                    </div>

                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: c.status === "EXPIRANDO" ? "#fef3c7" : "#dcfce7",
                        color: c.status === "EXPIRANDO" ? "#92400e" : "#166534",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="contracts-empty">
                <CalendarDays size={42} strokeWidth={1.25} aria-hidden="true" />
                <p>Monitoramento ativo dos contratos de locação vinculados ao patrimônio da fundação.</p>
              </div>
            )}
          </article>
        </div>
      </section>
    </AppShell>
  );
}


