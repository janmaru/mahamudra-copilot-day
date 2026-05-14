const serverInfo = document.getElementById("serverInfo");
const connectionBadge = document.getElementById("connectionBadge");
const connectionMeta = document.getElementById("connectionMeta");
const resolveQuery = document.getElementById("resolveQuery");
const libraryName = document.getElementById("libraryName");
const resolveSubmit = document.getElementById("resolveSubmit");
const resolveText = document.getElementById("resolveText");
const libraryMatches = document.getElementById("libraryMatches");

const libraryId = document.getElementById("libraryId");
const docsQuery = document.getElementById("docsQuery");
const maxSnippets = document.getElementById("maxSnippets");
const docsSubmit = document.getElementById("docsSubmit");
const docsText = document.getElementById("docsText");
const docsJson = document.getElementById("docsJson");

const promptTask = document.getElementById("promptTask");
const promptLibraryName = document.getElementById("promptLibraryName");
const promptSubmit = document.getElementById("promptSubmit");
const promptText = document.getElementById("promptText");

async function requestJson(url, body) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function requireValue(element, message) {
  const value = element.value.trim();

  if (!value) {
    throw new Error(message);
  }

  return value;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdown(markdown) {
  const codeBlocks = [];
  const markdownWithTokens = markdown.replace(/\r\n/g, "\n").replace(
    /```([\w-]*)\n([\s\S]*?)```/g,
    (_, language, code) => {
      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`
      <pre class="code-block"><code>${escapeHtml(code.trim())}</code><span class="code-language">${escapeHtml(language || "text")}</span></pre>
    `);
      return token;
    }
  );
  let html = escapeHtml(markdownWithTokens);

  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\n-{10,}\n/g, "<hr />");

  const blocks = html
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (
        block.startsWith("<h1>") ||
        block.startsWith("<h2>") ||
        block.startsWith("<h3>") ||
        block.startsWith("<pre") ||
        block.startsWith("<hr")
      ) {
        return block;
      }

      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    });

  html = blocks.join("");

  codeBlocks.forEach((codeBlock, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, codeBlock);
  });

  return html;
}

function setDocsText(markdown) {
  docsText.innerHTML = renderMarkdown(markdown);
}

function getConnectionState(info) {
  if (info.targetMode === "hosted") {
    return {
      badgeClass: "connection-badge-remote",
      badgeText: "Sorgente docs · Context7 Hosted",
      metaText: `I dati arrivano da ${info.baseUrl}`,
    };
  }

  try {
    const targetUrl = new URL(info.baseUrl);
    const isLocalTarget =
      targetUrl.hostname === "localhost" ||
      targetUrl.hostname === "127.0.0.1" ||
      targetUrl.hostname === "::1";

    return {
      badgeClass: isLocalTarget
        ? "connection-badge-local"
        : "connection-badge-remote",
      badgeText: isLocalTarget
        ? "Sorgente docs · Custom locale"
        : "Sorgente docs · Custom remota",
      metaText: `I dati arrivano da ${info.baseUrl}`,
    };
  } catch {
    return {
      badgeClass: "connection-badge-neutral",
      badgeText: "Sorgente docs non riconosciuta",
      metaText: `Base URL: ${info.baseUrl}`,
    };
  }
}

function renderServerInfo(info) {
  const connectionState = getConnectionState(info);

  serverInfo.innerHTML = `
    <div><dt>Nome</dt><dd>${info.name}</dd></div>
    <div><dt>Versione</dt><dd>${info.version}</dd></div>
    <div><dt>API key</dt><dd>${info.apiKeyConfigured ? "Configurata" : "Mancante"}</dd></div>
  `;
  connectionBadge.className = `connection-badge ${connectionState.badgeClass}`;
  connectionBadge.textContent = connectionState.badgeText;
  connectionMeta.textContent = connectionState.metaText;
}

function renderLibraryMatches(matches) {
  if (!matches.length) {
    libraryMatches.className = "library-list empty";
    libraryMatches.textContent = "Nessun match.";
    libraryId.value = "";
    return;
  }

  libraryMatches.className = "library-list";
  libraryMatches.innerHTML = "";
  libraryId.value = matches[0].id;

  for (const [index, match] of matches.entries()) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "library-item";
    item.innerHTML = `
      <strong>${match.name}</strong>
      <span>${match.id}</span>
      <small>${match.description}</small>
      ${index === 0 ? "<small>Selezionato automaticamente</small>" : ""}
    `;
    item.addEventListener("click", () => {
      libraryId.value = match.id;
      setDocsText(`Library ID selected: \`${match.id}\``);
    });
    libraryMatches.appendChild(item);
  }
}

async function loadServerInfo() {
  try {
    const info = await requestJson("/api/server-info");
    renderServerInfo(info);
  } catch (error) {
    connectionBadge.className = "connection-badge connection-badge-neutral";
    connectionBadge.textContent = "Sorgente docs non disponibile";
    connectionMeta.textContent = getErrorMessage(error);
    serverInfo.innerHTML = `<div><dt>Errore</dt><dd>${error.message}</dd></div>`;
  }
}

resolveSubmit.addEventListener("click", async () => {
  resolveText.textContent = "Invio in corso...";
  libraryMatches.textContent = "Caricamento...";

  try {
    const result = await requestJson("/api/resolve-library-id", {
      query: requireValue(resolveQuery, "Inserisci una richiesta per resolve-library-id."),
      libraryName: requireValue(
        libraryName,
        "Inserisci il nome della libreria da cercare."
      ),
    });

    resolveText.textContent = result.text;
    renderLibraryMatches(result.matches);
    if (result.matches.length > 0) {
      setDocsText(`Library ID selected automatically: \`${result.matches[0].id}\``);
    }
  } catch (error) {
    resolveText.textContent = getErrorMessage(error);
    renderLibraryMatches([]);
  }
});

docsSubmit.addEventListener("click", async () => {
  setDocsText("Loading documentation...");
  docsJson.textContent = "{}";

  try {
    const result = await requestJson("/api/query-docs", {
      libraryId: requireValue(
        libraryId,
        "Seleziona o inserisci un Library ID prima di inviare query-docs."
      ),
      query: requireValue(
        docsQuery,
        "Inserisci una query di documentazione prima di inviare query-docs."
      ),
      maxSnippets: Number(maxSnippets.value),
    });

    setDocsText(result.text);
    docsJson.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    setDocsText(getErrorMessage(error));
    docsJson.textContent = "{}";
  }
});

promptSubmit.addEventListener("click", async () => {
  promptText.textContent = "Generazione...";

  try {
    const result = await requestJson("/api/draft-library-request", {
      task: requireValue(promptTask, "Inserisci un task prima di generare il prompt."),
      libraryName: promptLibraryName.value.trim() || undefined,
    });

    promptText.textContent = result.prompt;
  } catch (error) {
    promptText.textContent = getErrorMessage(error);
  }
});

loadServerInfo();
