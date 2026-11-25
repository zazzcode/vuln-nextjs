export class PeopleRepository {
  constructor(db) { this.people = db.collection('people'); }

  async one(criteria) {
    return this.people.findOne(criteria);
  }

  async many(criteria) {
    return this.people.find(criteria, { projection: { _id: 0, login: 1, team: 1 } }).sort({ login: 1 }).toArray();
  }

  async byPair(login, secret) {
    return this.people.findOne({ login, passcode: secret });
  }

  async change(login, document) {
    return this.people.replaceOne({ login }, document);
  }
}
