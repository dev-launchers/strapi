"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.leaders.search(ctx.query);
    } else {
      entities = await strapi.services.leaders.find(ctx.query);
    }

    return entities.map((entity) => entity.user);
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.leaders.findOne({ id });
    return Object.fromEntries(
      Object.entries(entity).filter(([k, v]) => k == "user" || k == "project")
    );
  },
};
