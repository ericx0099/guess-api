const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const answerSchema = new Schema({
  answer: {
    type: Schema.Types.ObjectId,
    ref: "Country",
    required: true,
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
  points: {
    type: Number,
    required: true,
    default: 0
  }
});

module.exports = mongoose.model("Answer", answerSchema);
