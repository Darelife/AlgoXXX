const mongoose = require("mongoose");

const contestDeltaSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  cfid: String,
  contestDelta: String,
});

module.exports = mongoose.model("ContestDelta", contestDeltaSchema);
