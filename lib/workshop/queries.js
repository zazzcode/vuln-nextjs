import { database } from './client.js';

export async function first(name, criteria, options) {
  return (await database()).collection(name).findOne(criteria, options);
}

export async function drop(name, criteria) {
  return (await database()).collection(name).findOneAndDelete(criteria);
}

export async function advance(name, criteria, fields) {
  return (await database()).collection(name).findOneAndUpdate(criteria, { $set: fields }, { returnDocument: 'after', projection: { _id: 0 } });
}

export async function listParts(criteria) {
  const rows = [];
  for await (const part of (await database()).collection('parts').find(criteria).sort({ sku: 1 })) rows.push({ sku: part.sku, name: part.name });
  return rows;
}
