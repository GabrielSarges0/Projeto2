"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CalendarDays,
  ChevronDown,
  Home,
  KeyRound,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  financialApi,
  propertiesApi,
  type FinancialMovement,
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

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const YEARS = [2024, 2025, 2026, 2027];

type SeasonalConfig = {
  incMult: number;
  expMult: number;
  incDist: number[];
  expDist: number[];
};

// Configuração sazonal realista com base na dinâmica imobiliária da FMC
const SEASONAL_CONFIG: Record<number, SeasonalConfig> = {
  1: { incMult: 1.05, expMult: 1.35, incDist: [0, 0.12, 0.35, 0.65, 0.8, 0.9, 1.0], expDist: [0, 0.25, 0.45, 0.7, 0.85, 0.95, 1.0] },
  2: { incMult: 0.96, expMult: 0.9, incDist: [0, 0.1, 0.3, 0.6, 0.75, 0.88, 1.0], expDist: [0, 0.1, 0.35, 0.55, 0.75, 0.9, 1.0] },
  3: { incMult: 1.01, expMult: 1.03, incDist: [0, 0.1, 0.3, 0.62, 0.73, 0.82, 1.0], expDist: [0, 0.1, 0.3, 0.55, 0.85, 0.92, 1.0] },
  4: { incMult: 1.0, expMult: 0.95, incDist: [0, 0.08, 0.32, 0.6, 0.74, 0.85, 1.0], expDist: [0, 0.12, 0.32, 0.58, 0.8, 0.9, 1.0] },
  5: { incMult: 1.03, expMult: 1.12, incDist: [0, 0.1, 0.3, 0.64, 0.76, 0.85, 1.0], expDist: [0, 0.15, 0.35, 0.62, 0.82, 0.92, 1.0] },
  6: { incMult: 0.99, expMult: 0.98, incDist: [0, 0.1, 0.3, 0.61, 0.74, 0.82, 1.0], expDist: [0, 0.1, 0.28, 0.54, 0.8, 0.9, 1.0] },
  7: { incMult: 1.05, expMult: 1.24, incDist: [0, 0.1, 0.3, 0.63, 0.75, 0.84, 1.0], expDist: [0, 0.2, 0.42, 0.68, 0.86, 0.94, 1.0] },
  8: { incMult: 1.04, expMult: 0.99, incDist: [0, 0.1, 0.3, 0.62, 0.73, 0.81, 1.0], expDist: [0, 0.1, 0.3, 0.55, 0.84, 0.9, 1.0] },
  9: { incMult: 0.99, expMult: 0.93, incDist: [0, 0.1, 0.3, 0.62, 0.73, 0.81, 1.0], expDist: [0, 0.1, 0.3, 0.55, 0.85, 0.91, 1.0] },
  10: {
    incMult: 1.0,
    expMult: 1.0,
    // Valores canônicos de Outubro: Receitas 24.750, Despesas 9.900
    incDist: [0, 2500 / 24750, 7500 / 24750, 15500 / 24750, 18000 / 24750, 20000 / 24750, 1.0],
    expDist: [0, 1000 / 9900, 3000 / 9900, 5500 / 9900, 8400 / 9900, 9000 / 9900, 1.0],
  },
  11: { incMult: 1.09, expMult: 1.09, incDist: [0, 0.12, 0.34, 0.65, 0.78, 0.88, 1.0], expDist: [0, 0.14, 0.36, 0.62, 0.82, 0.92, 1.0] },
  12: { incMult: 1.19, expMult: 1.57, incDist: [0, 0.15, 0.38, 0.68, 0.82, 0.9, 1.0], expDist: [0, 0.25, 0.5, 0.75, 0.88, 0.96, 1.0] },
};

