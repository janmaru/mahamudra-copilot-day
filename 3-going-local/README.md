# Context7 MCP server + UI locale

Progetto Node.js/TypeScript che espone le funzionalità di Context7 in due forme:

1. **server MCP su stdio** per client compatibili con il Model Context Protocol
2. **interfaccia web locale** per eseguire gli stessi comandi dal browser

Il codice condiviso vive in un unico livello applicativo, così UI e server MCP usano la stessa logica di configurazione, risoluzione librerie e recupero documentazione.

## Cosa fa

Il progetto permette di:

- risolvere il Context7-compatible library ID più adatto a una libreria o framework
- recuperare snippet di documentazione aggiornati e focalizzati su un task
- generare un prompt guidato per preparare una richiesta a Context7
- ispezionare profilo, file `.env`, modalità attiva e sorgente dei dati

## Architettura

L'applicazione è composta da tre parti principali:

| Componente | File principali | Responsabilità |
| --- | --- | --- |
| Bootstrap configurazione | `src/env.ts` | Seleziona il profilo (`local` o `remote`) oppure un file env esplicito e carica le variabili runtime |
| Logica condivisa Context7 | `src/context7.ts` | Valida la configurazione, usa SDK hosted o backend custom, normalizza e formatta le risposte |
| Adattatori di accesso | `src/mcp-server.ts`, `src/ui-server.ts` | Espongono la stessa logica via MCP stdio o API HTTP/UI locale |

La UI statica è servita da `public/` tramite il server HTTP locale.

## Costo dei token e prompt caching

