import { MongoClient } from "mongodb";
let db;
const connect = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    db = client.db(process.env.MONGOOSE_DATABASE);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export { db, connect };
