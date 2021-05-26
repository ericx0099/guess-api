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
  socket.on("join-game", (params, callback) => {
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
          socket.join(params.game_token);
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
          } else {
            console.log(res);
          }
        })
        .catch((err) => {
          console.log(err.response.data.errors);
        });
    }
    //  socket.broadcast.to(params.game_token).emit('new_player');
  });

  socket.on("start-game", (params) => {
    const query = {
      query: `
        query{
            canStart(user_id: "${params.user_id}", game_token: "${params.game_token}")
        }
    `,
    };
    axios
      .post("http://localhost:3000/api", query)
      .then((res) => {
        if (res.data.data.canStart) {
          const query = {
            query: `
                query{
                    getQuestion(game_token: "${params.game_token}"){
                        question_text
                        question_id
                        game_round
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
    console.log("params_time=>" + params.time);
    console.log("the_points=>" + the_points);
    if (!question.answer.equals(params.answer)) {
        socket.emit("answer-response", 1)
      the_points = 0;
    } else {
        socket.emit("answer-response", 2)

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
    console.log(mutation);
    axios
      .post("http://localhost:3000/api", mutation)
      .then(async (res) => {
        console.log(res.data.data);
        if (res.data.data.createAnswer) {
          const game = await Game.findOne({ uniq_token: params.game_token });

          let answers = await Promise.all(
            game.answers.map(async function (a) {

              let answer = await Answer.findById(a);
              console.log("answer q =" + answer.question);
              console.log("params q =" + params.question);
              if (answer.question.equals(params.question)) {
                console.log("yesssss");
                return a;
              }else{
                  console.log("not yesssss");
              }
            })
          );
          let filtered_answers = answers.filter(function( element ) {
              return element !== undefined;
          });
          if (filtered_answers.length == game.users.length) {
            const query = {
              query: `
              query{
                  getQuestion(game_token: "${params.game_token}"){
                      question_text
                      question_id
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
                } else {
                  console.log("no next question");
                  console.log(res.response.data.errors);
                }
              })
              .catch((err) => {
                console.log(err.response.data.errors);
              });
          } else {
            console.log("length not equal");
          }
        } else {
          console.log("answer is null");
        }
      })
      .catch((err) => {
        console.log(err);
      });
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
