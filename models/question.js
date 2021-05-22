const mongoose = require("mongoose");
var random = require("mongoose-simple-random");
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
      default: null,
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
questionSchema.plugin(random);
module.exports = mongoose.model("Question", questionSchema);
