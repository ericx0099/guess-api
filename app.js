const express = require("express");
const bodyParse = require("body-parser");
const graphqlHttp = require("express-graphql").graphqlHTTP;
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Game = require("./models/game");

const app = express();

app.use(bodyParse.json());

app.use(
  "/api",
  graphqlHttp({
    schema: buildSchema(`
        type Game {
            _id: ID!
            uniq_token: String!
            creation_date: String!
        }
    
        input GameInput{
            uniq_token: String!
            creation_date: String!
        }
        
        type RootQuery{
            games: [Game!]!
        }
        
        type RootMutation{
            createGame(gameInput: GameInput): Game
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      games: () => {
        return Game.find()
          .then((games) => {
            return games.map((game) => {
              return { ...game._doc, _id: game.id };
            });
          })
          .catch((err) => {
            throw err;
          });
      },
      createGame: args => {
        const game = new Game({
          uniq_token: args.gameInput.uniq_token,
          creation_date: new Date(args.gameInput.creation_date),
        });
        return game
          .save()
          .then((result) => {
            return { ...game._doc };
          })
          .catch((err) => {
            throw err;
          });
      },
    },
    graphiql: true,
  })
);
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.azghc.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`,
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    app.get("/", (req, res, next) => {
      res.send("Hello World");
    });
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
