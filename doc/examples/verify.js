const request = require('request');

if (process.argv.length < 4) {
  console.error('Usage:\nnode verify.js <phone number> <code>');
  process.exit(1);
}

const url = 'http://localhost:8080/v1/verify';

const options = {
  body: {
    phone_number: process.argv[2],
    token: process.argv[3],
  },
  json: true,
};

request.post(url, options, (err, response) => {
  if (err) {
    console.error(err);
  } else {
    if (response.statusCode !== 200) {
      console.error(`Verifying phone number failed with status code: ${response.statusCode}`);
      console.error(response.body);
    } else {
      console.info('Request successful!');
      console.info(response.body);
    }
  }
});
