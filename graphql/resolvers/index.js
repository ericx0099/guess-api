const authResolver = require("./auth");
const gamesResolver = require("./games");
const countryResolver = require("./countries");
const answerResolver = require("./answers");
const questionResolver = require('./questions');
const rootResolver = {
  ...authResolver,
  ...gamesResolver,
  ...countryResolver,
  ...answerResolver,
  ...questionResolver
};

module.exports = rootResolver;
