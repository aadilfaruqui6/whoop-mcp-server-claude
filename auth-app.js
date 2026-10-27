#!/usr/bin/env node
// One-time WHOOP OAuth login. Tokens are saved (owner-only) by the API client; they are never printed.
import http from 'http';
import crypto from 'crypto';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { WhoopApiClient } from './dist/whoop-api.js';
import { tokenFilePath } from './dist/token-store.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true });

const PORT = 3000;
const { WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET } = process.env;
if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET) {
  console.error('Set WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET (see env.example).');
  process.exit(1);
}

const client = new WhoopApiClient({
  clientId: WHOOP_CLIENT_ID,
  clientSecret: WHOOP_CLIENT_SECRET,
  redirectUri: process.env.WHOOP_REDIRECT_URI || `http://localhost:${PORT}/callback`,
});

const state = crypto.randomBytes(16).toString('hex');
const authUrl = client.getAuthorizationUrl(state);

const page = (body) => `<html><body style="font-family:sans-serif;max-width:600px;margin:50px auto">${body}</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end('Not Found');
    return;
  }
  const code = url.searchParams.get('code');
  if (url.searchParams.get('state') !== state || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('<h1>Login failed</h1><p>State mismatch or missing code. Run the login again.</p>'));
    return;
  }
  try {
    await client.exchangeCodeForToken(code);
    const profile = await client.getUserProfile();
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(page('<h1>WHOOP connected</h1><p>You can close this tab.</p>'));
    console.log(`Connected as ${profile.first_name} ${profile.last_name}. Tokens saved to ${tokenFilePath()}`);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/html' }).end(page('<h1>Login failed</h1><p>See the terminal.</p>'));
    console.error('Login failed:', error.message);
  }
  server.close(() => process.exit(0));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Opening WHOOP login. If the browser does not open, visit:\n' + authUrl);
  spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [authUrl], { stdio: 'ignore' }).on('error', () => {});
});
