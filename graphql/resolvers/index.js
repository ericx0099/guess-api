const authResolver = require("./auth");
const gamesResolver = require("./games");

const rootResolver = {
  ...authResolver,
  ...gamesResolver,
};

module.exports = rootResolver;
