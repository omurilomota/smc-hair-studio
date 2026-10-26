# Barber Site Template

Site institucional + agendamento leve para barbearias. React 19, Vite 7, Tailwind CSS 4, TypeScript. Saída single-file (vite-plugin-singlefile), PWA com manifest + service worker, pronto para deploy estático (Vercel/Netlify/GitHub Pages).

> Este projeto é um **site + agendamento**, não um sistema de gestão. Para financeiro, estoque, comissões e fidelidade, integre com uma ferramenta como AppBarber (o widget de agendamento deles pode ser embutido no site).

## Rodando

```bash
npm install
npm run dev
```

Variáveis de ambiente (opcionais, crie um `.env.local` se precisar):

- `VITE_OWNER_PIN` — PIN do painel do barbeiro (padrão `2024`).
- `VITE_SEED_DEMO` — `true` para popular o painel com pedidos de exemplo.

Build de produção:

```bash
npm run build   # tsc --noEmit + vite build -> dist/index.html (arquivo único)
npm run preview
```

## Personalizando para um cliente

Toda a configuração está em `src/data.ts` (e `src/lib/schedule.ts` lê os horários de lá):

- `barber`: nome, papel, foto (`/images/...` ou URL).
- `services`: lista de serviços com preço, duração, categoria e detalhes opcionais.
- `config`: `brand`, `brandFull`, endereço, links de mapas/Waze/Instagram, `ownerPin`.
- `WA_PARTS` / `IG_USER`: telefone e handle montados em partes (evita scrapers).
- `hoursConfig`: horários por dia da semana, intervalo e slots.
- Galeria: array `gallery` (fotos Pexels de exemplo — trocar pelas fotos reais).
- Tema: cores em `src/index.css` (variáveis CSS).

## Deploy

O build gera um único `dist/index.html`. Qualquer host estático serve. Para Vercel/Netlify, basta apontar o diretório de build para `dist`.

## Painel do barbeiro

Rota interna (botão "Área do barbeiro"), protegida por PIN (conveniência, não segurança — o PIN fica no bundle). Os pedidos ficam no `localStorage` do navegador e também são enviados via WhatsApp.

## Licença

Uso livre para projetos próprios e de clientes.
