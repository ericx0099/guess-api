const mongoose = require("mongoose");
var random = require("mongoose-simple-random");
const Schema = mongoose.Schema;

const gameSchema = new Schema(
  {
    uniq_token: {
      type: String,
      required: true,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    answers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Answer",
      },
    ],
  },
  { timestamps: true }
);
gameSchema.plugin(random);
module.exports = mongoose.model("Game", gameSchema);
