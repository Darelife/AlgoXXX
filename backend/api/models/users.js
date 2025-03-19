const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  bitsid: String,
  cfid: String,
});

module.exports = mongoose.model("User", userSchema);
