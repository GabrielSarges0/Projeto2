"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Formulários agora ficam em Documentos → Novo documento (Relatório Sprint 3). Mantém links antigos funcionando.
export default function FormularioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/documentos?novo=1");
  }, [router]);
  return (
    <div className="auth-loading" role="status">
      Abrindo formulários em Documentos...
    </div>
  );
}
