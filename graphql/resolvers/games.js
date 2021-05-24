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
    while (true) {
      rand = Math.floor(Math.random() * 10000000);
      const tryGame = await Game.findOne({ uniq_token: rand });
      if (!tryGame) {
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
      /*game.users.push(creator);*/

      const number = await Question.countDocuments();
      let randoms = [];
      let num = 5;
      while (true) {
        let random = Math.floor(Math.random() * number);
        let question = await Question.findOne().skip(random);
        let contains = false;
        if (game.questions.length > 0) {
          game.questions.forEach(function (q) {
            if (q._id.equals(question._id)) contains = true;
          });
        } else {
          game.questions.push(question);
          contains = true;
        }
        if (!contains) {
          game.questions.push(question);
        }
        if (game.questions.length == 6) {
          break;
        }
      }

      const result = await game.save();
      createdGame = transformGame(result);

      creator.games.push(result);
      await creator.save();
      return createdGame;
    } catch (err) {
      throw err;
    }
  },
  game: async ({ _id }) => {
    try {
      const gameFound = await Game.findById(_id);
      return transformGame(gameFound);
    } catch (err) {
      throw err;
    }
  },
  gameByToken: async ({ token }) => {
    try {
      const game = await Game.findOne({ uniq_token: token });
      if (!game) {
        return "Unknown PIN"
      }else{
        return transformGame(game)
      }

    } catch (err) {
      throw err;
    }
  },
  joinGame: async ({user_id, game_token}) => {
    try{
      const user = await User.findById(user_id);
      if(!user){
        throw new Error("User not found");
      }
      const game = await Game.findOne({uniq_token: game_token});
      if(!game){
        return "Incorrect Game PIN";
      }

      game.users.push(user);
      user.games.push(game)
      const res = await game.save();
      await user.save();

      return transformGame(res);

    }catch(err){
      throw err;
    }
  },
  canStart: async({user_id, game_token}) => {
    try{
      const user = await User.findById(user_id);
      if(!user){
        throw new Error("User not found");
      }
      const game = await Game.findOne({uniq_token: game_token});
      if(!game){
        return "Incorrect Game PIN";
      }
      return !!game.creator._id.equals(user._id);
    }catch(err){
      throw err;
    }
  }
};
