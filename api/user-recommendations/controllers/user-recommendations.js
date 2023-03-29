"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const userCount = await strapi.query("user", "users-permissions").count({});

    // gets 100 random user ids
    const randomUserIds = Array(100)
      .fill()
      .map(() => parseInt(Math.random() * userCount) + 1);

    const currentUserInterests = new Set();

    for (const interest of ctx.state.user.interests) {
      currentUserInterests.add(interest.id);
    }

    let users = await strapi
      .query("user", "users-permissions")
      .find({ id_in: randomUserIds });

    // keeps track of the similarity score of each user
    const userScores = new Map();

    for (const user of users) {
      if (user != null) {
        let numMatches = 0;

        for (const interest of user.interests) {
          if (currentUserInterests.has(interest.id)) {
            numMatches++;
          }
        }

        userScores.set(user.id, numMatches);
      }
    }

    // sort greatest to least based on similarity score
    users.sort((a, b) => userScores.get(b.id) - userScores.get(a.id));
    users = users.slice(0, 6);

    const topScores = [];

    for (const user of users) {
      topScores.push(userScores.get(user.id));
    }

    return { users: users.slice(0, 6), scores: topScores };
  },
};
