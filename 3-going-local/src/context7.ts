import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Context7, type Documentation, type Library } from "@upstash/context7-sdk";
import { z } from "zod";

export const SERVER_NAME = "context7-example-server";
export const SERVER_VERSION = "1.1.0";
export const DEFAULT_SNIPPET_LIMIT = 5;
export const MAX_SNIPPET_LIMIT = 20;

export const librarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  totalSnippets: z.number(),
  trustScore: z.number(),
  benchmarkScore: z.number(),
  versions: z.array(z.string()).optional(),
});

export const documentationSchema = z.object({
  title: z.string(),
  content: z.string(),
  source: z.string(),
});

let context7Client: Context7 | undefined;
const HOSTED_BASE_URL = "https://context7.com/api";
const VALID_MODES = ["hosted", "custom"] as const;
type Context7Mode = (typeof VALID_MODES)[number];
type Context7Config =
  | {
      mode: "hosted";
      apiKey: string;
      baseUrl: typeof HOSTED_BASE_URL;
    }
  | {
      mode: "custom";
      apiKey?: string;
      baseUrl: string;
    };

type McpToolResult = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  isError?: boolean;
};

function normalizeCustomBaseUrl(configuredBaseUrl: string): string {
  const normalizedBaseUrl = configuredBaseUrl.replace(/\/$/, "");
  return normalizedBaseUrl.endsWith("/mcp")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/mcp`;
}

function getContext7ConfigError(): string | undefined {
  const mode = process.env.CONTEXT7_MODE?.trim();
  const apiKey = process.env.CONTEXT7_API_KEY?.trim();
  const configuredBaseUrl = process.env.CONTEXT7_BASE_URL?.trim();

  if (!mode) {
    return "CONTEXT7_MODE is required. Set it to 'hosted' or 'custom'.";
  }

  if (!VALID_MODES.includes(mode as Context7Mode)) {
    return "CONTEXT7_MODE must be either 'hosted' or 'custom'.";
  }

  if (mode === "hosted") {
    if (!apiKey) {
      return "CONTEXT7_API_KEY is required when CONTEXT7_MODE=hosted.";
    }

    if (configuredBaseUrl) {
      return "CONTEXT7_BASE_URL must be empty when CONTEXT7_MODE=hosted.";
    }

    return undefined;
  }

  if (!configuredBaseUrl) {
    return "CONTEXT7_BASE_URL is required when CONTEXT7_MODE=custom.";
  }

  return undefined;
}

function getContext7Config(): Context7Config {
  const error = getContext7ConfigError();

  if (error) {
    throw new Error(error);
  }

  const mode = process.env.CONTEXT7_MODE?.trim() as Context7Mode;
  const apiKey = process.env.CONTEXT7_API_KEY?.trim();
  const configuredBaseUrl = process.env.CONTEXT7_BASE_URL?.trim();

  if (mode === "hosted") {
    return {
      mode,
      apiKey: apiKey!,
      baseUrl: HOSTED_BASE_URL,
    };
  }

  return {
    mode,
    apiKey,
    baseUrl: normalizeCustomBaseUrl(configuredBaseUrl!),
  };
}

function getContext7Client(): Context7 {
  const config = getContext7Config();

  if (config.mode !== "hosted") {
    throw new Error(
      "Context7 SDK client is only used when CONTEXT7_MODE=hosted."
    );
  }

  context7Client ??= new Context7({ apiKey: config.apiKey });
  return context7Client;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getServerInfo() {
  const mode = process.env.CONTEXT7_MODE?.trim();
  const configError = getContext7ConfigError();
  const configuredBaseUrl = process.env.CONTEXT7_BASE_URL?.trim();

  return {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    profile: process.env.CONTEXT7_ACTIVE_PROFILE ?? null,
    envFile: process.env.CONTEXT7_ACTIVE_ENV_FILE ?? null,
    requiresEnv:
      mode === "custom"
        ? ["CONTEXT7_MODE", "CONTEXT7_BASE_URL"]
        : ["CONTEXT7_MODE", "CONTEXT7_API_KEY"],
    mode: mode || null,
    apiKeyConfigured: Boolean(process.env.CONTEXT7_API_KEY),
    baseUrl:
      mode === "custom" && configuredBaseUrl
        ? normalizeCustomBaseUrl(configuredBaseUrl)
        : HOSTED_BASE_URL,
    targetMode: mode === "custom" ? "custom" : "hosted",
    configError: configError ?? null,
    tools: ["resolve-library-id", "query-docs"],
    prompts: ["draft-library-request"],
  };
}

export function buildDraftLibraryRequest(task: string, libraryName?: string): string {
  return [
    "Prepare a Context7-friendly docs request.",
    `Task: ${task}`,
    libraryName ? `Preferred library name: ${libraryName}` : undefined,
    "Return:",
    "1. the best library name to resolve",
    "2. a focused docs query to pass to query-docs",
    "3. any version constraints worth including",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatLibraryList(matches: Library[]): string {
  if (matches.length === 0) {
    return "No matching libraries were found.";
  }

  return matches
    .map((library, index) => {
      const versions = library.versions?.length
        ? ` | versions: ${library.versions.join(", ")}`
        : "";

      return [
        `${index + 1}. ${library.name} (${library.id})`,
        `   snippets: ${library.totalSnippets} | trust: ${library.trustScore} | benchmark: ${library.benchmarkScore}${versions}`,
        `   ${library.description}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function formatDocumentation(
  libraryId: string,
  query: string,
  docs: Documentation[]
): string {
  if (docs.length === 0) {
    return `No documentation snippets were returned for ${libraryId}.`;
  }

  const sections = docs.map((doc, index) =>
    [
      `## Snippet ${index + 1}: ${doc.title}`,
      `Source: ${doc.source}`,
      doc.content.trim(),
    ].join("\n")
  );

  return [`# Context7 docs for ${libraryId}`, `Query: ${query}`, ...sections].join(
    "\n\n"
  );
}

function extractMcpText(result: McpToolResult): string {
  return (result.content ?? [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n\n");
}

async function callCustomMcpTool(
  toolName: string,
  args: Record<string, string | number | undefined>
): Promise<string> {
  const config = getContext7Config();

  if (config.mode !== "custom") {
    throw new Error("Custom MCP calls require CONTEXT7_MODE=custom.");
  }

  const client = new McpClient({
    name: "context7-local-ui",
    version: SERVER_VERSION,
  });
  const headers: Record<string, string> = {};
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  const transport = new StreamableHTTPClientTransport(new URL(config.baseUrl), {
    requestInit: {
      headers,
    },
  });

  try {
    await client.connect(transport);
    const result = (await client.callTool({
      name: toolName,
      arguments: Object.fromEntries(
        Object.entries(args).filter(([, value]) => value !== undefined)
      ),
    })) as McpToolResult;
    const text = extractMcpText(result);

    if (result.isError) {
      throw new Error(text || `Custom MCP tool '${toolName}' failed.`);
    }

    return text;
  } finally {
    await transport.close();
  }
}

function parseLibrariesFromMcpText(text: string): Library[] {
  const blocks = text
    .split("----------")
    .map((block) => block.trim())
    .filter((block) => block.includes("Context7-compatible library ID:"));

  return blocks
    .map((block): Library | undefined => {
      const name = /- Title:\s*(.+)/.exec(block)?.[1]?.trim();
      const id = /- Context7-compatible library ID:\s*(.+)/.exec(block)?.[1]?.trim();
      const description = /- Description:\s*([\s\S]*?)(?:\n- |$)/.exec(block)?.[1]?.trim();
      const totalSnippetsText = /- Code Snippets:\s*([0-9]+)/.exec(block)?.[1];
      const trustScoreText = /- Trust Score:\s*([0-9]+(?:\.[0-9]+)?)/.exec(block)?.[1];
      const benchmarkScoreText = /- Benchmark Score:\s*([0-9]+(?:\.[0-9]+)?)/.exec(block)?.[1];
      const versionsText = /- Versions:\s*(.+)/.exec(block)?.[1]?.trim();

      if (!name || !id || !description) {
        return undefined;
      }

      const library: Library = {
        id,
        name,
        description,
        totalSnippets: totalSnippetsText ? Number(totalSnippetsText) : 0,
        trustScore: trustScoreText ? Number(trustScoreText) : 0,
        benchmarkScore: benchmarkScoreText ? Number(benchmarkScoreText) : 0,
      };

      if (versionsText) {
        library.versions = versionsText.split(",").map((value) => value.trim());
      }

      return library;
    })
    .filter((library): library is Library => Boolean(library));
}

function parseDocsFromMcpText(text: string): Documentation[] {
  const normalizedText = text.replace(/\r\n/g, "\n");
  const sections = normalizedText
    .split(/\n--------------------------------\n+/)
    .map((section) => section.trim())
    .filter(Boolean);

  const docs = sections
    .map((section) => {
      const match = /^###\s+(.+?)\n\nSource:\s+(.+?)\n\n([\s\S]+)$/m.exec(section);

      if (!match) {
        return undefined;
      }

      const [, title, source, content] = match;
      return {
        title: title.trim(),
        source: source.trim(),
        content: content.trim(),
      } satisfies Documentation;
    })
    .filter((doc): doc is Documentation => Boolean(doc));

  return docs;
}

export async function resolveLibraryId(query: string, libraryName: string) {
  const config = getContext7Config();
  const resultText =
    config.mode === "custom"
      ? await callCustomMcpTool("resolve-library-id", {
          libraryName,
          query,
        })
      : "";
  const matches =
    config.mode === "custom"
      ? parseLibrariesFromMcpText(resultText)
      : await getContext7Client().searchLibrary(query, libraryName, {
        type: "json",
      });

  return {
    matches,
    text: config.mode === "custom" ? resultText : formatLibraryList(matches),
  };
}

export async function queryDocs(
  libraryId: string,
  query: string,
  maxSnippets = DEFAULT_SNIPPET_LIMIT
) {
  const config = getContext7Config();
  const resultText =
    config.mode === "custom"
      ? await callCustomMcpTool("get-library-docs", {
          context7CompatibleLibraryID: libraryId,
          topic: query,
        })
      : "";
  const docs =
    config.mode === "custom"
      ? parseDocsFromMcpText(resultText)
      : await getContext7Client().getContext(query, libraryId, {
        type: "json",
      });
  const trimmedDocs = docs.slice(0, maxSnippets);

  return {
    libraryId,
    query,
    docs: trimmedDocs,
    text:
      config.mode === "custom"
        ? resultText
        : formatDocumentation(libraryId, query, trimmedDocs),
  };
}
