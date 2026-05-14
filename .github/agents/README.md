# Agent profiles

Il manifest `agents.manifest.json` e' la source of truth per i profili agente condivisi tra repository e CLI globale.

## Allineamento VS Code e CLI globale

Visual Studio Code usa i profili repo-locali sotto `.github\agents`.

La CLI globale puo' usare gli stessi identici profili copiandoli in `$HOME\.copilot\agents` tramite `.\Sync-AgentProfiles.ps1 -InstallGlobal`.

Il flusso raccomandato e' quindi:

1. aggiorna `agents.manifest.json`
2. rigenera i file `*.agent.md` repo-locali
3. installa in globale solo quando vuoi riallineare anche la CLI

Tra i profili condivisi c'e' anche `docs-analyst`, pensato per analisi e aggiornamenti documentali del progetto senza toccare il codice applicativo.

## File

- `agents.manifest.json`: definizione centrale di metadati, handoff e prompt
- `*.agent.md`: profili renderizzati per l'uso repo-locale in Visual Studio Code
- `Sync-AgentProfiles.ps1`: render, check e installazione opzionale in `$HOME\.copilot\agents`

## Profili disponibili

| Agente | Uso |
| --- | --- |
| `Feature Builder` | Coordinamento del flusso planner -> implementer -> reviewer |
| `Planner` | Analisi tecnica e piano di implementazione |
| `Implementer` | Modifiche al codice secondo il piano |
| `Reviewer` | Review finale focalizzata su problemi reali |
| `docs-analyst` | Analisi repository e modifica solo di `README.md` e file sotto `docs/` |

## Comandi

Dal folder `.github\agents`:

```powershell
.\Sync-AgentProfiles.ps1
```

Rigenera i file `*.agent.md` del repository a partire dal manifest.

```powershell
.\Sync-AgentProfiles.ps1 -Check
```

Verifica che i file nel repository siano coerenti con il manifest.

```powershell
.\Sync-AgentProfiles.ps1 -InstallGlobal
```

Rigenera i file repo-locali e installa gli stessi profili anche nella CLI globale.

```powershell
.\Sync-AgentProfiles.ps1 -Check -InstallGlobal
```

Verifica sia i file repo-locali sia quelli installati in `$HOME\.copilot\agents`.

## Convenzione operativa

1. modifica il manifest
2. esegui lo script di sync
3. committa manifest e file renderizzati insieme

In questo modo VS Code continua a leggere `.github\agents`, mentre la CLI globale puo' ricevere lo stesso set di profili senza mantenere istruzioni duplicate a mano.
