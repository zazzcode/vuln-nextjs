import { createHash } from 'node:crypto';

export const digest = (text) => createHash('sha256').update(text).digest('hex');

const people = () => [
  { login: 'admin', passcode: 'admin-lab-only', resetCode: 'rs-9f31', resetHash: digest('rs-9f31'), otp: '481516', badge: 'B-77-ADM', team: 'board', role: 'admin', email: 'admin@lab.test' },
  { login: 'alice', passcode: 'alice-lab-only', resetCode: 'rs-2c08', resetHash: digest('rs-2c08'), otp: '234202', badge: 'B-12-ALI', team: 'floor', role: 'user', email: 'alice@lab.test' },
];
const parts = () => [
  { sku: 'P-9', name: 'Prototype jig', bin: 'Z', quantity: 1, listed: false, supplier: 'zazzles-supplier-nova' },
  { sku: 'P-2', name: 'Torque wrench', bin: 'B', quantity: 2, listed: true, supplier: 'zazzles-supplier-apex' },
  { sku: 'P-1', name: 'Hex key', bin: 'A', quantity: 4, listed: true, supplier: 'zazzles-supplier-mint' },
];
const loans = () => [
  { number: 202, borrower: 'admin', sku: 'P-9', state: 'out' },
  { number: 101, borrower: 'alice', sku: 'P-1', state: 'out' },
];

export async function seed(db) {
  await db.dropDatabase();
  await db.collection('people').insertMany(people());
  await db.collection('parts').insertMany(parts());
  await db.collection('loans').insertMany(loans());
}
