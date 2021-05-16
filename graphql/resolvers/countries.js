const Country = require("../../models/country");

module.exports = {
  createCountry: async (args, res) => {
    if (!res.isAuth) {
      throw new Error("Unauthenticated");
    }
    const country = new Country({
      name: args.countryInput.name,
    });
    let createdCountry;
    try {
      const result = await country.save();
    } catch (err) {
      throw err;
    }
  },
};
