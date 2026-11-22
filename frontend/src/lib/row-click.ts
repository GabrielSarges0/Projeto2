import type { MouseEvent } from "react";

const INTERACTIVE = "button, a, input, select, textarea, label, [role='button']";

/**
 * Linha de tabela inteira clicável. Cliques em botões/links da própria linha seguem o comportamento deles,
 * e quem usa teclado continua com o botão "Ver detalhes" (a <tr> não recebe foco).
 */
export function rowClickHandler(open: () => void) {
  return (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
    // Não abre ao terminar uma seleção de texto (copiar CPF, endereço etc.).
    if (window.getSelection()?.toString()) return;
    open();
  };
}
