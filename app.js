const express = require("express");
const path = require("path");
const bodyParse = require("body-parser");
const graphqlHttp = require("express-graphql").graphqlHTTP;
const mongoose = require("mongoose");
const graphQLSchema = require("./graphql/schema/index");
const graphQLResolvers = require("./graphql/resolvers/index");
const isAuth = require("./middleware/is-auth");
const http = require("http").createServer();
const app = express();
const Country = require("./models/country");
const Question = require("./models/question");
const Answer = require("./models/answer");
const Game = require("./models/game");
const User = require("./models/user");
const socketServer = require("http").Server(app);
const io = require("socket.io")(socketServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(bodyParse.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(isAuth);
socketServer.listen(3333);
app.use(
  "/api",
  graphqlHttp({
    schema: graphQLSchema,
    rootValue: graphQLResolvers,
    graphiql: true,
  })
);
io.on("connection", (socket) => {
  const axios = require("axios");

  socket.on("join-game", async (params, callback) => {
    const game = await Game.findOne({ uniq_token: params.game_token });
    if (game.started) {
      socket.emit("error", "Game already Started");
      return;
    }
    const queryGame = {
      query: `
        query{
            gameByToken(token: "${params.game_token}"){
                _id
            }
        }
    `,
    };
    let error = false;
    axios
      .post("http://localhost:3000/api", queryGame)
      .then((res) => {
        if (res.data.data.gameByToken) {
          let rooms = [params.game_token, params.user_id];
          socket.join(rooms);
        } else {
          socket.emit("error", "Game not found");
          error = true;
        }
      })
      .catch((err) => {
        socket.emit("error", "Game not found");
        error = true;
      });

    if (!error) {
      const query = {
        query: `
        query{
            joinGame(user_id: "${params.user_id}",game_token: "${params.game_token}"){
                creator {
                    _id
                }    
                users{
                    username
                    _id
                }
            }
        }
    `,
      };
      axios
        .post("http://localhost:3000/api", query)
        .then((res) => {
          if (res.data.data.joinGame) {
            io.sockets
              .in(params.game_token)
              .emit("new_player", res.data.data.joinGame);
          }
        })
        .catch((err) => {
          console.log(err.response.data.errors);
        });
    }
    //  socket.broadcast.to(params.game_token).emit('new_player');
  });

  socket.on("start-game", async (params) => {
    const game = await Game.findOne({ uniq_token: params.game_token });
    for (var i = 0; i < game.users.length; i++){
      if (!io.sockets.adapter.rooms[game.users[i]]) {
        game.users.splice(i,game.users.indexOf(game.users[i-1]));
        console.log(game.users[i]);
        console.log("user disconnected");
      }
    }
    await game.save();
    const query = {
      query: `
        query{
            canStart(user_id: "${params.user_id}", game_token: "${params.game_token}")
        }
    `,
    };
    axios
      .post("http://localhost:3000/api", query)
      .then( async (res) => {
        if (res.data.data.canStart) {
          game.user_rounds = game.users.map(function(user){
            return {user: user, round:0}
          });
          await game.save();
          const query = {
            query: `
                query{
                    getQuestion(game_token: "${params.game_token}", userId: "${params.user_id}"){
                        question_text
                        question_id
                        game_round
                        game_rounds
                        countries {
                            name
                            _id
                        }
                        players{
                          username
                          points
                        }
                    }
                }
            `,
          };
          axios
            .post("http://localhost:3000/api", query)
            .then((res) => {
              if (res.data.data.getQuestion) {
                io.sockets
                  .in(params.game_token)
                  .emit("new_question", res.data.data.getQuestion);
              }
            })
            .catch((err) => {
              console.log(err.response.data.errors);
            });
        }
      })
      .catch((err) => {
        io.sockets
          .in(params.game_token)
          .emit("error", err.response.data.errors[0]);
      });
  });

  socket.on("submit-answer", async (params) => {
    let points = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, 0, 0, 0];
    let the_points =
      points[params.time / 10] + Math.floor(Math.random() * 5) + 1;
    /*    */
    let question = await Question.findById(params.question);
    //  let correct_answer = await Country.findById(question.answer);
    if (!question.answer.equals(params.answer)) {
      socket.emit("answer-response", 1);
      the_points = 0;
    } else {
      socket.emit("answer-response", 2);
    }
    const mutation = {
      query: `
       mutation{
         createAnswer(answerInput: {answer: "${params.answer}", question: "${params.question}", user: "${params.userId}", game: "${params.game_token}", points: ${the_points}}){
          _id
        }
       }
      `,
    };
    axios
      .post("http://localhost:3000/api", mutation)
      .then(async (res) => {

        if (res.data.data.createAnswer) {
          const game = await Game.findOne({ uniq_token: params.game_token });
          let answers = await Promise.all(
            game.answers.map(async function (a) {
              let answer = await Answer.findById(a);
              if (answer.question.equals(params.question)) {
                return a;
              }
            })
          );
          let filtered_answers = answers.filter(function (element) {
            return element !== undefined;
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
  socket.on('get-question', async(params) => {
    const query = {
      query: `
              query{
                  getQuestion(game_token: "${params.game_token}", userId: "${params.userId}"){
                      question_text
                      question_id
                      game_round
                      game_rounds
                      countries {
                          name
                          _id
                      }
                      players{
                        username
                        points
                      }
                  }
              }
          `,
    };
    axios
        .post("http://localhost:3000/api", query)
        .then((res) => {
          if (res.data.data.getQuestion) {
            socket.emit('new_question',res.data.data.getQuestion)

          } else {
            const query = {
              query: `
                    query{
                        endGame(game_token: "${params.game_token}"){
                            players{
                                username
                                points
                            }
                        }
                    }
                `,
            };
          }
        })
        .catch((err) => {
          console.log(err.response.data.errors);
        });
  });
  socket.on("kick-user", async (params) => {
    console.log("KICKING USER");
    const game = await Game.findOne({ uniq_token: params.game_token });

    let users = [];
    let usersPopulated = [];
    let promise = await Promise.all(
      game.users.map(async function (u) {
        if (!u.equals(params.userId)) {
          users.push(u);
          usersPopulated.push(await User.findById(u));
        }
      })
    );
    game.users = users;
    await game.save();
    io.sockets.in(params.game_token).emit("user-kicked", usersPopulated);
    io.sockets.in(params.userId).emit("uniq_self_kick", params.userId);
  });
  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.azghc.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`,
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err.response.data.errors);
  });
