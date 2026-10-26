# Todo — Nota da última sessão exportada

Sessão exportada: `/tmp/session-87abc11f-8612-4f95-8028-472018120677.md`
(última atualização ~21:12, 23/10/2026)

## Tarefa anterior
Corrigir `bugs.md` (remover preview do WhatsApp + corrigir hero) + rebrand Rafael → Samuel (Samuca) + auditoria de responsividade + build.

## O que já foi feito na sessão
- [x] `bugs.md` analisado; 2 problemas identificados (mensagem WhatsApp + hero).
- [x] `Booking.tsx` — removido bloco `.msg-preview` (linhas 453-456); CSS `.msg-preview` mantido (Painel usa `.dark`).
- [x] `index.css` — hero corrigido: `margin-inline: auto` no `.hero-content`; removido `padding-top: 120px` do `@media 1000px`; `h1` margem `-4px` zerada.
- [x] Nome do barbeiro atualizado: Rafael → **Samuca** (`data.ts`, `App.tsx`, links WhatsApp, `schedule.ts` comentário, `bookings.ts`).
- [x] Perfil do estúdio atualizado para **SMC HAIR STUDIO** (endereço Rua Ipiranga 1110, Junqueirópolis/SP, horários, serviços, WhatsApp `+55 (18) 99610-8963` com partes `WA_PARTS`, Instagram `@samuel.rods` com partes `IG_USER`, PIN no `.env`).
- [x] Segurança: telefone não aparece como texto no site, não vai para JSON-LD; links `wa.me` e `instagramUrl` montados via variáveis.
- [x] Auditoria mobile: 320/375/390/430 px — zero overflow após ajustes (`gallery-overlay` padding 14px no mobile + `.hours-card li em` 11px).
- [x] Build passou (`tsc --noEmit` + `vite build`, 264.41 kB gzip 79.53 kB, sem erros).

## Conclusão — tudo concluído
- [x] Hero corrigido e confirmado visualmente (centralizado, "SMC.", texto alinhado, sem vão no topo).
- [x] Links/navegação nativos (`#servicos`, `#agendar`, `#trabalhos`, `#contato`) funcionando.
- [x] Lightbox/galeria a 320px — tag "Acabamento" sem estouro (padding 14px no mobile).
- [x] `bugs.md` arquivado como RESOLVIDO.
- [x] Build final passou (`tsc --noEmit` + `vite build`).

## Decisões tomadas na sessão (não precisam ser revistas)
- Hero = aberto corrigido; painel do barbeiro (`OwnerPanel` `.msg-preview.dark`) **mantido**.
- Foto `team-rafa.jpg` mantida como caminho em `data.ts` (presumidamente do Samuca).
- Nome completo do barbeiro = apenas **Samuca** (sem sobrenome informado).