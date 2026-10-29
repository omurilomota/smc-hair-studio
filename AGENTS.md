# AGENTS.md — SMC Hair Studio

## Contexto

Site de demonstração para uma barbearia. Agendamento, painel do barbeiro e armazenamento são locais (`localStorage`); não há backend, banco de dados, autenticação real nem envio de mensagens. É uma peça de portfólio: nome, endereço, telefone, redes sociais e preços são fictícios.

## Stack

- React 19 + TypeScript estrito
- Vite 7 + `vite-plugin-singlefile` (build em HTML único)
- CSS próprio com variáveis e Tailwind CSS 4 disponível no build
- Vitest para testes unitários
- PWA com manifest e service worker (network-first para navegação)
- Sem roteador: navegação por âncoras em uma única página

## Comandos

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

Rode `npm run typecheck`, `npm test` e `npm run build` antes de concluir qualquer alteração.

## Arquitetura

| Caminho | Responsabilidade |
| --- | --- |
| `src/App.tsx` | Página, menu, galeria/lightbox e chamadas para o agendamento |
| `src/components/Booking.tsx` | Fluxo de agendamento em três etapas e validações |
| `src/components/OwnerPanel.tsx` | Painel local com PIN, filtros e status dos pedidos |
| `src/components/DemoNotice.tsx` | Aviso e bloqueio de links de contato fictícios |
| `src/lib/schedule.ts` | Horários, slots, status da loja, protocolo e telefone |
| `src/lib/bookings.ts` | Store local, mensagem de WhatsApp, resumo e seed de demonstração |
| `src/data.ts` | Serviços, preços, barbeiro, endereço, galeria e configuração |
| `src/index.css` | Tokens, layout e breakpoints |

## Regras de dados

1. Nunca insira telefone, WhatsApp, e-mail, endereço ou documento reais de cliente neste repositório público.
2. Toda alteração de contato passa por `src/data.ts`.
3. Não remova o `DemoNotice`: ele impede que links fictícios abram WhatsApp, telefone, e-mail ou Instagram.
4. O PIN do painel é público por definição (vai no bundle). Nunca trate como segurança.
5. Serviços e preços devem existir em `services`; o seed do painel precisa refletir esses valores.

## Convenções de código

- TypeScript estrito; sem `any` gratuito.
- Componentes em PascalCase, funções utilitárias em camelCase.
- Não adicione dependência sem justificar: o build é intencionalmente enxuto.
- Preserve a identidade visual: preto esverdeado `#1c201a`, papel `#ebe8dc`, lima `#cfe356`, tipografia Barlow Condensed + DM Sans.
- Não use `!important` fora de casos de acessibilidade.
- Imagens devem ter `alt` descritivo e `loading="lazy"` quando abaixo da dobra.
- Datas sempre em horário local; use `toISO`/`fromISO` de `src/lib/schedule.ts` para evitar deslocamento de fuso.

## Acessibilidade

- Um único `h1` por página.
- Menu mobile com `aria-expanded`; botões com rótulo discernível.
- Diálogo de demonstração com `role="dialog"`, `aria-modal` e fechamento por Escape.
- Lightbox navegável por teclado e com foco visível.
- Contraste mínimo AA nos textos sobre imagem.

## Git

Gitflow + Gitmoji:

- `main`: produção, tag `vX.Y.Z`.
- `develop`: integração.
- `feature/*`: funcionalidades.
- `hotfix/*`: correções urgentes.

Formato de commit: `<emoji> <tipo>: <descrição no imperativo>`.

## Deploy

Vercel, framework Vite, build `npm run build`, output `dist`. Sem variáveis obrigatórias.
