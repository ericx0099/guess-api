const Country = require("../../models/country");
const User = require("../../models/user");
const { transformCountry } = require("./merge");
module.exports = {
  countries: async () => {
    try{
      const countries = await Country.find();
      return countries.map((country) => {
        return transformCountry(country);
      });
    }catch(err){
      throw err;
    }
  },
  createCountry: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated");
    }
    const country = new Country({
      name: args.countryInput.name,
    });
    const tryCountry = await Country.findOne({name: country.name});
    if(tryCountry){
      throw new Error("This country already Exists");
    }
    let createdCountry;
    try {
      const performer = await User.findById(req.userId);
      if (!performer) {
        throw new Error("User not found!");
      }
      if(!performer.isAdmin){
        throw new Error("Only Administrator can perform this action!");
      }
      const result = await country.save();
      createdCountry = transformCountry(result);
      return createdCountry;
    } catch (err) {
      throw err;
    }
  },
  country: async ({_id}) => {
    try{
      const countryFound = await Country.findById(_id);
      if(!countryFound){
        throw new Error("Country not found");
      }
      return transformCountry(countryFound);
    }catch(err){
      throw err;
    }
  },
  globalRanking: async({}) => {
    try{
      const users = await User.find();
      function compare(a, b) {
        return a.points - b.points;
      }
      users.sort(compare);
      let finalUsers = [];
      for(let i = users.length-1; i>users.length-11;i--){
        if(users[i]){
          finalUsers.push(users[i]);
        }
      }
      return finalUsers
    }catch(err){
      throw err;
    }
  },
  countryRanking: async({country_id}) => {
    try{
      const users = await User.find({country:country_id});
      function compare(a, b) {
        return a.points - b.points;
      }
      users.sort(compare);
      let finalUsers = [];
      for(let i = users.length-1; i>users.length-11;i--){
        if(users[i]){
          finalUsers.push(users[i]);
        }
      }
      return finalUsers
    }catch(err){
      throw err;
    }
  }
};