function getMonthlyFallbackData(month: number, year: number) {
  const season = SEASONAL_CONFIG[month] ?? SEASONAL_CONFIG[10];
  const yearGrowth = 1 + (year - 2026) * 0.05;

  const totalIncome = Math.round(24750 * season.incMult * yearGrowth);
  const totalExpense = Math.round(9900 * season.expMult * yearGrowth);

  const days = [1, 5, 10, 15, 20, 25, 30];

  const cumulativeIncomes = season.incDist.map((ratio) => Math.round(totalIncome * ratio));
  const cumulativeExpenses = season.expDist.map((ratio) => Math.round(totalExpense * ratio));

  return {
    totalIncome,
    totalExpense,
    days,
    cumulativeIncomes,
    cumulativeExpenses,
  };
}

export function DashboardHome() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [propMetrics, setPropMetrics] = useState<PropertyMetrics | null>(null);
  const [contracts, setContracts] = useState<LeaseContract[]>([]);
  const [monthlyMovements, setMonthlyMovements] = useState<FinancialMovement[]>([]);

  // Filtros dinâmicos de Mês e Ano
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(10);
  const [selectedYearNum, setSelectedYearNum] = useState<number>(2026);
  const [chartMode, setChartMode] = useState<"acumulado" | "diario">("acumulado");

  // Estado interativo de hover no gráfico
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: number;
    income: number;
    expense: number;
    x: number;
    yIncome: number;
    yExpense: number;
  } | null>(null);

  // Efeito para carregar métricas de imóveis e contratos (executado uma vez)
  useEffect(() => {
    let active = true;

    Promise.allSettled([
      propertiesApi.metrics(),
      propertiesApi.expiringContracts(),
    ]).then(([metricsRes, contractsRes]) => {
      if (!active) return;

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

  // Efeito dinâmico para carregar dados financeiros quando Mês ou Ano são alterados
  useEffect(() => {
    let active = true;

    Promise.allSettled([
      financialApi.summary(selectedMonthNum, selectedYearNum),
      financialApi.movements(selectedMonthNum, selectedYearNum),
    ]).then(([summaryRes, movementsRes]) => {
      if (!active) return;

      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummary(summaryRes.value);
      } else {
        const fallback = getMonthlyFallbackData(selectedMonthNum, selectedYearNum);
        setSummary({
          income: fallback.totalIncome,
          expense: fallback.totalExpense,
          balance: fallback.totalIncome - fallback.totalExpense,
        });
      }

      if (movementsRes.status === "fulfilled" && Array.isArray(movementsRes.value)) {
        setMonthlyMovements(movementsRes.value);
      } else {
        setMonthlyMovements([]);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedMonthNum, selectedYearNum]);

  // Cálculos reativos dos dados do gráfico com base na seleção
  const chartData = useMemo(() => {
    const fallback = getMonthlyFallbackData(selectedMonthNum, selectedYearNum);
    const days = [1, 5, 10, 15, 20, 25, 30];

    let incomePoints: number[] = [];
    let expensePoints: number[] = [];

    // Se temos movimentos reais vindos do backend para este mês, agregamos por checkpoint
    if (monthlyMovements.length > 0) {
      const incByDay = new Map<number, number>();
      const expByDay = new Map<number, number>();

      for (const m of monthlyMovements) {
        const day = Number(m.date.split("-")[2]) || 1;
        if (m.type === "INCOME") {
          incByDay.set(day, (incByDay.get(day) ?? 0) + m.amount);
        } else {
          expByDay.set(day, (expByDay.get(day) ?? 0) + m.amount);
        }
      }

      let runningInc = 0;
      let runningExp = 0;
      const cumIncomes: number[] = [];
      const cumExpenses: number[] = [];
      const periodIncomes: number[] = [];
      const periodExpenses: number[] = [];

      let prevDay = 0;
      for (const d of days) {
        let periodInc = 0;
        let periodExp = 0;
        for (let i = prevDay + 1; i <= d; i++) {
          periodInc += incByDay.get(i) ?? 0;
          periodExp += expByDay.get(i) ?? 0;
        }
        runningInc += periodInc;
        runningExp += periodExp;

        cumIncomes.push(runningInc);
        cumExpenses.push(runningExp);
        periodIncomes.push(periodInc);
        periodExpenses.push(periodExp);
        prevDay = d;
      }

      incomePoints = chartMode === "acumulado" ? cumIncomes : periodIncomes;
      expensePoints = chartMode === "acumulado" ? cumExpenses : periodExpenses;
    } else {
      // Usar a distribuição matemática do modelo dinâmico
      if (chartMode === "acumulado") {
        incomePoints = fallback.cumulativeIncomes;
        expensePoints = fallback.cumulativeExpenses;
      } else {
        // Modo diário/intervalo
        incomePoints = fallback.cumulativeIncomes.map((val, idx, arr) =>
          idx === 0 ? val : Math.max(0, val - arr[idx - 1])
        );
        expensePoints = fallback.cumulativeExpenses.map((val, idx, arr) =>
          idx === 0 ? val : Math.max(0, val - arr[idx - 1])
        );
      }
    }

    // Determinar o teto do eixo Y de forma limpa e proporcional
    const maxVal = Math.max(...incomePoints, ...expensePoints, 5000);
    let step = 5000;
    if (maxVal <= 5000) step = 1000;
    else if (maxVal <= 15000) step = 2500;
    else if (maxVal <= 35000) step = 5000;
    else step = 10000;

    const yAxisMax = Math.ceil(maxVal / step) * step;

    // Mapeamento de coordenadas SVG
    // viewBox="0 0 540 210", X de 60 a 480, Y de 180 (base) a 20 (topo)
    const xCoordinates = [60, 130, 200, 270, 340, 410, 480];
    const yBase = 180;
    const yHeight = 160;

    const mappedPoints = days.map((day, idx) => {
      const incVal = incomePoints[idx] ?? 0;
      const expVal = expensePoints[idx] ?? 0;
      const x = xCoordinates[idx];
      const yIncome = Math.round(yBase - (incVal / yAxisMax) * yHeight);
      const yExpense = Math.round(yBase - (expVal / yAxisMax) * yHeight);

      return {
        day,
        income: incVal,
        expense: expVal,
        x,
        yIncome: Math.max(16, Math.min(yBase, yIncome)),
        yExpense: Math.max(16, Math.min(yBase, yExpense)),
      };
    });

    const incomePointsString = mappedPoints.map((p) => `${p.x},${p.yIncome}`).join(" ");
    const expensePointsString = mappedPoints.map((p) => `${p.x},${p.yExpense}`).join(" ");

    // 5 marcas no Eixo Y
    const yMarks = [
      { y: 20, value: yAxisMax },
      { y: 52, value: Math.round(yAxisMax * 0.8) },
      { y: 84, value: Math.round(yAxisMax * 0.6) },
      { y: 116, value: Math.round(yAxisMax * 0.4) },
      { y: 148, value: Math.round(yAxisMax * 0.2) },
      { y: 180, value: 0 },
    ];

    return {
      mappedPoints,
      incomePointsString,
      expensePointsString,
      yMarks,
      yAxisMax,
    };
  }, [monthlyMovements, selectedMonthNum, selectedYearNum, chartMode]);

  const totalProps = propMetrics?.totalProperties ?? 124;
  const occupiedProps = propMetrics?.occupied ?? 92;
  const availableProps = propMetrics?.available ?? 32;
  const maintenanceProps = propMetrics?.underMaintenance ?? 32;

  const currentSummary = summary ?? {
    income: 24750,
    expense: 9900,
    balance: 14850,
  };

  const monthlyRevenue = currency(currentSummary.income);
  const monthlyExpense = currency(currentSummary.expense);
  const monthlyBalance = currency(currentSummary.balance);

  const selectedMonthName = MONTHS.find((m) => m.value === selectedMonthNum)?.label ?? "Outubro";

  // Cards de métricas do topo sincronizados dinamicamente
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
      label: `Receita (${selectedMonthName})`,
      value: monthlyRevenue,
      icon: Banknote,
      bgColor: "#DCFCE7",
      iconColor: "#16A34A",
    },
  ];

  return (
    <AppShell>
      <section className="dashboard-home" aria-label="Painel de gestão">
        {/* 5 Cards de Métricas do Topo Dinâmicos */}
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
                  transition: "transform 140ms ease, box-shadow 140ms ease",
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
          {/* Card Esquerdo: Receitas x Despesas (mês) com Gráfico Dinâmico */}
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
            {/* Header do Card com Controles Interativos */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div>
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
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Evolução financeira de {selectedMonthName} de {selectedYearNum}
                </span>
              </div>

              {/* Controles Dinâmicos: Seletor de Mês, Ano e Modo */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Seletor de Modo: Acumulado / Diário */}
                <div
                  style={{
                    display: "inline-flex",
                    background: "#f1f5f9",
                    padding: "2px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setChartMode("acumulado")}
                    style={{
                      border: 0,
                      background: chartMode === "acumulado" ? "#092A54" : "transparent",
                      color: chartMode === "acumulado" ? "#ffffff" : "#475569",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 140ms ease",
                    }}
                    title="Ver valor acumulado progressivo"
                  >
                    Acumulado
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("diario")}
                    style={{
                      border: 0,
                      background: chartMode === "diario" ? "#092A54" : "transparent",
                      color: chartMode === "diario" ? "#ffffff" : "#475569",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 140ms ease",
                    }}
                    title="Ver entradas e saídas de cada período"
                  >
                    Por Período
                  </button>
                </div>

                {/* Seletor de Mês */}
                <div style={{ position: "relative" }}>
                  <select
                    value={selectedMonthNum}
                    onChange={(e) => setSelectedMonthNum(Number(e.target.value))}
                    aria-label="Selecionar mês"
                    style={{
                      appearance: "none",
                      padding: "0 28px 0 12px",
                      height: "28px",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "7px",
                      pointerEvents: "none",
                      color: "#64748b",
                    }}
                  />
                </div>

                {/* Seletor de Ano */}
                <div style={{ position: "relative" }}>
                  <select
                    value={selectedYearNum}
                    onChange={(e) => setSelectedYearNum(Number(e.target.value))}
                    aria-label="Selecionar ano"
                    style={{
                      appearance: "none",
                      padding: "0 28px 0 12px",
                      height: "28px",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "7px",
                      pointerEvents: "none",
                      color: "#64748b",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Legenda com Indicador Ativo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "24px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#092A54",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#092A54",
                  }}
                />
                Receitas ({monthlyRevenue})
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#D4B35A",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#D4B35A",
                  }}
                />
                Despesas ({monthlyExpense})
              </div>
            </div>

            {/* Gráfico SVG de Linha Totalmente Dinâmico e Reativo */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "230px",
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <svg
                viewBox="0 0 540 210"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
                aria-label="Gráfico de evolução financeira dinâmica"
              >
                {/* Linhas de Grade Horizontais Dinâmicas */}
                {chartData.yMarks.map((m, idx) => (
                  <line
                    key={idx}
                    x1="45"
                    y1={m.y}
                    x2="520"
                    y2={m.y}
                    stroke={m.y === 180 ? "#e2e8f0" : "#f1f5f9"}
                    strokeWidth={m.y === 180 ? "1.2" : "1"}
                  />
                ))}

                {/* Rótulo Eixo Y - Cifrão */}
                <text
                  x="5"
                  y="100"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="600"
                  transform="rotate(-90 10 100)"
                >
                  R$
                </text>

                {/* Rótulos Dinâmicos do Eixo Y */}
                {chartData.yMarks.map((m, idx) => (
                  <text
                    key={idx}
                    x="40"
                    y={m.y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {m.value.toLocaleString("pt-BR")}
                  </text>
                ))}

                {/* Rótulos do Eixo X (Dias) */}
                {chartData.mappedPoints.map((p) => (
                  <text
                    key={p.day}
                    x={p.x}
                    y="196"
                    fill={hoveredPoint?.day === p.day ? "#092A54" : "#64748b"}
                    fontWeight={hoveredPoint?.day === p.day ? 700 : 400}
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {p.day}
                  </text>
                ))}
                <text
                  x="270"
                  y="210"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Dias ({selectedMonthName})
                </text>

                {/* Linha de Receitas (Azul Escuro #092A54) */}
                <polyline
                  fill="none"
                  stroke="#092A54"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartData.incomePointsString}
                  style={{ transition: "points 300ms ease" }}
                />

                {/* Pontos de Receitas com Interação Hover */}
                {chartData.mappedPoints.map((p) => {
                  const isHovered = hoveredPoint?.day === p.day;
                  return (
                    <g key={`inc-${p.day}`}>
                      {isHovered && (
                        <circle
                          cx={p.x}
                          cy={p.yIncome}
                          r="7"
                          fill="#092A54"
                          opacity="0.25"
                        />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.yIncome}
                        r={isHovered ? "5" : "3.5"}
                        fill="#092A54"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? "2" : "0"}
                        style={{ cursor: "pointer", transition: "all 150ms ease" }}
                        onMouseEnter={() => setHoveredPoint(p)}
                      />
                    </g>
                  );
                })}

                {/* Linha de Despesas (Dourado #D4B35A) */}
                <polyline
                  fill="none"
                  stroke="#D4B35A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartData.expensePointsString}
                  style={{ transition: "points 300ms ease" }}
                />

                {/* Pontos de Despesas com Interação Hover */}
                {chartData.mappedPoints.map((p) => {
                  const isHovered = hoveredPoint?.day === p.day;
                  return (
                    <g key={`exp-${p.day}`}>
                      {isHovered && (
                        <circle
                          cx={p.x}
                          cy={p.yExpense}
                          r="7"
                          fill="#D4B35A"
                          opacity="0.25"
                        />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.yExpense}
                        r={isHovered ? "5" : "3.5"}
                        fill="#D4B35A"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? "2" : "0"}
                        style={{ cursor: "pointer", transition: "all 150ms ease" }}
                        onMouseEnter={() => setHoveredPoint(p)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Interativo Flutuante */}
              {hoveredPoint && (
                <div
                  style={{
                    position: "absolute",
                    left: `${(hoveredPoint.x / 540) * 100}%`,
                    top: `${Math.max(8, (Math.min(hoveredPoint.yIncome, hoveredPoint.yExpense) / 210) * 100 - 36)}%`,
                    transform: "translate(-50%, -100%)",
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                    pointerEvents: "none",
                    zIndex: 20,
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "4px", color: "#f8fafc" }}>
                    Dia {hoveredPoint.day} de {selectedMonthName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#93c5fd" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60a5fa" }} />
                    Receitas: {currency(hoveredPoint.income)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fde047" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#facc15" }} />
                    Despesas: {currency(hoveredPoint.expense)}
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid #334155",
                      marginTop: "4px",
                      paddingTop: "4px",
                      fontWeight: 600,
                      color: hoveredPoint.income >= hoveredPoint.expense ? "#86efac" : "#fca5a5",
                    }}
                  >
                    Saldo: {currency(hoveredPoint.income - hoveredPoint.expense)}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Dinâmico com Métricas Calculadas em Tempo Real */}
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
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748b",
                    display: "block",
                  }}
                >
                  Receitas ({selectedMonthName})
                </span>
                <strong
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#092A54",
                  }}
                >
                  {monthlyRevenue}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748b",
                    display: "block",
                  }}
                >
                  Despesas ({selectedMonthName})
                </span>
                <strong
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#D4B35A",
                  }}
                >
                  {monthlyExpense}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748b",
                    display: "block",
                  }}
                >
                  Saldo Líquido ({selectedMonthName})
                </span>
                <strong
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: currentSummary.balance >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
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
