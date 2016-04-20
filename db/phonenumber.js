const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  phone_number: { type: String, required: true, unique: true },
  last_verified: { type: Date },
  blocked_until: {
    type: Date,
  },
  failed_count: {
    type: Number,
  },
  token: {
    type: String,
  },
  token_valid_until: {
    type: Date,
  },
});

const PhoneNumber = mongoose.model('PhoneNumber', schema);

module.exports = PhoneNumber;
