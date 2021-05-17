const authResolver = require("./auth");
const gamesResolver = require("./games");
const countryResolver = require("./countries");
const rootResolver = {
  ...authResolver,
  ...gamesResolver,
  ...countryResolver
};

module.exports = rootResolver;
