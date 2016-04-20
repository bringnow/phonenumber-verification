const express = require('express');
const smsController = require('./backends/esendex');
const PhoneNumber = require('./db/phonenumber');
const biguint = require('biguint-format');
const crypto = require('crypto');

const PhoneNumberUtil = require('google-libphonenumber').PhoneNumberUtil;
const PhoneNumberFormat = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = PhoneNumberUtil.getInstance();
//
// const PHONE_NUMBER_VERIFICATION_BLOCK_TIME = 5 * 60 * 1000; // in milliseconds

// FIXME should not be a server constant
const DEFAULT_COUNTRY_CODE = 'DE';

if (process.env.PHONE_NUMBER_VERIFICATION_DUMMY_CODE_ALLOWED === 'true') {
  console.warn('CAUTION: Dummy phone number verification code 12345 is allowed!');
}

if (process.env.SMS_DISABLED === 'true') {
  console.warn('SMS dispatching is disabled. Unset SMS_DISABLED in order to enable it.');
}

const api = new express.Router();

/**
* Sends a verification code to a given phone number
*
* @param user_id: the user requesting the verification
* @param phone_number: the phone number to verify
* @return Promise
*/
api.post('/requestCode', (req, res) => {
  const phoneNumber = req.body && req.body.phone_number;

  const parsedPhoneNumber = phoneUtil.parse(phoneNumber, DEFAULT_COUNTRY_CODE);
  const phoneNumberE164 = phoneUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164);

  let promise = PhoneNumber.findOne({ phone_number: phoneNumberE164 }).exec();

  promise = promise.then((foundDbEntry) => {
    let dbPhoneNumber = foundDbEntry;

    if (!dbPhoneNumber) {
      dbPhoneNumber = new PhoneNumber();
    }

    dbPhoneNumber.phone_number = phoneNumberE164;
    dbPhoneNumber.token = biguint(crypto.randomBytes(2), 'dec');
    dbPhoneNumber.token_valid_until = new Date(Date.now() + 10 * 60 * 1000); // valid 10 minutes

    return dbPhoneNumber.save();
  });

  promise = promise.then((savedPhoneNumber) => {
    if (process.env.SMS_DISABLED === 'true') {
      console.warn(
        'SMS dispatching is disabled. ' +
        `Would send token ${savedPhoneNumber.token} to number ${savedPhoneNumber.phone_number}`
      );
      return Promise.resolve();
    }

    return smsController.sendSMS(
      'bringnow',
      savedPhoneNumber.phone_number,
      `Der Code zur Verifizierung Ihrer Telefonnummer lautet: ${savedPhoneNumber.token}`
    );
  });

  promise = promise.then(() => {
    res.status(200);
    res.send();
  });
});

/**
* Verifies a user's phone number using a token send to it
*
* @param user_id: the user whose phone number should be verified
* @param phone_number:
* @param token: the verification token send via sms
* @return Promise
*/
api.post('/', (req, res) => {
  res.status(200);
  res.send();

    // var self = this;
    // var promise;
    //
    // promise = self.findById(user_id);
    //
    // promise = promise.tap(function(user) {
    //
    //     if(!user.phone_number_verification
    //     || !user.phone_number_verification.token) {
    //         throw new errors.PhoneNumberVerificationFailed(
    //          'No phone number verification requested');
    //     }
    //
    //     if(user.phone_number !== phone_number) {
    //         throw new errors.PhoneNumberVerificationFailed(
    //          'Phone number to validate does not match stored phone number!');
    //     }
    //
    //     if(!user.phone_number_verification.token_valid_until
    //      || user.phone_number_verification.token_valid_until < new Date()) {
    //         throw new errors.PhoneNumberVerificationFailed('Verification token expired!');
    //     }
    //
    //     if(self.phoneNumberVerificationAllowDummyCode && token === '12345') {
    //         log.warn('User verified phone number using dummy token!');
    //     } else if(user.phone_number_verification.token !== token) {
    //         throw new errors.PhoneNumberVerificationFailed('Given reset token is invalid!');
    //     }
    //
    //     user.phone_number_verified = true;
    //     delete user.phone_number_verification.token;
    //     delete user.phone_number_verification.token_valid_until;
    //
    //     return user;
    // });
    //
    // promise = promise.then(function(user) {
    //
    //     user.changelog.push({
    //         timestamp: Date.now(),
    //         by: user._id,
    //         event: 'updated',
    //         description: 'User verified his/her phone number'
    //     });
    //
    //     return user.saveAsync();
    // });
    //
    // promise = promise.get(0).then(function(savedUser) {
    //
    //     return;
    // });
    //
    // return promise;
});

module.exports = api;
