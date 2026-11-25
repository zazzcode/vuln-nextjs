import { MongoClient } from 'mongodb';
import mongo from '../mongo.cjs';
import { seed } from './seed.js';

export const DATABASE = 'zazzles_workshop';

// One address and one seeding per process; Next.js bundles each route apart.
export function ready() {
  globalThis.__zazzlesWorkshop ??= (async () => {
    const uri = await mongo.serverUri();
    const client = await new MongoClient(uri).connect();
    await seed(client.db(DATABASE));
    return { uri, client };
  })().catch((error) => {
    delete globalThis.__zazzlesWorkshop;
    throw error;
  });
  return globalThis.__zazzlesWorkshop;
}

export const address = async () => (await ready()).uri;
export const database = async () => (await ready()).client.db(DATABASE);

export async function resetIfStarted() {
  if (globalThis.__zazzlesWorkshop) await seed(await database());
}

export async function close() {
  if (!globalThis.__zazzlesWorkshop) return;
  const { client } = await globalThis.__zazzlesWorkshop;
  delete globalThis.__zazzlesWorkshop;
  await client.close();
}

export default async function connect() {
  return (await ready()).client;
}
