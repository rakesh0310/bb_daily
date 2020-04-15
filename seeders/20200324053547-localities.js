'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('cities',[
      { name: "Hyderabad" },
      { name: "Chennai" }
    ], {});
    const cities = await queryInterface.sequelize.query(
      `SELECT  id from cities;`
    );

    const cityRows = cities[0];

    return await queryInterface.bulkInsert('localities',[
      {
        name: "Jubilee Hills",
        city_id: cityRows[0].id
      },
      {
        name: "Gachibowli",
        city_id: cityRows[0].id
      },
      {
        name: "Perungudi",
        city_id: cityRows[1].id
      }
    ], {});
  },

  down: async(queryInterface) => {
    await queryInterface.bulkDelete('localities', null, {});
    await queryInterface.bulkDelete('cities', null, {});
  }
};
