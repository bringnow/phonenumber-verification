const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const DATABASE_NAME = 'phonenumbers';

let mongoDbUrl = process.env.MONGODB_URL;

// If database linked with hostname 'mongodb'
if (!mongoDbUrl && process.env.MONGODB_PORT) {
  mongoDbUrl = `${process.env.MONGODB_PORT_27017_TCP_ADDR}:27017/${DATABASE_NAME}`;
}

if (!mongoDbUrl) {
  mongoDbUrl = `localhost:27017/${DATABASE_NAME}`;
}

if (mongoDbUrl.indexOf('mongodb://') === -1) {
  mongoDbUrl = `mongodb://${mongoDbUrl}`;
}

// Connect to our database
console.log(`Connect to mongodb: ${mongoDbUrl}`);
mongoose.connect(mongoDbUrl);

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  console.log(`Mongoose connection error: ' ${err} '\nMongo server started?'`);
});

// When the connection is connected
mongoose.connection.on('connected', () => {
  console.log('Mongoose connection connected');
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose connection disconnected');
});

module.exports.url = mongoDbUrl;
module.exports.connection = mongoose.connection;
