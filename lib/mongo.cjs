const { MongoClient, ObjectId } = require('mongodb');

const DATABASE = 'zazzles_lab';

async function seed(db) {
  await Promise.all(['accounts', 'articles', 'bookings'].map((name) => db.collection(name).deleteMany({})));
  // Plaintext secrets are synthetic and exist only so queries can compare them.
  await db.collection('accounts').insertMany([
    { username: 'admin', passphrase: 'admin-lab-only', pin: 7310, inviteCode: 'zz-admin-41', displayName: 'Lab admin', email: 'admin@lab.test', access: { role: 'admin' } },
    { username: 'alice', passphrase: 'alice-lab-only', pin: 2046, inviteCode: 'zz-alice-17', displayName: 'Alice', email: 'alice@lab.test', access: { role: 'user' } },
  ]);
  await db.collection('articles').insertMany([
    { _id: new ObjectId('64b000000000000000000000'), title: 'Internal prototype', category: 'lab', price: 999, published: false, reviewerNote: 'zazzles-note-bravo' },
    { _id: new ObjectId('64b000000000000000000001'), title: 'Security notebook', category: 'books', price: 8, published: true, reviewerNote: 'zazzles-note-charlie' },
    { _id: new ObjectId('64b000000000000000000002'), title: 'Zazzles mug', category: 'home', price: 12, published: true, reviewerNote: 'zazzles-note-alpha' },
  ]);
  await db.collection('bookings').insertMany([
    { reference: 'BK-1001', holder: 'alice', status: 'open' },
    { reference: 'BK-2002', holder: 'admin', status: 'open' },
  ]);
}

async function start() {
  // Loaded on first use: the server downloads mongod once and keeps data in memory.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const server = await MongoMemoryServer.create({ binary: { version: '8.2.6' }, instance: { ip: '127.0.0.1' } });
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const db = client.db(DATABASE);
    await seed(db);
    return { server, client, db };
  } catch (error) {
    await client.close();
    await server.stop();
    throw error;
  }
}

// Global promise: Next.js bundles each API route separately, and one server
// process must share one mongod.
function connection() {
  if (!globalThis.__zazzlesLabMongo) {
    globalThis.__zazzlesLabMongo = start().catch((error) => {
      delete globalThis.__zazzlesLabMongo;
      throw error;
    });
  }
  return globalThis.__zazzlesLabMongo;
}

async function collection(name) {
  return (await connection()).db.collection(name);
}

async function serverUri() {
  return (await connection()).server.getUri();
}

async function resetMongo() {
  await seed((await connection()).db);
}

// A lab reset must not start (or download) mongod for someone using only SQL.
async function resetMongoIfStarted() {
  if (globalThis.__zazzlesLabMongo) await resetMongo();
}

async function closeMongo() {
  if (!globalThis.__zazzlesLabMongo) return;
  const { client, server } = await globalThis.__zazzlesLabMongo;
  delete globalThis.__zazzlesLabMongo;
  await client.close();
  await server.stop();
}

module.exports = { collection, serverUri, resetMongo, resetMongoIfStarted, closeMongo };
