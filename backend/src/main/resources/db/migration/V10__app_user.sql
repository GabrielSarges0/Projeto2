-- Níveis de acesso (Backlog 9): cada conta tem um papel; só o Gerente muda papéis.
-- O login continua aberto: contas novas entram como FUNCIONARIO (só leitura + ponto, justificativas,
-- retiradas do estoque e envio de documentos). Se ainda não houver Gerente ativo, a primeira conta vira Gerente.
-- Lock: tabela nova, sem impacto em dados existentes.
CREATE TABLE app_user (
    email VARCHAR(160) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) DEFAULT 'FUNCIONARIO' NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    preferences VARCHAR(4000) DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_app_user PRIMARY KEY (email),
    CONSTRAINT ck_app_user_role CHECK (role IN ('GERENTE', 'ADMINISTRADOR', 'FUNCIONARIO'))
);

CREATE INDEX idx_app_user_role_active ON app_user (role, active);
