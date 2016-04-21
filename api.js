const express = require('express');
const dispatchController = require('./backends/esendex');
const PhoneNumber = require('./db/phonenumber');
const Promise = require('bluebird');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');

const PhoneNumberUtil = require('google-libphonenumber').PhoneNumberUtil;
const PhoneNumberFormat = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = PhoneNumberUtil.getInstance();

const jwtSigningOptions = {
  algorithm: 'RS256',
};

if (!process.env.JWT_PRIVATE_KEY_FILE) {
  console.error('You need to define a RSA private key using the JWT_PRIVATE_KEY_FILE env variable');
  process.exit(1);
}

const privateKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE);

// const PHONE_NUMBER_VERIFICATION_BLOCK_TIME = 5 * 60 * 1000; // in milliseconds

// FIXME languages and countries should not be a server constant
const DEFAULT_COUNTRY_CODE = 'DE';
const DEFAULT_LANGUAGE = 'de-DE';

const TOKEN_LENGTH = 5;

const DUMMY_CODE_ALLOWED = process.env.DUMMY_CODE_ALLOWED === 'true';
const DISPATCHING_DISABLED = process.env.DISPATCHING_DISABLED === 'true';

if (DUMMY_CODE_ALLOWED) {
  console.warn('CAUTION: Dummy phone number verification code 12345 is allowed!');
}

if (DISPATCHING_DISABLED) {
  console.warn('Dispatching is disabled. Unset DISPATCHING_DISABLED in order to enable it.');
}

const api = new express.Router();

/**
* Sends a verification code to a given phone number
*
* @param phone_number: the phone number to verify
* @param message_type: the type of message to send: 'SMS' or 'Voice'. Default is 'SMS'
*/
api.post('/requestCode', (req, res) => {
  const phoneNumber = req.body && req.body.phone_number;
  const messageType = (req.body && req.body.message_type) || 'SMS';

  let promise = Promise.try(() => {
    if (messageType !== 'SMS' && messageType !== 'Voice') {
      throw new Error(`Invalid message type "${messageType}"` +
        'Allowed values: "SMS" or "Voice"');
    }

    const parsedPhoneNumber = phoneUtil.parse(phoneNumber, DEFAULT_COUNTRY_CODE);
    const phoneNumberE164 = phoneUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164);

    return phoneNumberE164;
  });

  promise = promise.then((phoneNumberE164) =>
    [
      phoneNumberE164,
      PhoneNumber.findOne({ phone_number: phoneNumberE164 }).exec(),
    ]);

  promise = promise.spread((phoneNumberE164, foundDbEntry) => {
    let dbPhoneNumber = foundDbEntry;

    if (!dbPhoneNumber) {
      dbPhoneNumber = new PhoneNumber();
    }

    dbPhoneNumber.phone_number = phoneNumberE164;
    dbPhoneNumber.token = randomstring.generate({
      length: TOKEN_LENGTH,
      charset: 'numeric',
    });
    dbPhoneNumber.token_valid_until = new Date(Date.now() + 10 * 60 * 1000); // valid 10 minutes

    return dbPhoneNumber.save();
  });

  promise = promise.then((savedPhoneNumber) => {
    if (DISPATCHING_DISABLED) {
      console.warn(
        'Dispatching is disabled. ' +
        `Would send token ${savedPhoneNumber.token} to number ${savedPhoneNumber.phone_number}`
      );
      return Promise.resolve();
    }

    // If we are sending a voice message, force every digit of the token
    // to be pronounced at once by inserting a space between the digits.
    const token = messageType === 'Voice' ?
      savedPhoneNumber.token.split('').join(' ') :
      savedPhoneNumber.token;

    return dispatchController.sendMessage(
      'bringnow',
      savedPhoneNumber.phone_number,
      `Der Code zur Verifizierung Ihrer Telefonnummer lautet: ${token}`,
      'Voice',
      DEFAULT_LANGUAGE
    );
  });

  promise = promise.then(() => {
    res.status(200);
    res.send();
  });

  // TODO better error handling
  promise = promise.catch((err) => {
    res.status(401);
    res.send(err.message);
  });
});

function verifyToken(dbPhoneNumber, token) {
  if (!dbPhoneNumber) {
    throw new Error('No verification requested for this phone number');
  }

  if (!dbPhoneNumber.token_valid_until || dbPhoneNumber.token_valid_until < new Date()) {
    throw new Error('Verification token expired!');
  }

  if (DUMMY_CODE_ALLOWED && token === '12345') {
    console.warn('User verified phone number using dummy token!');
    return;
  }

  if (dbPhoneNumber.token !== token) {
    throw new Error('Given reset token is invalid!');
  }

  return;
}

/**
* Verifies a phone number using a token previously send to it
*
* @param phone_number: The phone number to verify
* @param token: the verification token send via sms / voice message
*/
api.post('/verify', (req, res) => {
  const phoneNumber = req.body && req.body.phone_number;
  const token = req.body && req.body.token;

  const parsedPhoneNumber = phoneUtil.parse(phoneNumber, DEFAULT_COUNTRY_CODE);
  const phoneNumberE164 = phoneUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164);

  let promise = PhoneNumber.findOne({ phone_number: phoneNumberE164 }).exec();

  promise = promise.then((foundDbEntry) => {
    const dbPhoneNumber = foundDbEntry;

    verifyToken(dbPhoneNumber, token);

    dbPhoneNumber.last_verified = new Date();
    delete dbPhoneNumber.token;
    delete dbPhoneNumber.token_valid_until;

    return dbPhoneNumber.save();
  });

  promise = promise.then((dbPhoneNumber) => {
    const payload = {
      phone_number: dbPhoneNumber.phone_number,
      last_verified: dbPhoneNumber.last_verified,
    };

    return new Promise((resolve) => {
      jwt.sign(payload, privateKey, jwtSigningOptions, (jwtToken) => {
        resolve(jwtToken);
      });
    });
  });

  promise = promise.then((jwtToken) => {
    res.status(200);
    res.send(jwtToken);
  });

  // TODO better error handling
  promise = promise.catch((err) => {
    res.status(401);
    res.send(err.message);
  });
});

module.exports = api;
