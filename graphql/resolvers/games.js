const bcrypt = require("bcryptjs");

const Game = require("../../models/game");
const User = require("../../models/user");
const Answer = require("../../models/answer");
const Country = require("../../models/country");
const Question = require("../../models/question");
const { transformGame } = require("./merge");
var random = require("mongoose-simple-random");

module.exports = {
  games: async () => {
    try {
      const games = await Game.find();
      return games.map((game) => {
        return transformGame(game);
      });
    } catch (err) {
      throw err;
    }
  },
  createGame: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    const game = new Game({
      uniq_token: args.gameInput.uniq_token,
      creator: req.userId,
    });

    let createdGame;
    try {
      const creator = await User.findById(req.userId);
      if (!creator) {
        throw new Error("User not found!");
      }
      game.users.push(creator);
      const questions = await Question.findRandom(
        {},
        {},
        { limit: 10 },
        function (err, questions) {
          if (!err) {
            questions.forEach(function (question) {
              game.questions.push(question);
            });
          }
        }
      );

      const result = await game.save();
      createdGame = transformGame(result);

      creator.games.push(game);
      await creator.save();
      return createdGame;
    } catch (err) {
      throw err;
    }
  },
};
