import database from '../../../lib/database.cjs';
import mongo from '../../../lib/mongo.cjs';
import http from '../../../lib/http.cjs';
export default http.endpoint(['POST'], async (_req, res) => {
  await database.resetDatabase();
  await mongo.resetMongoIfStarted();
  return res.status(200).json({ reset: true });
});
