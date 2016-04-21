const request = require('request');
const elementtree = require('elementtree');

const VOICE_MESSAGE_RETRIES = 3;

class EsendexBackend {

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

  generateRequestBody(from, phoneNumber, messageText, type, language) {
    const messagesEl = new elementtree.Element('messages');

    const accountReferenceEl = new elementtree.SubElement(messagesEl, 'accountreference');
    accountReferenceEl.text = process.env.ESENDEX_ACCOUNT;

    const messageEl = new elementtree.SubElement(messagesEl, 'message');

    const fromEl = new elementtree.SubElement(messageEl, 'from');
    fromEl.text = from;

    const toEl = new elementtree.SubElement(messageEl, 'to');
    toEl.text = phoneNumber;

    const bodyEl = new elementtree.SubElement(messageEl, 'body');
    bodyEl.text = messageText;

    if (type === 'Voice') {
      const typeEl = new elementtree.SubElement(messageEl, 'type');
      typeEl.text = 'Voice';

      const langEl = new elementtree.SubElement(messageEl, 'lang');
      langEl.text = language;

      const retriesEl = new elementtree.SubElement(messageEl, 'retries');
      retriesEl.text = VOICE_MESSAGE_RETRIES;
    }

    const etree = new elementtree.ElementTree(messagesEl);
    return etree.write({ xml_declaration: true });
  }

  sendMessage(from, phoneNumber, messageText, type, language) {
    const self = this;
    let promise;

    if (!this.enabled) {
      console.warn(
        `Dispatching disabled. Not sending voice message. Would send to number ${phoneNumber}`);
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

      const body = self.generateRequestBody(from, phoneNumber, messageText, type, language);
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

    promise = promise.then(() => {
      console.info('Phone number verification SMS successfully sent');
    });

    promise = promise.catch((error) => {
      console.error(`Failed to send hone number verification SMS: ${error}`);
    });

    return promise;
  }
}

module.exports = new EsendexBackend();
