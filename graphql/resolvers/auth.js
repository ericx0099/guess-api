const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const { transformUser } = require('./merge')
module.exports = {
  createUser: (args) => {
    return User.findOne({ email: args.userInput.email })
      .then((user) => {
        if (user) {
          throw new Error("Email already in Use!");
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then((hashedPassword) => {
        const user = new User({
          email: args.userInput.email,
          username: args.userInput.username,
          password: hashedPassword,
        });
        return user.save();
      })
      .then((result) => {
        return transformUser(result);
      })
      .catch((err) => {
        throw err;
      });
  },
  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User does not exist");
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error("Password is incorrect!");
    }
    const token = await jwt.sign(
      { userId: user.id, email: user.email },
      "somesupersecretkey",
      {
        expiresIn: "24h",
      }
    );
    return { userId: user.id, token: token, tokenExpiration: 24 };
  },
};
