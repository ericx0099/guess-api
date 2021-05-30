const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const Game = require("../../models/game");
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
          isAdmin: args.userInput.isAdmin,
          country: args.userInput.country
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
  user: async({_id}) => {
    const user = await User.findById(_id);
    if(!user){
      throw new Error("User not found");
    }
    return transformUser(user);
  },
  me: async (args, req) => {
    if(!req.isAuth){
      throw new Error("Unauthenticated");
    }
    try{
      const user = await User.findById(req.userId);
      if(!user){
        throw new Error("Wrong Credentials/Token");
      }
      return transformUser(user);
    }catch(err){
      throw err;
    }
  },
  users: async () => {
    try{
      const users = await User.find();
      return users.map((user) => {
        return transformUser(user);
      });
    }catch(err){
      throw err;
    }
  },
  changeUsername: async(args, req) => {
    if(!req.isAuth){
      throw new Error("Unauthenticated");
    }
    try{
      var user = await User.findById(req.userId);
      if(!user){
        throw new Error("User not Found");
      }
      user.username = args.username
      await user.save();
      return transformUser(user);
    }catch(err){
      throw err;
    }
  },
  changeEmail: async(args, req) => {
    if(!req.isAuth){
      throw new Error("Unauthenticated");
    }
    try{
      var user = await User.findById(req.userId);
      if(!user){
        throw new Error("User not Found");
      }
      let tryEmail = await User.findOne({email: args.email});
      if(tryEmail){
        throw new Error("Email already in Use!");
      }
      user.email = args.email
      await user.save();
      return transformUser(user);
    }catch(err){
      throw err;
    }
  },
  changePassword: async(args, req) => {
    if(!req.isAuth) throw new Error("Unauthenticated");
    try{
      var user = await User.findById(req.userId);
      if(!user) throw new Error('Unauthenticated');
      let pass = await bcrypt.hash(args.password, 12)
      user.password = pass;
      let res = await user.save();

      return transformUser(res);
    }catch(err){
      throw err;
    }
  },
  lastGames: async(args,req) => {
    if(!req.isAuth) throw new Error("Unauthenticated");
    try{
      const user = await User.findById(req.userId);
      if(!user) throw new Error("User not found");
      let games = [];
      for(let i = user.games.length-1; i>user.games.length-11;i--){
        if(user.games[i]){
          let game = await Game.findById(user.games[i]);
          games.push(game);
        }
      }

      let return_games = games.map(function(g){
        console.log(g);
        return {_id: g._id, createdAt:new Date(g.createdAt).toISOString()}
      });

      return return_games;


    }catch(err){
      throw err
    }
  }
};
