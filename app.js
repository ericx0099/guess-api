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
            canStart(user_id: "60abc4d7337be843dcf292b7", game_token: "${params.game_token}")
        }
    `,
    };
    axios
      .post("http://localhost:3000/api", query)
      .then((res) => {
          if(res.data.data.canStart){
            const query = {
                query: `
                    query{
                        
                    }
                `
            }
          }
      })
      .catch((err) => {
        io.sockets
          .in(params.game_token)
          .emit("error", err.response.data.errors[0]);
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
    console.log(err);
  });
