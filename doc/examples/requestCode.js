const request = require('request');

if (process.argv.length < 3) {
  console.error('Usage:\nnode requestCode.js <phone number>');
  process.exit(1);
}

const url = 'http://localhost:8080/v1/requestCode';

const options = {
  body: {
    phone_number: process.argv[2],
  },
  json: true,
};

request.post(url, options, (err, response) => {
  if (err) {
    console.error(err);
  } else {
    if (response.statusCode !== 200) {
      console.error(`Requesting code failed with status code: ${response.statusCode}`);
      console.error(response.body);
    } else {
      console.info('Request successful!');
    }
  }
});
