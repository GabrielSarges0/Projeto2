import { ChevronDown, UserRound } from "lucide-react";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-welcome">
        <h1>Olá Administrador</h1>
        <p>Bem-vindo(a) ao painel de gestão</p>
      </div>

      <button className="account-button" type="button" aria-label="Abrir menu da conta">
        <span className="account-avatar" aria-hidden="true">
          <UserRound size={25} strokeWidth={1.7} />
        </span>
        <span className="account-name">Administrador</span>
        <ChevronDown className="account-chevron" size={20} strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  );
}
