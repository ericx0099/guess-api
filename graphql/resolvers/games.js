const bcrypt = require("bcryptjs");

const Game = require("../../models/game");
const User = require("../../models/user");
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
    let rand;
    while(true){
      rand = Math.floor(Math.random() * 10000000);
      const tryGame = await Game.findOne({uniq_token: rand});
      if(!tryGame){
        break;
      }
    }

    const game = new Game({
      uniq_token: rand,
      creator: req.userId,
    });

    let createdGame;
    try {
      const creator = await User.findById(req.userId);
      if (!creator) {
        throw new Error("User not found!");
      }
      game.users.push(creator);
      const number = await Question.countDocuments();
      console.log(number);

      const result = await game.save();
      createdGame = transformGame(result);

      creator.games.push(result);
      await creator.save();
      return createdGame;
    } catch (err) {
      throw err;
    }
  },
  game: async ({_id}) => {
    try {
      const gameFound = await Game.findById(_id);
      return transformGame(gameFound);
    }catch(err){
      throw err;
    }
  }
};
