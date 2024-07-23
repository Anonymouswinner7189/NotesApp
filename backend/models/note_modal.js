const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noteSchema = new Schema({
  Title: { type: String, required:true },
  Content: { type: String, required:true },
  Tags: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdOn: { type: Date, default: new Date().getTime() },
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
