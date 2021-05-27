const bcrypt = require("bcryptjs");

const Game = require("../../models/game");
const User = require("../../models/user");
const Question = require("../../models/question");
const Country = require("../../models/country");
const Answer = require("../../models/answer");
const { transformGame, transformQuestion } = require("./merge");
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
      started: false
    });

    let createdGame;
    try {
      const creator = await User.findById(req.userId);
      if (!creator) {
        throw new Error("User not found!");
      }
      /*game.users.push(creator);*/

      const number = await Question.countDocuments();
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
        return "Unknown PIN";
      } else {
        return transformGame(game);
      }
    } catch (err) {
      throw err;
    }
  },
  joinGame: async ({ user_id, game_token }) => {

    try {
      console.log(user_id);
      const user = await User.findById(user_id);
      if (!user) {
        throw new Error("User not found");
      }
      const game = await Game.findOne({ uniq_token: game_token });
      if (!game) {
        return "Incorrect Game PIN";
      }
      let out = true;
      game.users.forEach(function(u){
        if(u.equals(user_id)){
          out = false
        }
      });
      if(out){
        game.users.push(user);
        user.games.push(game);
      }
      const res = await game.save();
      await user.save();

      return transformGame(res);
    } catch (err) {
      throw err;
    }
  },
  canStart: async ({ user_id, game_token }) => {
    try {
      const user = await User.findById(user_id);
      if (!user) {
        throw new Error("User not found");
      }
      const game = await Game.findOne({ uniq_token: game_token });
      if (!game) {
        return "Incorrect Game PIN";
      }
      return !!game.creator._id.equals(user._id);
    } catch (err) {
      throw err;
    }
  },
  getAnswerPoints: async ({ game_id, game_token }) => {
    try {
      const query = {
        query: `
          query{
            game(token: "${game_token}"){
              answers{
                points
                user{
                  _id
                }
              }
            }
          }
        `,
      };
    } catch (err) {
      throw err;
    }
  },
  getQuestion: async ({ game_token }) => {
    try {
      const game = await Game.findOne({ uniq_token: game_token });
      if (game.current_question == 6) {
        //throw new Error("Game Ended");

        let players = await Promise.all(
          game.users.map(async function (u) {
            let user = await User.findById(u);
            let points = 0;
            let x = await Promise.all(
              game.answers.map(async function (a) {
                let answer = await Answer.findById(a);
                if (answer.user.equals(user._id)) {
                  points = points + answer.points;
                }
              })
            );

            return { username: user.username, points: points };
          })
        );
        players.sort(compare);
        return {
          players: players.reverse(),
          question_text: "end",
          question_id: "end",
          countries: [],
          game_round: 0,
          game_rounds: 0
        };
      }
      const question = await Question.findById(
        game.questions[game.current_question]
      );

      const answer = await Country.findById(question.answer);
      const number = await Country.countDocuments();
      let countries = [];
      while (true) {
        let country = await Country.findOne().skip(
          Math.floor(Math.random() * number)
        );
        if (country._id.equals(answer._id)) {
          continue;
        }
        countries.push(country);
        if (countries.length == 3) {
          break;
        }
      }
      let players;
      if (game.answers.length > 0) {
        players = await Promise.all(
          game.users.map(async function (u) {
            let user = await User.findById(u);
            let points = 0;
            let x = await Promise.all(
              game.answers.map(async function (a) {
                let answer = await Answer.findById(a);
                if (answer.user.equals(user._id)) {
                  points = points + answer.points;
                }
              })
            );

            return { username: user.username, points: points };
          })
        );
      } else {
        players = await Promise.all(
          game.users.map(async function (u) {
            let user = await User.findById(u);
            return { username: user.username, points: 0 };
          })
        );
      }


      countries.push(answer);
      game.current_question++;
      game.started = true;
      console.log("game_round--"+game.current_question);
      console.log("questions.length--"+game.questions.length)
      await game.save();
     /* await players.sort((a,b) => (a.points > b.points) ? 1 : ((b.points > a.points) ? -1 : 0))*/
      function compare(a, b) {
        return a.points - b.points;
      }
      players.sort(compare);
      return {
        question_text: question.text,
        question_id: question._id,
        countries: countries.sort(() => Math.random() - 0.5),
        players: players.reverse(),
        game_round: game.current_question,
        game_rounds: game.questions.length
      };
    } catch (err) {
      throw err;
    }
  },
};
