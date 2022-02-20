// @ts-check

const { MongoClient } = require("mongodb");

const uri = `mongodb+srv://OSEUNGJUN:${process.env.MONGO_PASSWORD}@cluster0.tzkpq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = client;
