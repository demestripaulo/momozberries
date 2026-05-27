# SALES.md — Referência de Vendas: Momo'z Berriez

> Documento interno para o desenvolvedor usar na abordagem comercial com a cliente.
> Projeto: E-commerce completo para marca artesanal de sobremesas — South Gate, CA.

---

## 1. ROTEIRO DE SALES CALL

### Abertura

> "Oi, tudo bem? Eu sou [nome]. Eu vi o perfil da Momo'z Berriez no Instagram e fiquei impressionado com a qualidade das fotos e dos produtos — dá pra ver que você tem uma marca com identidade forte. Eu entro em contato porque desenvolvi uma solução de e-commerce personalizada pra sua marca e queria te mostrar."

- Reconheça a marca pelo nome — não trate como mais um lead genérico.
- Mencione o Instagram com naturalidade: mostra que você pesquisou e que a presença dela é real e relevante.
- Deixe claro que o potencial de crescimento está ali — só precisa de estrutura.

---

### Identificação do Problema

> "A maioria das marcas de sobremesas artesanais que têm um Instagram forte acaba perdendo venda por um motivo bem simples: dependem de DM pra receber pedido."

Aponte os problemas concretos:

- **DMs são lentos:** o cliente manda mensagem, espera resposta, confirma, paga — são horas ou dias de processo manual.
- **Sem rastreamento:** não tem histórico de pedido, não tem confirmação automática, não tem controle.
- **Imagem não profissional:** para o cliente, mandar DM pra pedir bolo parece improviso — mesmo que o produto seja incrível.
- **Não escala:** você não consegue atender 30 pedidos por semana no DM sem enlouquecer.

> "Isso trava o crescimento. A marca tem tudo pra crescer — o que falta é uma loja online de verdade."

---

### Apresentação da Solução

> "O que eu trouxe pra você é um site de e-commerce completo, construído especificamente pra Momo'z Berriez — com os seus produtos, suas fotos, sua identidade visual."

O que o site inclui:

- **Página inicial** com apresentação da marca e chamada pra ação
- **Menu completo** com fotos, descrições e preços dos produtos
- **Carrinho de compras** e checkout seguro via Stripe
- **Agendamento de retirada** integrado ao Google Calendar
- **Painel administrativo** para você gerenciar produtos, pedidos e horários
- **Calculadora de custo e margem** pra saber quanto você ganha em cada produto
- **Limite diário de pedidos** configurável — você controla a demanda

---

### Momento do Demo

> "E o melhor: eu não estou te vendendo uma ideia — o site já existe. Dá uma olhada agora mesmo:"

**Link do demo:**
👉 https://momozberries.demestritech-com.workers.dev

- O demo está rodando com os produtos reais da Momo'z Berriez.
- Fotos reais, descrições reais, preços reais.
- Checkout funcional (ambiente de teste).
- Painel admin completo — posso mostrar ao vivo numa call de 30 minutos.

> "Você pode ver hoje como seria a sua loja online. Não é protótipo, não é mockup — é o site funcionando."

---

### Proposta de Valor

> "A pergunta não é se você vai ter uma loja online — é quando. E eu posso te colocar no ar **essa semana**."

- Sem tempo de espera: o site já está pronto.
- Sem complexidade técnica: você cuida dos pedidos, eu cuido da tecnologia.
- Pagamento online desde o primeiro dia: o Stripe é configurado em questão de horas.
- Você começa a receber pedidos com rastreamento, confirmação automática e histórico — como uma loja de verdade.

---

### Manejo de Objeções

#### Objeção 1: "Não tenho dinheiro agora"

> "Entendo. Por isso eu tenho opções de plano mensal — você começa com o básico por **$99/mês** e vai escalando conforme o negócio cresce. Sem investimento alto de entrada. E o retorno começa a aparecer assim que o primeiro pedido online chega."

- Reforce que o custo mensal é menor do que uma hora de trabalho artesanal.
- Compare com o que ela já paga em outras ferramentas (app de delivery, etc.).

---

#### Objeção 2: "Já recebo pedido pelo Instagram DM"

> "DM funciona quando o volume é pequeno. Mas pensa: você consegue rastrear quantos pedidos veio esse mês? Saber quais produtos vendem mais? Confirmar pagamento automaticamente? Com o site, tudo isso acontece sozinho — e o cliente tem uma experiência profissional que faz ele voltar."

- DM não tem histórico estruturado.
- DM não tem confirmação automática de pagamento.
- DM depende de você estar online pra responder — o site funciona 24/7.

---

#### Objeção 3: "Vou pensar mais um pouco"

> "Claro, sem pressão. Só te adianto que minha agenda tá bem cheia esse mês, e o que faz esse projeto ser diferente é que ele já está pronto — não tem fila de espera de desenvolvimento. Se você fechar agora, você vai estar no ar essa semana. Se você deixar pra depois, pode ser que eu não consiga priorizar tão rápido."

- Reforce: o demo já existe — não tem tempo de setup.
- Urgência real: disponibilidade limitada do desenvolvedor.
- Ofereça uma call rápida de 30 minutos pra mostrar o painel ao vivo antes da decisão.

---

## 2. O QUE O CLIENTE PRECISA FORNECER

### Pagamentos

- **Conta no Stripe** (stripe.com) — gratuita, cobra ~2.9% + $0.30 por transação
- Alternativa: PayPal Business (mas Stripe é recomendado para e-commerce)
- O desenvolvedor configura tudo técnico — a cliente só precisa criar a conta e fornecer as chaves de API

### Domínio

