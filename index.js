const http = require('http');
const express = require('express');
const api = require('./api');

process.env.PORT = process.env.PORT || 5001;

const app = express();
const server = http.createServer(app);

app.use(api);

server.listen(process.env.PORT, () => {
  console.info('Server started on port %d in %s mode! Waiting for requests...',
    process.env.PORT,
    process.env.NODE_ENV
  );
});
