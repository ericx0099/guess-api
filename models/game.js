const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const gameSchema = new Schema({
    uniq_token: {
        type: String,
        required: true
    },
    creation_date: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model("Game", gameSchema);
