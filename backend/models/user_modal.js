const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true },
  Password: { type: String, required: true },
  createdOn: { type: Date, default: new Date().getTime() },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
