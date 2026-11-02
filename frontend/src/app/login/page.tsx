"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionamento automático: tela de login removida
    router.replace("/");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "#092a54", fontFamily: "sans-serif" }}>
      Entrando no painel...
    </div>
  );
}
