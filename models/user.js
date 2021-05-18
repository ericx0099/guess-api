const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: false,
    default: 0,
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: "Country",
  },
  games: [
    //games this user joined
    {
      type: Schema.Types.ObjectId,
      ref: "Game",
    },
  ],
  questions: [
    //Questions submitted by this user
    {
      type: Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  answers: [
    {
      type: Schema.Types.ObjectId,
      ref: "Answer"
    }
  ]
}, {timestamps: true});
module.exports = mongoose.model("User", userSchema);
