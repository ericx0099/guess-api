const express = require("express");
const path = require("path");
const bodyParse = require("body-parser");
const graphqlHttp = require("express-graphql").graphqlHTTP;
const mongoose = require("mongoose");
const graphQLSchema = require("./graphql/schema/index");
const graphQLResolvers = require("./graphql/resolvers/index");
const isAuth = require("./middleware/is-auth");
const http = require('http').createServer();
const app = express();

const socketServer = require('http').Server(app);
const io = require("socket.io")(socketServer, {  cors: {    origin: "*",    methods: ["GET", "POST"]  }});


app.use(bodyParse.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method === 'OPTIONS'){
    return res.sendStatus(200);
  }
  next();
})
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
io.on('connection', (socket) => {

    console.log("Connected to the web server socket");

    onTest();
    // Handle a test event from the client
    function onTest(data) {
        socket.emit('test', "Cheers, ");
    }

 /*   socket.on('createGame', (message) => {

    });*/

    socket.on('disconnect', () => {
        console.log("disconnected");
    })
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
