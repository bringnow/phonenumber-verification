const request = require('request');
const elementtree = require('elementtree');

class EsendexSmsBackend {

  constructor() {
    this.enabled = true;

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

  generateRequestBody(phoneNumber, messageText) {
    const messagesXml = new elementtree.Element('messages');
    const accountReferenceXml = new elementtree.SubElement(messagesXml, 'accountreference');
    accountReferenceXml.text = process.env.ESENDEX_ACCOUNT;

    const messageXml = new elementtree.SubElement(messagesXml, 'message');
    const fromXml = new elementtree.SubElement(messageXml, 'from');
    fromXml.text = 'Flocker';

    const toXml = new elementtree.SubElement(messageXml, 'to');
    toXml.text = phoneNumber;

    const body = new elementtree.SubElement(messageXml, 'body');

    body.text = messageText;

    const etree = new elementtree.ElementTree(messagesXml);
    return etree.write({ xml_declaration: true });
  }

  sendSMS(from, phoneNumber, messageText) {
    const self = this;
    let promise;

    if (!this.enabled) {
      console.warn(
        `SMS dispatching is not enabled. Not sending sms. Would send to number ${phoneNumber}`);
      return Promise.resolve();
    }

    promise = new Promise((resolve, reject) => {
      console.info('Sending phone number verification sms...');

      const options = {
        auth: {
          user: process.env.ESENDEX_USERNAME,
          password: process.env.ESENDEX_PASSWORD,
        },
        headers: {
          'Content-Type': 'application/xml',
        },
      };

      const body = self.generateRequestBody(phoneNumber, messageText);
      const url = `https://api.esendex.com/v1.0/messagedispatcher${process.env.ESENDEX_ACCOUNT}/SMS/Messages`;

      const req = request.post(url, options, (err, response) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          if (response.statusCode !== 200) {
            console.error(`Sending SMS failed with status code: ${response.statusCode}`);
            console.error(response.body);
            reject(response.body);
          } else {
            console.info('SMS sent successfully!');
            resolve(response.body);
          }
        }
      });

      req.write(body);
      req.end();
    });

    promise = promise.tap(() => {
      console.info('Phone number verification SMS successfully sent');
    });

    promise = promise.catch((error) => {
      console.error(`Failed to send hone number verification SMS: ${error}`);
    });

    return promise;
  }
}

module.exports = new EsendexSmsBackend();
