# SMC Hair Studio

Site institucional com agendamento para uma barbearia em Junqueirópolis, SP. Vitrine de portfólio: o visitante monta o pedido, escolhe dia e horário e recebe um protocolo; o envio ao WhatsApp é simulado.

> **Demonstração.** Nome, endereço, telefone, redes sociais e preços são fictícios. O aviso de demonstração intercepta links de contato e explica isso ao visitante. Nenhuma mensagem é enviada.

[**Ver demonstração**](https://smc-hair-studio.vercel.app) · React 19 · Vite 7 · TypeScript · CSS próprio

## O que tem

- **Agendamento em três passos**: serviço, dia/horário e dados. Validação de telefone, bloqueio de horários ocupados e proteção contra agendamento no passado.
- **Painel do barbeiro** com PIN local, lista de pedidos, confirmação/recusa e resumo do dia. Os dados ficam no `localStorage` — é uma conveniência de demonstração, não um sistema de gestão.
- **Galeria com lightbox**, navegação por teclado, gesto de arrastar no celular e transições que respeitam `prefers-reduced-motion`.
- **PWA**: manifest, ícone e service worker com navegação network-first (um deploy novo aparece imediatamente).
- **Build single-file**: HTML, CSS e JS em um único arquivo, ideal para hospedagem estática.

## Rodando

```bash
npm install
npm run dev
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor local com HMR |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários (Vitest) |
| `npm run build` | Typecheck + build em `dist/` |
| `npm run preview` | Serve o build local |

Variáveis opcionais (`.env.local`):

- `VITE_OWNER_PIN` — PIN do painel (padrão `2024`; fica no bundle, não é segurança real).
- `VITE_SEED_DEMO` — `true` para popular o painel com pedidos de exemplo em produção. Em desenvolvimento o seed já roda.

## Estrutura

```
src/
  App.tsx                 página, navegação e galeria
  components/
    Booking.tsx           fluxo de agendamento em etapas
    OwnerPanel.tsx        painel local do barbeiro
    DemoNotice.tsx        aviso e bloqueio de contatos fictícios
  lib/
    schedule.ts           regras de horário, slots e status da loja
    bookings.ts           persistência local, mensagem e resumo
  data.ts                 serviços, preços, endereço e configuração
  index.css               tema e layout (variáveis CSS)
public/                   ícone, manifest, service worker e fotos
```

Toda a personalização para um cliente real começa em `src/data.ts` e `src/lib/schedule.ts`. Troque as fotos de `public/images/` e as URLs da galeria em `src/data.ts`.

## Qualidade

- Testes cobrem regras de horário (almoço, fechamento, próximo slot), telefone, mensagem e resumo financeiro.
- `strict` no TypeScript, sem `any`; foco visível e rótulos acessíveis nos controles.
- Zero erros de console no build de produção (verificado com Playwright).

## Deploy

O projeto está pronto para a Vercel (`vercel.json` incluso). O workflow em `.github/workflows/ci.yml` roda typecheck, testes e build em cada push para `main` ou `develop`.

```bash
vercel --prod
```

## Licença

MIT — veja [LICENSE](./LICENSE).
