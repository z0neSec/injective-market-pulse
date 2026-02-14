/**
 * Injective Market Pulse API — Entry Point
 *
 * Starts the Fastify server.
 */

import { buildApp } from './app';
import { config } from './config';

async function main() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀  Injective Market Pulse API                             ║
║                                                              ║
║   Server:    ${address.padEnd(45)}║
║   Docs:      ${(address + '/docs').padEnd(45)}║
║   Network:   ${config.injective.network.padEnd(45)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
