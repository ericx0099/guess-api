const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const answerSchema = new Schema({
  answer: {
    type: Schema.Types.ObjectId,
    ref: "Country",
    required: false,
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: "Question",
  },
  game: {
    type: Schema.Types.ObjectId,
    ref: "Game",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Answer", answerSchema);
