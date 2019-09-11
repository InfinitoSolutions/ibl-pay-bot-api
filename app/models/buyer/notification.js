const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const buyer = require('../mongoose').buyer;

const schema = new Schema(
  {
    actor_id: Schema.Types.ObjectId,
    verb: String,
    type: String,
    payload: Schema.Types.Mixed,
    target_id: Schema.Types.Mixed,
    recipient_id: Schema.Types.ObjectId,
    read: Boolean,
    visible: Boolean,
    title: String,
    message: String,
  },
  { timestamps: true }
);

module.exports = buyer.model('Notification', schema);