> Questa sezione richiama la **"Pricing Bubble"** del [README root](../README.md#2-context-as-logic--the-pricing-bubble). Vale la pena rileggerla nel contesto di questo progetto, perché un server Context7 locale è proprio una leva per controllare cosa entra (o non entra) nel prefix cached.

Ogni token in un prompt è un **vincolo statistico**: più contesto significa meno gradi di libertà e quindi output più deterministico. Aggiungere documentazione non è "padding", è restringere la distribuzione di probabilità da cui il modello campiona.

La domanda economica è: non diventa proibitivo? **No** — grazie al **prompt caching**. I prefissi stabili (system prompt, istruzioni di repository, docs longeve, tool definitions) vengono fatturati a una frazione del prezzo normale dell'input.

### Anatomia del prompt

| Segmento | Contenuto tipico | Costo effettivo |
| --- | --- | ---: |
| **Prefix cached** | system prompt · istruzioni di repository · docs stabili · tool definitions | ~10% del prezzo input (Anthropic, TTL 5 min) |
| **Coda fresh** | turno utente · output di tool freschi · snippet Context7 mirati | 100% |

Un prompt da 100k token con 95k cached costa effettivamente:

```text
95k × 0.10 + 5k × 1.00 = 14.5k token effettivi
```

### Perché Context7 locale conta

Context7 risolve un problema specifico: l'agente ha bisogno di **snippet di documentazione aggiornati e focalizzati**, non dell'intero sito di docs di una libreria. Tenere queste due cose in equilibrio è la chiave del costo:

- **Cosa va nel prefix stabile** (cache friendly): istruzioni del progetto, README, analisi tecnica/funzionale, tool definitions. Cambiano raramente, restano in cache, costano poco a ogni turno.
- **Cosa va nella coda volatile** (fresh, full price): la query utente, i risultati di `query-docs` per il task corrente. Sono mirati e piccoli proprio perché Context7 li seleziona — non si scaricano interi manuali.
- **Cosa NON va in nessuno dei due**: documentazione massiva indifferenziata. Sarebbe troppo grande per la coda e troppo volatile per il prefix.

### Regole pratiche

- **Investi nel prefix.** Un `copilot-instructions.md` lungo, stabile e ben strutturato è *più economico di quanto sembri* perché ogni turno successivo lo legge a prezzo cache.
- **Il contenuto volatile va in coda.** Tutto ciò che cambia per richiesta (query, output di tool freschi) vive nella tail "fresh".
- **I cache miss sono il vero nemico.** Riordinare il prompt, cambiare modello, o lasciar scadere il TTL azzera il prefix e forza una riscrittura a prezzo pieno.
- **Usa `query-docs` con `maxSnippets` stretto.** Non ingrandire la coda fresh più del necessario: ogni snippet in più paga 100%.

> La bolla: il prompt sembra costoso, ma **la maggior parte non costa quello che pesa**.

## Requisiti

- Node.js 20+
- npm
- uno dei due setup seguenti:
  - **hosted mode** con `CONTEXT7_API_KEY`
  - **custom mode** con `CONTEXT7_BASE_URL`

## Configurazione

Il progetto separa **profilo** e **modalità**:

- **profilo**: quale file `.env` caricare all'avvio
- **modalità**: come interrogare Context7

### Profili supportati

- `.env.local` -> profilo `local`
- `.env.remote` -> profilo `remote`

Per default gli script avviano il progetto con `--profile=local`. Le varianti `:remote` usano `--profile=remote`.

### Modalità supportate

#### Hosted mode

Usa l'SDK ufficiale `@upstash/context7-sdk`.

```env
CONTEXT7_MODE=hosted
CONTEXT7_API_KEY=ctx7sk_...
CONTEXT7_BASE_URL=
```

#### Custom mode

Usa un backend MCP compatibile raggiungibile via HTTP streamable. Se il base URL non termina con `/mcp`, il progetto lo aggiunge automaticamente.

```env
CONTEXT7_MODE=custom
CONTEXT7_API_KEY=
CONTEXT7_BASE_URL=http://localhost:3000
```

In custom mode `CONTEXT7_API_KEY` è opzionale: se presente viene inviato come header `Authorization: Bearer ...`.

### Override espliciti

Oltre ai profili puoi avviare il progetto con:

- `--profile=local|remote`
- `--env-file=PATH`
- variabile `CONTEXT7_ENV_FILE`

## Installazione

```powershell
npm install
npm run build
```

## Script disponibili

| Script | Descrizione |
| --- | --- |
| `npm run build` | Compila TypeScript in `dist/` |
| `npm run typecheck` | Esegue il type-check senza generare output |
| `npm run test` | Alias di `npm run typecheck` |
| `npm run dev` | Avvia il server MCP da sorgente con profilo `local` |
| `npm run dev:remote` | Avvia il server MCP da sorgente con profilo `remote` |
| `npm run dev:ui` | Avvia la UI locale da sorgente con profilo `local` |
| `npm run dev:ui:remote` | Avvia la UI locale da sorgente con profilo `remote` |
| `npm start` | Avvia il server MCP compilato con profilo `local` |
| `npm run start:remote` | Avvia il server MCP compilato con profilo `remote` |
| `npm run start:ui` | Avvia la UI compilata con profilo `local` |
| `npm run start:ui:remote` | Avvia la UI compilata con profilo `remote` |

## Analisi documentale con agent

Per analizzare il progetto o aggiornare documentazione con il profilo `docs-analyst`:

```powershell
Set-Location C:\Coding\copilot_day\.github\agents
.\Sync-AgentProfiles.ps1 -InstallGlobal
Set-Location C:\Coding\copilot_day\3
.\docs-analyst.ps1 "analizza il progetto"
```

Il profilo `docs-analyst` è definito nel manifest condiviso del repository e viene installato nella CLI globale tramite lo script di sync.

## Avvio del server MCP

```powershell
npm run build
npm start
```

Per usare il profilo remoto:

```powershell
npm run build
npm run start:remote
```

### Esempio configurazione client MCP

```json
{
  "mcpServers": {
    "context7-example": {
      "command": "node",
      "args": ["C:\\Coding\\copilot_day\\dist\\index.js", "--profile=remote"]
    }
  }
}
```

## Avvio della UI locale

```powershell
npm run build
npm run start:ui
```

Poi apri:

```text
http://localhost:8080
```

Per cambiare porta:

```powershell
$env:PORT="9090"
npm run start:ui
```

Per usare il profilo remoto:

```powershell
npm run build
npm run start:ui:remote
```

## API HTTP della UI

Il server HTTP locale espone questi endpoint JSON:

| Metodo | Endpoint | Descrizione |
| --- | --- | --- |
| `GET` | `/api/server-info` | Restituisce metadati del server, profilo attivo, file env e stato configurazione |
| `POST` | `/api/resolve-library-id` | Risolve i match Context7 per `query` e `libraryName` |
| `POST` | `/api/query-docs` | Recupera snippet documentazione per `libraryId`, `query` e `maxSnippets` |
| `POST` | `/api/draft-library-request` | Genera un prompt guidato a partire da un task |

### Esempio `resolve-library-id`

```json
{
  "query": "Need the latest auth docs for middleware setup",
  "libraryName": "next.js"
}
```

### Esempio `query-docs`

```json
{
  "libraryId": "/vercel/next.js",
  "query": "middleware auth cookies redirect unauthenticated users",
  "maxSnippets": 5
}
```

## Capacità MCP esposte

Il server MCP registra:

### Tool

- `resolve-library-id`
- `query-docs`

### Prompt

- `draft-library-request`

### Resource

- `context7://server/info`

## Struttura del progetto

```text
src/
  context7.ts     # logica condivisa e integrazione Context7
  env.ts          # selezione profilo e caricamento env
  index.ts        # entrypoint del server MCP
  mcp-server.ts   # adapter MCP stdio
  ui-server.ts    # server HTTP locale + API JSON
public/
  index.html      # UI statica
  app.js          # logica client-side
  styles.css      # stile della UI
docs/
  functional-analysis.md
  technical-analysis.md
```

## Flusso tipico di utilizzo

1. avvia la UI locale oppure il server MCP
2. verifica profilo, modalità e sorgente dati
3. usa `resolve-library-id` per trovare l'identificatore corretto
4. usa `query-docs` per ottenere snippet mirati
5. se il task è ancora generico, genera prima `draft-library-request`

## Documentazione aggiuntiva

- [Analisi funzionale](docs/functional-analysis.md)
- [Analisi tecnica](docs/technical-analysis.md)
