-- Aba Imóveis: situação editável (Ocupado / Disponível / Manutenção) com códigos estáveis.
-- Lock: ALTER TABLE em "property" (poucas linhas); backfill dos textos antigos para os códigos.
UPDATE property SET status = 'OCUPADO' WHERE status = 'Ocupado';
UPDATE property SET status = 'MANUTENCAO' WHERE status IN ('Em Reforma', 'Manutenção', 'Manutencao');
UPDATE property SET status = 'DISPONIVEL' WHERE status NOT IN ('OCUPADO', 'MANUTENCAO');

ALTER TABLE property ADD COLUMN notes VARCHAR(1000);
ALTER TABLE property ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE property ADD COLUMN updated_by VARCHAR(160);

ALTER TABLE property ADD CONSTRAINT ck_property_status CHECK (status IN ('OCUPADO', 'DISPONIVEL', 'MANUTENCAO'));
ALTER TABLE property ADD CONSTRAINT ck_property_monthly_rent CHECK (monthly_rent >= 0);
