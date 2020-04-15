'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('products', [
      {
        name: "Milk",
        price_cents: "2000",
        category: "Dairy",
        description: "Milk is a nutrient-rich, white liquid food produced by the mammary glands of mammals. It is the primary source of nutrition for infant mammals (including humans who are breastfed) before they are able to digest other types of food.",
        image_url: "https://via.placeholder.com/300x300.png?text=Milk"
      },
      {
        name: "Slim Milk",
        price_cents: "2400",
        category: "Dairy",
        description: "Milk is a nutrient-rich, white liquid food produced by the mammary glands of mammals. It is the primary source of nutrition for infant mammals (including humans who are breastfed) before they are able to digest other types of food.",
        image_url: "https://via.placeholder.com/300x300.png?text=Slim+Milk"
      },
      {
        name: "Mango",
        price_cents: "8000",
        category: "Fruits and Vegetables",
        description: "Mango Fruit",
        image_url: "https://via.placeholder.com/300x250.png?text=Mango"
      }
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('products', null, {});
  }
};
