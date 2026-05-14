# Analisi tecnica

## Panoramica

Il progetto e un'applicazione Node.js in TypeScript costruita attorno a una logica condivisa per Context7. L'architettura separa chiaramente:

1. bootstrap della configurazione
2. dominio applicativo Context7
3. adapter MCP
4. adapter HTTP/UI

Questa struttura riduce la duplicazione e mantiene coerente il comportamento fra interfaccia web e integrazione MCP.

## Componenti principali

### `src/env.ts`

Responsabilita:

- legge `--profile=...`, `--env-file=...` e le variabili d'ambiente correlate
- seleziona `.env.local` o `.env.remote` quando non viene indicato un file esplicito
- carica la configurazione con `dotenv`
- salva in ambiente il profilo e il file effettivamente risolti

Il caricamento avviene all'import degli entrypoint, quindi la configurazione e gia disponibile prima che partano i server.

### `src/context7.ts`

E il cuore applicativo del progetto. Contiene:

- validazione della configurazione runtime
- distinzione fra hosted mode e custom mode
- creazione lazy del client `@upstash/context7-sdk`
- chiamate al backend custom via `StreamableHTTPClientTransport`
- normalizzazione di URL e risposte
- formattazione del testo restituito a UI e MCP
- metadati del server (`getServerInfo`)

#### Hosted mode

In hosted mode il modulo usa `Context7.searchLibrary()` e `Context7.getContext()` dell'SDK ufficiale.

#### Custom mode

In custom mode il modulo crea un client MCP e chiama i tool remoti:

- `resolve-library-id`
- `get-library-docs`

Il `CONTEXT7_BASE_URL` viene normalizzato in modo che termini con `/mcp` se necessario. Se `CONTEXT7_API_KEY` e presente, viene passato come bearer token nelle richieste HTTP.

### `src/mcp-server.ts`

Espone la logica condivisa come server MCP su stdio tramite `@modelcontextprotocol/sdk`.

Registra:

- una **resource**: `context7://server/info`
- un **prompt**: `draft-library-request`
- due **tool**: `resolve-library-id` e `query-docs`

Gli input sono validati con Zod e gli errori applicativi vengono convertiti in risposte MCP con `isError: true`.

### `src/ui-server.ts`

Implementa un server HTTP minimale con il modulo built-in `node:http`.

Responsabilita:

- servire i file statici da `public/`
- esporre endpoint JSON sotto `/api/*`
- validare i payload con Zod
- restituire errori leggibili al frontend

Endpoint esposti:

- `GET /api/server-info`
- `POST /api/resolve-library-id`
- `POST /api/query-docs`
- `POST /api/draft-library-request`

### Frontend statico in `public/`

Il frontend e composto da:

- `index.html`
- `app.js`
- `styles.css`

La UI non parla direttamente con Context7: tutte le richieste passano dal server locale. Questo evita di esporre credenziali nel browser e mantiene il comportamento coerente con il server MCP.

## Flussi di richiesta

### Percorso UI

1. il browser chiama un endpoint locale `/api/*`
2. `ui-server.ts` valida il payload
3. `context7.ts` applica la logica condivisa
4. il risultato viene restituito come JSON alla UI
5. `public/app.js` renderizza testo, JSON o stato del server

### Percorso MCP

1. un client MCP invoca un tool, prompt o resource
2. `mcp-server.ts` inoltra la richiesta al dominio applicativo
3. `context7.ts` usa SDK hosted o backend custom
4. la risposta viene resa disponibile come contenuto testuale e, dove previsto, contenuto strutturato

## Modello di configurazione

Il progetto distingue:

- **profilo**: `local` o `remote`
- **modalita**: `hosted` o `custom`

Questa scelta evita di confondere la provenienza del file env con la natura della sorgente Context7.

### Priorita di risoluzione

1. `CONTEXT7_ENV_FILE` o `--env-file=...`
2. `CONTEXT7_PROFILE` o `--profile=...`
3. fallback a `local`

Il file risolto viene verificato con `existsSync` prima del caricamento.

## Validazione ed error handling

La validazione si basa su Zod per:

- schema input MCP
- body delle API HTTP
- limiti su `maxSnippets`

Gli errori di configurazione vengono bloccati subito. Gli errori di input UI producono `400`, mentre gli errori generici producono `500`. Nel layer MCP gli errori vengono restituiti come contenuto testuale marcato con `isError: true`.

## Trasformazioni dei dati

Il progetto uniforma due forme di output:

1. risultati strutturati dell'SDK hosted
2. testo restituito da un backend MCP custom

Per il backend custom esistono parser dedicati che ricostruiscono:

- elenco librerie (`parseLibrariesFromMcpText`)
- snippet documentali (`parseDocsFromMcpText`)

Questo consente di offrire alla UI e al server MCP una struttura comune, indipendente dalla sorgente effettiva.

## Sicurezza e osservabilita

- le credenziali restano lato server
- la UI chiama solo il server locale
- `/api/server-info` e `context7://server/info` espongono stato, profilo, file env e configurazione attiva
- il frontend mostra chiaramente se la sorgente documentale e hosted, custom locale o custom remota

## Limiti attuali

- nessuna persistenza delle richieste
- nessuna autenticazione sulla UI locale
- parsing del backend custom basato su formato testuale atteso
- nessun framework frontend o backend avanzato

## Estensioni naturali

Se il progetto cresce, gli sviluppi piu naturali sono:

1. test automatici per `context7.ts`
2. test di integrazione per hosted e custom mode
3. storico locale delle query
4. miglioramenti UX nella UI
5. contratto piu rigoroso per il formato restituito dal backend custom
