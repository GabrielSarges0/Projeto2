-- Clientes, estoque, presença, documentos e envios ao MP só existiam no navegador de cada pessoa.
-- Esta tabela os torna compartilhados: cada linha é um registro JSON de uma coleção conhecida
-- (lista fechada no backend, que também valida tamanho e formato). Arquivos grandes são
-- gravados em partes de até 1 milhão de caracteres na coleção "document-files".
-- Lock: tabela nova, sem impacto em dados existentes.
CREATE TABLE app_record (
    collection VARCHAR(40) NOT NULL,
    record_id VARCHAR(80) NOT NULL,
    payload VARCHAR(1000000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(160) NOT NULL,
    CONSTRAINT pk_app_record PRIMARY KEY (collection, record_id)
);
