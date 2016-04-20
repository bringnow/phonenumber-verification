const Promise = require('bluebird');
const request = require('request');
const elementtree = require('elementtree');

class EsendexSmsBackend {

  constructor() {
    this.enabled = true;

    if (process.env.SMS_ENABLED !== 'true') {
      console.warn('SMS dispatching is disabled. Set SMS_ENABLED=true for enabling it.');
      this.enabled = false;
      return;
    }

    // Check configuration
    if (!process.env.ESENDEX_ACCOUNT) {
      console.warn('ESENDEX_ACCOUNT environment variable not defined. Disabling SMS dispatching.');
      this.enabled = false;
    }

    if (!process.env.ESENDEX_USERNAME) {
      console.warn('ESENDEX_USERNAME environment variable not defined. Disabling SMS dispatching.');
      this.enabled = false;
    }

    if (!process.env.ESENDEX_PASSWORD) {
      console.warn('ESENDEX_PASSWORD environment variable not defined. Disabling SMS dispatching.');
      this.enabled = false;
    }
  }

  generatePhoneNumberVerificationRequestBody(phoneNumber, token) {
    const messagesXml = elementtree.Element('messages');
    const accountReferenceXml = elementtree.SubElement(messagesXml, 'accountreference');
    accountReferenceXml.text = process.env.ESENDEX_ACCOUNT;

    const messageXml = elementtree.SubElement(messagesXml, 'message');
    const fromXml = elementtree.SubElement(messageXml, 'from');
    fromXml.text = 'Flocker';

    const toXml = elementtree.SubElement(messageXml, 'to');
    toXml.text = phoneNumber;

    const body = elementtree.SubElement(messageXml, 'body');

    body.text = 'Der Code zur Verifizierung Ihrer Telefonnummer lautet: ' + token;

    const etree = new elementtree.ElementTree(messagesXml);
    return etree.write({ 'xml_declaration': true });
  }

  sendPhoneNumberVerificationSms(phoneNumber, token) {
    const self = this;
    let promise;

    if(!this.enabled) {
      log.warn('SMS dispatching is not enabled. Not sending sms. Would send token ' + token + ' to number ' + phone_number);
      return Promise.resolve();
    }

    promise = new Promise(function(resolve, reject) {

      log.info('Sending phone number verification sms...');

      const options = {
        auth: {
          user: process.env.ESENDEX_USERNAME,
          password: process.env.ESENDEX_PASSWORD
        },
        headers: {
          'Content-Type': 'application/xml'
        }
      };

      const body = self.generatePhoneNumberVerificationRequestBody(phoneNumber, token);

      const req = request.post('https://api.esendex.com/v1.0/messagedispatcher' + process.env.ESENDEX_ACCOUNT + '/SMS/Messages', options, function(err, response, body) {

        if(err) {
          log.error(err);
          reject(err);
        } else {

          if(response.statusCode !== 200) {
            log.error('Sending SMS failed with status code: ' + response.statusCode);
            log.error(response.body);
            reject(response.body);
          } else {
            log.info('SMS sent successfully!');
            resolve(response.body);
          }
        }
      });

      req.write(body);
      req.end();
    });

    promise = promise.then(function(response) {
      log.info('Phone number verification SMS successfully sent');
    });

    promise = promise.catch(function(error) {
      log.error('Failed to send hone number verification SMS:' + error);
    });

    return promise;
  }
}

module.exports = new EsendexSmsBackend();
