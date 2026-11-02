"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import {
  FMCAbsenceJustification,
  FMCEmployeeAttendance,
  getStoredAttendance,
  getStoredJustifications,
  saveAttendance,
  saveJustifications,
} from "@/lib/shared-store";
import styles from "./funcionarios.module.css";

export default function FuncionariosPage() {
  const [attendanceList, setAttendanceList] = useState<FMCEmployeeAttendance[]>(() => getStoredAttendance());
  const [justifications, setJustifications] = useState<FMCAbsenceJustification[]>(() => getStoredJustifications());
  const [selectedDate, setSelectedDate] = useState("2026-10-15");
  const [isRegisterPresenceOpen, setIsRegisterPresenceOpen] = useState(false);
  const [isRegisterEmployeeOpen, setIsRegisterEmployeeOpen] = useState(false);
  const [isAddJustificationOpen, setIsAddJustificationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Formulário: Registrar Presença (Ponto)
  const [pointEmployeeId, setPointEmployeeId] = useState("");
  const [pointType, setPointType] = useState<"ENTRADA" | "SAIDA">("SAIDA");
  const [pointTime, setPointTime] = useState("17:00");

  // Formulário: Cadastrar Funcionário
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("Porteiro");
  const [newEmpCpf, setNewEmpCpf] = useState("");

  // Formulário: Justificativa de Falta
  const [justEmpName, setJustEmpName] = useState("Carlos Lima");
  const [justReason, setJustReason] = useState("");

  useEffect(() => {
    function handleUpdate() {
      setAttendanceList(getStoredAttendance());
      setJustifications(getStoredJustifications());
    }

    window.addEventListener("fmc_attendance_updated", handleUpdate);
    window.addEventListener("fmc_justifications_updated", handleUpdate);
    return () => {
      window.removeEventListener("fmc_attendance_updated", handleUpdate);
      window.removeEventListener("fmc_justifications_updated", handleUpdate);
    };
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleSavePresence(e: React.FormEvent) {
    e.preventDefault();
    if (!pointEmployeeId) {
      showToast("Selecione o funcionário para registrar ponto.");
      return;
    }

    const updated = attendanceList.map((emp) => {
      if (emp.id === pointEmployeeId) {
        if (pointType === "ENTRADA") {
          return {
            ...emp,
            status: "Presente" as const,
            entryTime: pointTime,
          };
        } else {
          return {
            ...emp,
            exitTime: pointTime, // Atualiza horário de saída (Requisito cliente)
          };
        }
      }
      return emp;
    });

    saveAttendance(updated);
    setAttendanceList(updated);
    setIsRegisterPresenceOpen(false);
    showToast(
      `Ponto de ${pointType === "ENTRADA" ? "Entrada" : "Saída"} registrado com sucesso às ${pointTime}!`
    );
  }

  function handleSaveEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmpName.trim()) {
      showToast("Informe o nome do funcionário.");
      return;
    }

    const newEmp: FMCEmployeeAttendance = {
      id: `func-${Date.now()}`,
      name: newEmpName.trim(),
      role: newEmpRole,
      status: "Presente",
      entryTime: "08:00",
      exitTime: "17:00", // Horário de saída padrão
      date: "15/10/2026",
      cpf: newEmpCpf.trim() || "000.000.000-00",
    };

    const updated = [...attendanceList, newEmp];
    saveAttendance(updated);
    setAttendanceList(updated);
    setIsRegisterEmployeeOpen(false);
    showToast(`Funcionário ${newEmp.name} cadastrado com sucesso!`);
    setNewEmpName("");
    setNewEmpCpf("");
  }

  function handleSaveJustification(e: React.FormEvent) {
    e.preventDefault();
    if (!justReason.trim()) {
      showToast("Informe o motivo da ausência.");
      return;
    }

    const newJust: FMCAbsenceJustification = {
      id: `just-${Date.now()}`,
      employeeName: justEmpName,
      date: selectedDate,
      reason: justReason.trim(),
      approved: true,
    };

    const updated = [newJust, ...justifications];
    saveJustifications(updated);
    setJustifications(updated);
    setIsAddJustificationOpen(false);
    showToast("Justificativa de falta registrada com sucesso!");
    setJustReason("");
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Presença dos Funcionários (BP07)</h1>
          <p className={styles.subtitle}>
            Acompanhamento de turnos, registro de horários de entrada e saída e controle de faltas.
          </p>
        </div>
      </div>

      {/* Barra de Data do Figma */}
      <div className={styles.dateBar}>
        <div className={styles.datePickerBox}>
          <Calendar size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Principal: Tabela à Esquerda e Botões de Ação à Direita (Figma Print) */}
      <div className={styles.mainGrid}>
        {/* Lado Esquerdo: Tabela de Presença */}
        <div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th>Horário Entrada</th>
                  <th>Horário Saída</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((emp) => {
                  const isPresent = emp.status === "Presente";
                  const isOff = emp.status === "Folga";

                  return (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.name}</strong>
                      </td>
                      <td>{emp.role}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            isPresent
                              ? styles.statusPresent
                              : isOff
                              ? styles.statusOff
                              : styles.statusAbsent
                          }`}
                        >
                          <span className={styles.statusDot} />
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={13} color="#64748b" />
                          <span>{emp.entryTime}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={13} color="#64748b" />
                          <strong style={{ color: "#092a54" }}>{emp.exitTime}</strong>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Seção Justificações de Falta do Figma */}
          <div className={styles.justificationSection}>
            <div className={styles.justificationHeader}>
              <span className={styles.justificationTitle}>Justificações de falta</span>
              <button
                className={styles.btnSecondary}
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={() => setIsAddJustificationOpen(true)}
              >
                + Adicionar Justificativa
              </button>
            </div>

            <div className={styles.justificationList}>
              {justifications.map((just) => (
                <div key={just.id} className={styles.justificationItem}>
                  <div>
                    <strong>{just.employeeName}</strong> —{" "}
                    <span style={{ color: "#475569" }}>{just.reason}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                    Aprovada
                  </span>
                </div>
              ))}
              {justifications.length === 0 && (
                <div className={styles.emptyJustification}>Nenhuma justificação</div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Botões de Ação do Figma */}
        <div className={styles.actionColumn}>
          <button
            className={styles.btnActionPrimary}
            onClick={() => setIsRegisterEmployeeOpen(true)}
          >
            <UserPlus size={18} />
            Cadastro Funcionários
          </button>

          <button
            className={styles.btnActionSecondary}
            onClick={() => {
              if (attendanceList.length > 0) {
                setPointEmployeeId(attendanceList[0].id);
              }
              setIsRegisterPresenceOpen(true);
            }}
          >
            <UserCheck size={18} />
            Registro de Presença
          </button>
        </div>
      </div>

      {/* Modal: Registro de Presença (Ponto com Horário de Entrada ou Saída) */}
      {isRegisterPresenceOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRegisterPresenceOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Registro de Presença (Ponto)</h2>
              <button
                className={styles.btnClose}
                onClick={() => setIsRegisterPresenceOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePresence}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Funcionário</label>
                  <select
                    value={pointEmployeeId}
                    onChange={(e) => setPointEmployeeId(e.target.value)}
                  >
                    {attendanceList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Marcação</label>
                  <select
                    value={pointType}
                    onChange={(e) => setPointType(e.target.value as "ENTRADA" | "SAIDA")}
                  >
                    <option value="ENTRADA">Horário de Entrada (Início de Turno)</option>
                    <option value="SAIDA">Horário de Saída (Término de Turno)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Horário do Registro *</label>
                  <input
                    type="time"
                    required
                    value={pointTime}
                    onChange={(e) => setPointTime(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsRegisterPresenceOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastro de Funcionário */}
      {isRegisterEmployeeOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRegisterEmployeeOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Cadastrar Novo Funcionário</h2>
              <button
                className={styles.btnClose}
                onClick={() => setIsRegisterEmployeeOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Função / Cargo *</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value)}
                  >
                    <option value="Porteiro">Porteiro (Escala 5x1)</option>
                    <option value="Serviços Gerais">Serviços Gerais</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Técnico">Técnico / Manutenção</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={newEmpCpf}
                    onChange={(e) => setNewEmpCpf(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsRegisterEmployeeOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar Funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Justificativa de Falta */}
      {isAddJustificationOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddJustificationOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Registrar Justificativa de Ausência</h2>
              <button
                className={styles.btnClose}
                onClick={() => setIsAddJustificationOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveJustification}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Funcionário</label>
                  <select
                    value={justEmpName}
                    onChange={(e) => setJustEmpName(e.target.value)}
                  >
                    {attendanceList.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Motivo da Ausência / Atestado *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Ex: Atestado médico de 1 dia para consulta odontológica."
                    value={justReason}
                    onChange={(e) => setJustReason(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsAddJustificationOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Registrar Justificativa
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
