# Analisi funzionale

## Scopo

Il progetto fornisce un'interfaccia leggera per interrogare Context7 e ottenere documentazione aggiornata su librerie e framework software. La stessa capacita viene resa disponibile sia a utenti umani, tramite una UI web locale, sia a tool e agenti, tramite un server MCP su stdio.

## Attori principali

1. **Utente locale** che usa il browser per cercare una libreria e leggere snippet documentali.
2. **Client MCP** che invoca tool, prompt e resource del server.
3. **Operatore del progetto** che sceglie il profilo di esecuzione e configura la sorgente Context7.

## Obiettivi utente

Il sistema deve consentire di:

- individuare il library ID corretto compatibile con Context7
- recuperare documentazione recente e focalizzata su un task concreto
- capire subito da quale sorgente arrivano i dati
- distinguere in modo esplicito esecuzione locale e remota
- riusare la stessa logica sia da UI sia da MCP

## Ambito funzionale

### 1. Selezione configurazione runtime

L'applicazione supporta due concetti distinti:

- **profilo** (`local` o `remote`) per scegliere quale file `.env` caricare
- **modalita** (`hosted` o `custom`) per decidere come interrogare Context7

Questa distinzione rende esplicita la configurazione operativa prima ancora di inviare una richiesta.

### 2. Risoluzione libreria

La funzionalita `resolve-library-id` riceve:

- una query che descrive il task o l'intento
- il nome della libreria desiderata

e restituisce una lista ordinata di possibili match con metadati utili, fra cui:

- ID Context7
- nome libreria
- descrizione
- numero di snippet
- trust score
- benchmark score

### 3. Recupero documentazione

La funzionalita `query-docs` riceve:

- `libraryId`
- query documentale
- limite opzionale di snippet

e produce:

- testo leggibile per l'utente
- JSON strutturato
- un set limitato di snippet per mantenere la risposta ispezionabile

### 4. Prompt guidato

La funzionalita `draft-library-request` aiuta a trasformare una richiesta generica in:

1. nome libreria da risolvere
2. query documentale focalizzata
3. eventuali vincoli di versione da considerare

### 5. UI locale

La UI web deve permettere di:

- visualizzare subito stato del server e sorgente dati
- inviare `resolve-library-id`
- selezionare un match libreria
- compilare automaticamente il `libraryId`
- inviare `query-docs`
- generare il prompt con `draft-library-request`

### 6. Integrazione MCP

Il server MCP deve esporre le stesse capacita funzionali della UI, in modo che agenti e client esterni possano riutilizzare la medesima logica senza duplicazioni.

## Flusso utente atteso

1. l'utente avvia server MCP o UI locale
2. verifica profilo, file env e modalita attiva
3. risolve il library ID
4. interroga la documentazione
5. rifinisce la query finche gli snippet non sono adeguati al task

## Vincoli funzionali

- la modalita deve essere esplicita: `hosted` oppure `custom`
- in hosted mode la API key e obbligatoria
- in custom mode il base URL e obbligatorio
- il caricamento della configurazione deve avvenire prima dell'avvio dei server
- la UI deve funzionare localmente anche se la sorgente documentale e remota
- il recupero documentazione presuppone un `libraryId` valido

## Criteri di successo

La soluzione e funzionalmente corretta quando un utente riesce a:

- capire con chiarezza quale configurazione e attiva
- individuare il library ID corretto senza ambiguita
- ottenere snippet utili e ripetibili per lo stesso task
- usare lo stesso dominio applicativo sia da browser sia da client MCP
