-- Relatório da Sprint 3: lembrete precisa de data limite e pode ser editado.
-- Lock: ALTER TABLE em "reminder" (poucas linhas); backfill trivial do prazo com a data de criação.
ALTER TABLE reminder ADD COLUMN due_date DATE;
UPDATE reminder SET due_date = CAST(created_at AS DATE) WHERE due_date IS NULL;
ALTER TABLE reminder ALTER COLUMN due_date SET NOT NULL;

ALTER TABLE reminder ADD COLUMN category VARCHAR(20) DEFAULT 'OUTRO' NOT NULL;
ALTER TABLE reminder ADD COLUMN priority VARCHAR(10) DEFAULT 'MEDIA' NOT NULL;
ALTER TABLE reminder ADD COLUMN responsible VARCHAR(120);
ALTER TABLE reminder ADD COLUMN description VARCHAR(1000);
ALTER TABLE reminder ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE reminder ADD CONSTRAINT ck_reminder_category
    CHECK (category IN ('FINANCEIRO', 'IMOVEL', 'PRESTACAO_MP', 'CONTRATO', 'OPERACIONAL', 'OUTRO'));
ALTER TABLE reminder ADD CONSTRAINT ck_reminder_priority
    CHECK (priority IN ('ALTA', 'MEDIA', 'BAIXA'));

DROP INDEX idx_reminder_done;
CREATE INDEX idx_reminder_done_due_date ON reminder (done, due_date);

UPDATE reminder SET category = 'FINANCEIRO', priority = 'ALTA' WHERE reminder_text LIKE 'Vencimento%';
UPDATE reminder SET category = 'IMOVEL' WHERE reminder_text LIKE 'Vistoria%';
UPDATE reminder SET category = 'FINANCEIRO' WHERE reminder_text LIKE 'Cobrança%';
UPDATE reminder SET category = 'PRESTACAO_MP', priority = 'ALTA' WHERE reminder_text LIKE 'Envio de relatório%';
