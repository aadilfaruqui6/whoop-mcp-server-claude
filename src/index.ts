import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { WhoopMcpServer } from './mcp-server.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true } as never);

const requiredEnvVars = ['WHOOP_CLIENT_ID', 'WHOOP_CLIENT_SECRET'];
const missingVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

const server = new WhoopMcpServer({
  clientId: process.env.WHOOP_CLIENT_ID!,
  clientSecret: process.env.WHOOP_CLIENT_SECRET!,
  redirectUri: process.env.WHOOP_REDIRECT_URI || 'http://localhost:3000/callback',
});

server.run().catch((error) => {
  console.error('Failed to start WHOOP MCP Server:', error);
  process.exit(1);
});
