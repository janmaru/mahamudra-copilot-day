import "./env.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import {
  MAX_SNIPPET_LIMIT,
  buildDraftLibraryRequest,
  getServerInfo,
  queryDocs,
  resolveLibraryId,
  toErrorMessage,
} from "./context7.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");
const port = Number(process.env.PORT ?? "8080");

const jsonMimeTypes = new Map<string, string>([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

const resolveLibraryBodySchema = z.object({
  query: z.string().min(1),
  libraryName: z.string().min(1),
});

const queryDocsBodySchema = z.object({
  libraryId: z.string().min(1),
  query: z.string().min(1),
  maxSnippets: z.number().int().min(1).max(MAX_SNIPPET_LIMIT).optional(),
});

const draftPromptBodySchema = z.object({
  task: z.string().min(1),
  libraryName: z.string().min(1).optional(),
});

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "request";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

async function serveStaticFile(response: ServerResponse, filePath: string): Promise<void> {
  const extension = path.extname(filePath);
  const file = await readFile(filePath);

  response.writeHead(200, {
    "Content-Type": jsonMimeTypes.get(extension) ?? "application/octet-stream",
  });
  response.end(file);
}

async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string
): Promise<void> {
  if (request.method === "GET" && pathname === "/api/server-info") {
    sendJson(response, 200, getServerInfo());
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const body = await readJsonBody(request);

  if (pathname === "/api/resolve-library-id") {
    const { query, libraryName } = resolveLibraryBodySchema.parse(body);
    const result = await resolveLibraryId(query, libraryName);

    sendJson(response, 200, result);
    return;
  }

  if (pathname === "/api/query-docs") {
    const { libraryId, query, maxSnippets } = queryDocsBodySchema.parse(body);
    const result = await queryDocs(libraryId, query, maxSnippets);

    sendJson(response, 200, result);
    return;
  }

  if (pathname === "/api/draft-library-request") {
    const { task, libraryName } = draftPromptBodySchema.parse(body);

    sendJson(response, 200, {
      prompt: buildDraftLibraryRequest(task, libraryName),
    });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

export async function startUiServer(): Promise<void> {
  const server = createServer(async (request, response) => {
    try {
      if (!request.url) {
        sendJson(response, 400, { error: "Missing request URL" });
        return;
      }

      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      const pathname = url.pathname;

      if (pathname.startsWith("/api/")) {
        await handleApiRequest(request, response, pathname);
        return;
      }

      const staticPath =
        pathname === "/"
          ? path.join(publicDir, "index.html")
          : path.join(publicDir, pathname.replace(/^\/+/, ""));

      if (!staticPath.startsWith(publicDir)) {
        sendJson(response, 403, { error: "Forbidden" });
        return;
      }

      await serveStaticFile(response, staticPath);
    } catch (error) {
      const statusCode = error instanceof z.ZodError ? 400 : 500;
      sendJson(response, statusCode, {
        error:
          error instanceof z.ZodError
            ? formatValidationError(error)
            : toErrorMessage(error),
      });
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });

  console.log(`UI available at http://localhost:${port}`);
}

startUiServer().catch((error) => {
  console.error(toErrorMessage(error));
  process.exit(1);
});
