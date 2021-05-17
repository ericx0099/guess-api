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
  country: async (root, {_id}) => {
    try{
      const countryFound = await Country.findOne(_id);
      return transformCountry(countryFound);
    }catch(err){
      throw err;
    }
  }
};

