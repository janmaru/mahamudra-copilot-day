import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  MAX_SNIPPET_LIMIT,
  SERVER_NAME,
  SERVER_VERSION,
  buildDraftLibraryRequest,
  documentationSchema,
  getServerInfo,
  librarySchema,
  queryDocs,
  resolveLibraryId,
  toErrorMessage,
} from "./context7.js";

export async function startMcpServer(): Promise<void> {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { logging: {} } }
  );

  server.registerResource(
    "server-info",
    "context7://server/info",
    {
      title: "Context7 MCP example server",
      description: "Server metadata, setup notes, and exposed capabilities.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(getServerInfo(), null, 2),
        },
      ],
    })
  );

  server.registerPrompt(
    "draft-library-request",
    {
      title: "Draft a Context7 lookup",
      description:
        "Turn a coding task into a library lookup and documentation query.",
      argsSchema: {
        task: z.string().min(1),
        libraryName: z.string().min(1).optional(),
      },
    },
    ({ task, libraryName }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildDraftLibraryRequest(task, libraryName),
          },
        },
      ],
    })
  );

  server.registerTool(
    "resolve-library-id",
    {
      title: "Resolve library id",
      description:
        "Find Context7 library IDs that match a library name and coding task.",
      inputSchema: {
        query: z.string().min(1),
        libraryName: z.string().min(1),
      },
      outputSchema: {
        matches: z.array(librarySchema),
      },
    },
    async ({ query, libraryName }) => {
      try {
        const result = await resolveLibraryId(query, libraryName);

        return {
          content: [{ type: "text", text: result.text }],
          structuredContent: {
            matches: result.matches,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to resolve library IDs: ${toErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "query-docs",
    {
      title: "Query Context7 docs",
      description:
        "Fetch up-to-date documentation snippets from Context7 for a resolved library ID.",
      inputSchema: {
        libraryId: z.string().min(1),
        query: z.string().min(1),
        maxSnippets: z.number().int().min(1).max(MAX_SNIPPET_LIMIT).optional(),
      },
      outputSchema: {
        libraryId: z.string(),
        query: z.string(),
        docs: z.array(documentationSchema),
      },
    },
    async ({ libraryId, query, maxSnippets }) => {
      try {
        const result = await queryDocs(libraryId, query, maxSnippets);

        return {
          content: [{ type: "text", text: result.text }],
          structuredContent: {
            libraryId: result.libraryId,
            query: result.query,
            docs: result.docs,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to query Context7 docs: ${toErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
