# adblocktest

Teste completo para verificar se seu bloqueador de anúncios está funcionando corretamente.

## Tecnologias

- Next.js 14
- TypeScript
- Vercel

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Deploy no Vercel

1. Faça push do código para um repositório Git
2. Acesse [vercel.com](https://vercel.com)
3. Importe o projeto
4. O Vercel detectará automaticamente o Next.js

Ou use a CLI:

```bash
npm i -g vercel
vercel
```

## Como Funciona

O adblocktest verifica se domínios conhecidos de anúncios, analytics e trackers estão sendo bloqueados. Testa:

- Anúncios: Google Ads, Amazon, DoubleClick, etc.
- Analytics: Google Analytics, Hotjar, MouseFlow, etc.
- Rastreadores de Erro: Bugsnag, Sentry
- Rastreadores Sociais: Facebook, Twitter, LinkedIn, etc.
- OEMs: Apple, Samsung, Xiaomi, etc.

## Autor

Daniel

## Licença

MIT
