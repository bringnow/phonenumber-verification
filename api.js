const express = require('express');
const smsController = require('./backends/esendex');

// const PhoneNumberUtil = require('google-libphonenumber').PhoneNumberUtil;
// const phoneUtil = PhoneNumberUtil.getInstance();
//
// const PHONE_NUMBER_VERIFICATION_BLOCK_TIME = 5 * 60 * 1000; // in milliseconds

if (process.env.PHONE_NUMBER_VERIFICATION_DUMMY_CODE_ALLOWED === 'true') {
  console.warn('CAUTION: Dummy phone number verification code 12345 is allowed!');
}

const api = new express.Router();

/**
* Sends a verification code to a given phone number
*
* @param user_id: the user requesting the verification
* @param phone_number: the phone number to verify
* @return Promise
*/
api.post('/', (req, res) => {
  res.status(200);
  res.send();

  // let promise;
  // promise = User.findOne({'phone_number': phone_number, '_id': {'$ne': user_id}}).execAsync().then(function(user) {
  //     if (user) {
  //         throw new errors.PhoneNumberAlreadyExistsException(phone_number);
  //     }
  // });
  //
  // promise = promise.then(function() {
  //     return self.findById(user_id);
  // });
  //
  // promise = promise.then(function(user) {
  //
  //     user.phone_number = phone_number;
  //
  //     user.phone_number_verification = {
  //         token: biguint(crypto.randomBytes(2), 'dec'),
  //         token_valid_until: new Date(Date.now() + 10 * 60 * 1000) // valid 10 minutes
  //     };
  //
  //     return user.saveAsync();
  // });
  //
  // promise = promise.get(0).then(function(savedUser) {
  //
  //     return smsController.sendPhoneNumberVerificationSms(savedUser.phone_number,  savedUser.phone_number_verification.token);
  // });
  //
  // promise = promise.then(function() {
  //
  //     return;
  // });
  //
  // return promise;
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
    //     if(!user.phone_number_verification || !user.phone_number_verification.token) {
    //         throw new errors.PhoneNumberVerificationFailed('No phone number verification requested');
    //     }
    //
    //     if(user.phone_number !== phone_number) {
    //         throw new errors.PhoneNumberVerificationFailed('Phone number to validate does not match stored phone number!');
    //     }
    //
    //     if(!user.phone_number_verification.token_valid_until || user.phone_number_verification.token_valid_until < new Date()) {
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
