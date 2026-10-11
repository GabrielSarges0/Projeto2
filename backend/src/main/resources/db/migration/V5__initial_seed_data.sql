-- Imoveis do Patrimonio da Fundacao Manuel Cruz
INSERT INTO property (registration_code, address, current_tenant, monthly_rent, status)
VALUES
('IM-001', 'Av. Conde da Boa Vista, 412 - Sala 301, Recife/PE', 'João Pedro Cavalcanti', 3200.00, 'Ocupado'),
('IM-002', 'Rua do Hospício, 180 - Sala Comercial, Recife/PE', 'Maria Helena Silva', 2850.00, 'Ocupado'),
('IM-003', 'Rua Nova, 95 - Prédio Histórico FMC, Recife/PE', 'Fundação Cultural Manuel Cruz', 0.00, 'Em Reforma'),
('IM-004', 'Rua da Aurora, 520 - Apartamento 502, Recife/PE', NULL, 2400.00, 'Disponível'),
('IM-005', 'Av. Agamenon Magalhães, 1200 - Conjunto 405, Recife/PE', 'Tech Soluções Ltda', 4500.00, 'Ocupado');

-- Contratos de Locacao
INSERT INTO lease_contract (property_registration, tenant_name, start_date, end_date, monthly_amount, status)
VALUES
('IM-001', 'João Pedro Cavalcanti', CURRENT_DATE - INTERVAL '11' MONTH, CURRENT_DATE + INTERVAL '25' DAY, 3200.00, 'PROXIMO_AO_VENCIMENTO'),
('IM-002', 'Maria Helena Silva', CURRENT_DATE - INTERVAL '6' MONTH, CURRENT_DATE + INTERVAL '6' MONTH, 2850.00, 'ATIVO'),
('IM-005', 'Tech Soluções Ltda', CURRENT_DATE - INTERVAL '10' MONTH, CURRENT_DATE + INTERVAL '15' DAY, 4500.00, 'PROXIMO_AO_VENCIMENTO');

-- Lembretes Operacionais e Financeiros
INSERT INTO reminder (reminder_text, done)
VALUES
('Vencimento aluguel IM-001 (dia 10)', TRUE),
('Vistoria predial periódica no imóvel histórico IM-003', FALSE),
('Cobrança e prestação de contas de condomínio IM-005', FALSE),
('Envio de relatório trimestral ao Ministério Público', FALSE);

-- Transacoes Financeiras Iniciais (Entradas e Saidas)
INSERT INTO financial_transaction (transaction_type, document_type, tenant_name, document_number, property_registration, transaction_date, gross_amount)
VALUES
('INCOME', 'CPF', 'João Pedro Cavalcanti', '12345678909', 'IM-001', CURRENT_DATE - INTERVAL '3' DAY, 3200.00),
('INCOME', 'CPF', 'Maria Helena Silva', '98765432100', 'IM-002', CURRENT_DATE - INTERVAL '5' DAY, 2850.00),
('EXPENSE', NULL, 'Manutenção Hidráulica - Prestador Rocha', 'N/A', 'IM-001', CURRENT_DATE - INTERVAL '2' DAY, 450.00),
('EXPENSE', NULL, 'Reforma Elétrica - EletroServiços Ltda', 'N/A', 'IM-003', CURRENT_DATE - INTERVAL '7' DAY, 1200.00);

