const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const api = require('./api');

process.env.PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);

require('./db/connection');

app.use(bodyParser.json());
app.use('/v1', api);

server.listen(process.env.PORT, () => {
  console.info(`Server started on port ${process.env.PORT} Waiting for requests...`);
});
