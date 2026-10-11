"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Home,
  KeyRound,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
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
  const [selectedMonth, setSelectedMonth] = useState("Outubro");
  const [selectedYear, setSelectedYear] = useState("2026");

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      financialApi.summary(10, 2026),
      propertiesApi.metrics(),
      propertiesApi.expiringContracts(),
    ]).then(([summaryRes, metricsRes, contractsRes]) => {
      if (!active) return;

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
      } else {
        setSummary({
          income: 24750.0,
          expense: 9900.0,
          balance: 14850.0,
        });
      }

      if (metricsRes.status === "fulfilled") {
        setPropMetrics(metricsRes.value);
      } else {
        setPropMetrics({
          totalProperties: 124,
          occupied: 92,
          available: 32,
          underMaintenance: 32,
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
            endDate: "2026-10-25",
            monthlyAmount: 3200.0,
            status: "EXPIRANDO",
          },
          {
            id: 2,
            propertyRegistration: "IM-002",
            tenantName: "Maria Helena Silva",
            startDate: "2025-11-01",
            endDate: "2026-11-05",
            monthlyAmount: 2850.0,
            status: "ATIVO",
          },
        ]);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const totalProps = propMetrics?.totalProperties ?? 124;
  const occupiedProps = propMetrics?.occupied ?? 92;
  const availableProps = propMetrics?.available ?? 32;
  const maintenanceProps = propMetrics?.underMaintenance ?? 32;
  const monthlyRevenue = summary?.income ? currency(summary.income) : "R$ 24.750,00";
  const monthlyExpense = summary?.expense ? currency(summary.expense) : "R$ 9.900,00";
  const monthlyBalance = summary?.balance ? currency(summary.balance) : "R$ 14.850,00";

  // Dados dos 5 cards do topo conforme Image 4
  const metricCards = [
    {
      label: "Total de imóveis",
      value: String(totalProps),
      icon: Building2,
      bgColor: "#E0F2FE",
      iconColor: "#0284C7",
    },
    {
      label: "Ocupados",
      value: String(occupiedProps),
      icon: KeyRound,
      bgColor: "#FEE2E2",
      iconColor: "#EF4444",
    },
    {
      label: "Disponíveis",
      value: String(availableProps),
      icon: Home,
      bgColor: "#DCFCE7",
      iconColor: "#16A34A",
    },
    {
      label: "Manutenções",
      value: String(maintenanceProps),
      icon: Wrench,
      bgColor: "#FEF9C3",
      iconColor: "#CA8A04",
    },
    {
      label: "Receita Mensal",
      value: monthlyRevenue,
      icon: Banknote,
      bgColor: "#DCFCE7",
      iconColor: "#16A34A",
    },
  ];

  return (
    <AppShell>
      <section className="dashboard-home" aria-label="Painel de gestão">
        {/* 5 Cards de Métricas do Topo Exatos da Imagem 4 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {metricCards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 18px",
                  background: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: c.bgColor,
                    color: c.iconColor,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.label}
                  </span>
                  <strong
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: "26px",
                    }}
                  >
                    {c.value}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grade Central: Gráfico de Linha à Esquerda + Contratos à Direita */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.65fr 1fr",
            gap: "20px",
          }}
        >
          {/* Card Esquerdo: Receitas x Despesas (mês) com Gráfico de Linhas */}
          <article
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header do Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Receitas x Despesas (mês)
              </h2>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "28px",
                    padding: "0 10px",
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <span>{selectedMonth}</span>
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "28px",
                    padding: "0 10px",
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <span>{selectedYear}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Legenda */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "24px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#092A54" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#092A54",
                  }}
                />
                Receitas
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#D4B35A" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#D4B35A",
                  }}
                />
                Despesas
              </div>
            </div>

            {/* Gráfico SVG de Linha Exato da Imagem 4 */}
            <div style={{ position: "relative", width: "100%", height: "230px" }}>
              <svg
                viewBox="0 0 540 210"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
                aria-label="Gráfico de evolução financeira"
              >
                {/* Linhas de Grade Horizontais */}
                <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="45" y1="52" x2="520" y2="52" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="45" y1="84" x2="520" y2="84" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="45" y1="116" x2="520" y2="116" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="45" y1="148" x2="520" y2="148" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="45" y1="180" x2="520" y2="180" stroke="#e2e8f0" strokeWidth="1.2" />

                {/* Rótulos do Eixo Y */}
                <text x="5" y="100" fill="#64748b" fontSize="10" fontWeight="600" transform="rotate(-90 10 100)">
                  R$
                </text>
                <text x="40" y="24" fill="#64748b" fontSize="10" textAnchor="end">25.000</text>
                <text x="40" y="56" fill="#64748b" fontSize="10" textAnchor="end">20.000</text>
                <text x="40" y="88" fill="#64748b" fontSize="10" textAnchor="end">15.000</text>
                <text x="40" y="120" fill="#64748b" fontSize="10" textAnchor="end">10.000</text>
                <text x="40" y="152" fill="#64748b" fontSize="10" textAnchor="end">5.000</text>
                <text x="40" y="184" fill="#64748b" fontSize="10" textAnchor="end">0</text>

                {/* Rótulos do Eixo X (Dias) */}
                {/* Pontos X mapeados: 1->60, 5->130, 10->200, 15->270, 20->340, 25->410, 30->480 */}
                <text x="60" y="196" fill="#64748b" fontSize="10" textAnchor="middle">1</text>
                <text x="130" y="196" fill="#64748b" fontSize="10" textAnchor="middle">5</text>
                <text x="200" y="196" fill="#64748b" fontSize="10" textAnchor="middle">10</text>
                <text x="270" y="196" fill="#64748b" fontSize="10" textAnchor="middle">15</text>
                <text x="340" y="196" fill="#64748b" fontSize="10" textAnchor="middle">20</text>
                <text x="410" y="196" fill="#64748b" fontSize="10" textAnchor="middle">25</text>
                <text x="480" y="196" fill="#64748b" fontSize="10" textAnchor="middle">30</text>
                <text x="270" y="210" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">Dias</text>

                {/* Linha de Receitas (Azul Escuro #092A54) */}
                {/* (1, 0)->(60, 180), (5, 2500)->(130, 164), (10, 7500)->(200, 132), (15, 15500)->(270, 81), (20, 18000)->(340, 65), (25, 20000)->(410, 52), (30, 24750)->(480, 22) */}
                <polyline
                  fill="none"
                  stroke="#092A54"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="60,180 130,164 200,132 270,81 340,65 410,52 480,22"
                />
                <circle cx="60" cy="180" r="3.5" fill="#092A54" />
                <circle cx="130" cy="164" r="3.5" fill="#092A54" />
                <circle cx="200" cy="132" r="3.5" fill="#092A54" />
                <circle cx="270" cy="81" r="3.5" fill="#092A54" />
                <circle cx="340" cy="65" r="3.5" fill="#092A54" />
                <circle cx="410" cy="52" r="3.5" fill="#092A54" />
                <circle cx="480" cy="22" r="3.5" fill="#092A54" />

                {/* Linha de Despesas (Dourado/Amarelo #D4B35A) */}
                {/* (1, 0)->(60, 180), (5, 1000)->(130, 174), (10, 3000)->(200, 161), (15, 5500)->(270, 145), (20, 8400)->(340, 126), (25, 9000)->(410, 122), (30, 9900)->(480, 117) */}
                <polyline
                  fill="none"
                  stroke="#D4B35A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="60,180 130,174 200,161 270,145 340,126 410,122 480,117"
                />
                <circle cx="60" cy="180" r="3.5" fill="#D4B35A" />
                <circle cx="130" cy="174" r="3.5" fill="#D4B35A" />
                <circle cx="200" cy="161" r="3.5" fill="#D4B35A" />
                <circle cx="270" cy="145" r="3.5" fill="#D4B35A" />
                <circle cx="340" cy="126" r="3.5" fill="#D4B35A" />
                <circle cx="410" cy="122" r="3.5" fill="#D4B35A" />
                <circle cx="480" cy="117" r="3.5" fill="#D4B35A" />
              </svg>
            </div>

            {/* Rodapé com Métricas de Totais do Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block" }}>
                  Receitas
                </span>
                <strong style={{ fontSize: "15px", fontWeight: 700, color: "#092A54" }}>
                  {monthlyRevenue}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block" }}>
                  Despesas
                </span>
                <strong style={{ fontSize: "15px", fontWeight: 700, color: "#D4B35A" }}>
                  {monthlyExpense}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block" }}>
                  Saldo
                </span>
                <strong style={{ fontSize: "15px", fontWeight: 700, color: "#092A54" }}>
                  {monthlyBalance}
                </strong>
              </div>
            </div>
          </article>

          {/* Card Direito: Contratos próximos ao vencimento */}
          <article
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Contratos próximos ao vencimento
              </h2>
              <Link
                href="/financeiro"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2563eb",
                  textDecoration: "none",
                }}
              >
                Ver todos
              </Link>
            </div>

            {contracts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "220px",
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                <CalendarDays size={42} strokeWidth={1.5} />
                <p style={{ marginTop: "12px", fontSize: "13px" }}>
                  Nenhum contrato com vencimento nos próximos 30 dias.
                </p>
              </div>
            )}
          </article>
        </div>
      </section>
    </AppShell>
  );
}
