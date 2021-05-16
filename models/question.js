const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    image_url: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
    answer: {
      type: Schema.Types.ObjectId,
      ref: "Country",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);
