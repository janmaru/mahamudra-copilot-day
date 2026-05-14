import "./env.js";
import { startMcpServer } from "./mcp-server.js";
import { toErrorMessage } from "./context7.js";

startMcpServer().catch((error) => {
  console.error(toErrorMessage(error));
  process.exit(1);
});
