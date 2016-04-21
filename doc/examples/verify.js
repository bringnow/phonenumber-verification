const request = require('request');
const jwt = require('jsonwebtoken');
const fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage:\nnode verify.js <phone number> <code>');
  process.exit(1);
}

const jwtVerificationOptions = {
  algorithm: 'RS256',
};

if (!process.env.JWT_PUBLIC_KEY_FILE) {
  console.error('You need to define a RSA public key using the JWT_PUBLIC_KEY_FILE env variable');
  process.exit(1);
}

const publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE);


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

      // In a real application we would now send the returned
      // JWT token to a service which wants us to identify using
      // our phone number. This service could then verify our token
      // signature using the jwt.verify function and the RSA public key
      // matching the RSA private key used by the phonenumber-verification
      // service to sign the token.
      const jwtToken = response.body;

      try {
        const payload = jwt.verify(jwtToken, publicKey, jwtVerificationOptions);
        console.info(`Phone number ${payload.phone_number} sucessfully veified ` +
          `at ${payload.last_verified}`);
      } catch (jwtError) {
        console.error('Could not verify the JWT token.', jwtError);
      }
    }
  }
});