- Domínio personalizado (ex: `momozberriez.com`) — ~$12/ano no Namecheap ou GoDaddy
- Alternativa: Cloudflare Registrar também registra domínios com preço justo
- **Sem domínio próprio:** o site funciona normalmente em subdomínio gratuito do Cloudflare (ex: `momozberries.workers.dev`)

### Google Calendar (agendamento de retirada)

- Conta Google (Gmail) dedicada para a loja
- Autorizar o sistema a criar e gerenciar eventos no calendário dessa conta

### Conteúdo (maioria já fornecida)

| Item | Status |
|------|--------|
| Fotos dos produtos | Já fornecidas (7 fotos) |
| Descrições dos produtos | Já incluídas |
| Endereço de retirada | Já configurado (South Gate, CA 90280) |
| Handle do Instagram | Já configurado (@momozberriez) |
| Logo da marca | **Pendente** — para substituir o texto atual |
| Senha do painel admin | **Pendente** — a cliente escolhe |

### Custos de infraestrutura (estimativa mensal)

| Serviço | Custo |
|---------|-------|
| Cloudflare Workers | Gratuito até 100k req/dia; $5/mês se precisar mais |
| Cloudflare D1 (banco de dados) | Gratuito até 5GB |
| Stripe | Sem mensalidade — apenas % por transação |
| Domínio | ~$1/mês (pago anualmente) |
| **Total infraestrutura** | **$0–$6/mês** |

---

## 3. ANÁLISE DE TEMPO E VALOR DE MERCADO

### Estimativa de horas de desenvolvimento

| Fase | Horas |
|------|-------|
| Design do banco de dados e schema | 5h |
| Backend API (Workers, rotas, autenticação) | 35h |
| Integração Stripe (checkout + webhook) | 12h |
| Frontend — 5 páginas completas | 45h |
| Painel admin (dashboard, produtos, pedidos) | 25h |
| CI/CD (GitHub Actions, deploy automatizado) | 6h |
| Testes e ajustes finais | 12h |
| **Total** | **~140 horas** |

### Valor de mercado (freelancer)

| Perfil | Valor/hora | Total estimado |
|--------|-----------|----------------|
| Freelancer júnior/médio (Brasil) | R$80–120/h | R$11.200–16.800 |
| Freelancer sênior (Brasil) | R$150–250/h | R$21.000–35.000 |
| Freelancer internacional (USD) | $50–120/h | $7.000–16.800 |
| Agência digital (Brasil) | R$200–400/h | R$28.000–56.000 |

> **Observação importante:** O site já está 95% pronto. O tempo restante é apenas de configuração final e personalização (~5–10 horas). O cliente não está pagando pelo desenvolvimento — está pagando pelo resultado entregue.

---

## 4. TRÊS OPÇÕES DE OFERTA

### PLANO 1 — Vitrine Digital (Só o Site)

**O que inclui:**
- Site completo: página inicial, menu de produtos, página "Sobre"
- Sem checkout online — pedidos chegam via WhatsApp ou Instagram com link direto pro menu
- Hospedagem e manutenção incluídas no plano

**Preço:**
- $149/mês
- **$99/mês** no plano anual (economia de $600/ano)

**Ideal para:** quem quer presença profissional online mas ainda não está pronta para aceitar pagamentos digitais.

---

### PLANO 2 — Loja Completa (Site + Checkout)

**O que inclui:**
- Tudo do Plano 1, mais:
- Carrinho de compras completo
- Checkout seguro via Stripe (pagamento online)
- Página de confirmação de pedido com resumo
- Limite diário de pedidos configurável (padrão: 50/dia)

**Preço:**
- $249/mês
- **$179/mês** no plano anual (economia de $840/ano)

**Ideal para:** quem quer começar a receber pagamentos online agora, com estrutura sólida.

---

### PLANO 3 — Solução Premium (Site + Checkout + Back Office Completo)

**O que inclui:**
- Tudo do Plano 2, mais:
- Painel administrativo completo (dashboard, gerenciamento de produtos e pedidos)
- Calculadora de custo de ingredientes e margem de lucro por produto
- Agendamento de retirada integrado ao Google Calendar
- Sistema de limite diário e horários de retirada configuráveis
- Suporte prioritário por WhatsApp

**Preço:**
- $399/mês
- **$299/mês** no plano anual (economia de $1.200/ano)

**Ideal para:** quem quer operação profissional completa, visibilidade total do negócio e crescimento escalável.

---

### OPÇÃO PAGAMENTO ÚNICO — Entrega Completa (One-Time)

**O que inclui:**
- Entrega completa de tudo que está no Plano 3, pronto para uso imediato
- Configuração completa: Stripe conectado, banco de dados populado, domínio apontado
- Treinamento de 1 hora no painel administrativo (call ao vivo)
- O cliente fica com tudo em mãos, sem mensalidade

**Não inclui:**
- Manutenção contínua (disponível à parte: $80/hora ou plano mensal)

**Preço: $2.800 — pagamento único**

> Esta é a melhor opção para quem quer investir uma vez e ter independência total do sistema.

---

## 5. PRÓXIMOS PASSOS PARA FECHAR

1. **Enviar o link do demo** para a cliente explorar no próprio ritmo:
   👉 https://momozberries.demestritech-com.workers.dev

2. **Marcar uma call de 30 minutos** para mostrar o painel administrativo ao vivo (ela vê como gerenciar produtos e pedidos na prática)

3. **Definir o plano** que faz mais sentido para o momento atual do negócio

4. **A cliente cria conta no Stripe** (stripe.com — gratuito) e compra o domínio se quiser (opcional)

5. **Go live em menos de 1 semana** — sem tempo de espera de desenvolvimento, sem surpresa

---

> Documento criado para uso interno do desenvolvedor. Não compartilhar com o cliente diretamente.
