const Game = require("../../models/game");
const User = require("../../models/user");
const Answer = require("../../models/answer");
const Country = require("../../models/country");
const Question = require("../../models/question");

const user = async (userId) => {
  try {
    const user = await User.findById(userId);
    return transformUser(user);
  } catch (err) {
    throw err;
  }
};

const country = async (countryId) => {
  try {
    const country = await Country.findById(countryId);
    return transformCountry(country);
  } catch (err) {
    throw err;
  }
};

const question = async (questionId) => {
  try {
    const question = await Question.findById(questionId);
    return transformQuestion(question);
  } catch (err) {
    throw err;
  }
};
const game = async (gameId) => {
  try {
    const game = await Game.findById(gameId);
    return transformGame(game);
  } catch (err) {
    throw err;
  }
};

const answers = async (answersIds) => {
  try {
    const answers = await Answer.find({ _id: { $in: answersIds } });
    return answers.map((answer) => {
      return transformAnswer(answer);
    });
  } catch (err) {
    return err;
  }
};

const users = async (usersIds) => {
  try {
    const users = await User.find({ _id: { $in: usersIds } });
    return users.map((user) => {
      return transformUser(user);
    });
  } catch (err) {
    throw err;
  }
};

const games = async (gamesIds) => {
  try {
    const games = await Game.find({ _id: { $in: gamesIds } });
    return games.map((game) => {
      return transformGame(game);
    });
  } catch (err) {
    throw err;
  }
};

const questions = async (questionsIds) => {
  try {
    const questions = await Question.find({ _id: { $in: questionsIds } });
    return questions.map((question) => {
      return transformQuestion(question);
    });
  } catch (err) {
    throw err;
  }
};

const transformCountry = (country) => {
  return {
    ...country._doc,
    _id: country.id,
    users: users.bind(this, country._doc.users),
  };
};

const transformGame = (game) => {
  return {
    ...game._doc,
    _id: game.id,
    createdAt: new Date(game._doc.createdAt).toISOString(),
    updatedAt: new Date(game._doc.updatedAt).toISOString(),
    creator: user.bind(this, game._doc.creator),
    questions: questions.bind(this, game._doc.questions),
    answers: answers.bind(this, game._doc.answer),
    users: users.bind(this, game._doc.users),
  };
};

const transformQuestion = (question) => {
  return {
    ...question._doc,
    _id: question.id,
    createdAt: new Date(question._doc.createdAt).toISOString(),
    updatedAt: new Date(question._doc.updatedAt).toISOString(),
    answer: country.bind(this, question._doc.answer),
    creator: user.bind(this, question._doc.creator),
  };
};

const transformUser = (user) => {
  return {
    ...user._doc,
    _id: user.id,
    country: country.bind(this, user._doc.country),
    games: games.bind(this, user._doc.games),
    questions: questions.bind(this, user._doc.questions),
    password: null,
    createdAt: new Date(user._doc.createdAt).toISOString(),
    updatedAt: new Date(user._doc.updatedAt).toISOString(),
  };
};

const transformAnswer = (answer) => {
  return {
    ...answer._doc,
    _id: answer.id,
    answer: country.bind(this, answer._doc.answer),
    question: question.bind(this, answer._doc.question),
    game: game.bind(this, answer._doc.game),
    user: user.bind(this, answer._doc.user),
  };
};

exports.transformGame = transformGame;
exports.transformQuestion = transformQuestion;
exports.transformUser = transformUser;
exports.transformCountry = transformCountry;
exports.transformAnswer = transformAnswer;
