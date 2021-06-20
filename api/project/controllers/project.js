"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.project.search(ctx.query);
    } else {
      entities = await strapi.services.project.find(ctx.query);
    }

    return entities.map((entity) => {
      entity.team.leaders = entity.team.leaders.map((leader) => ({
        id: leader.leader.id,
        name: leader.leader.username,
        email: leader.leader.email,
        role: leader.role,
      }));
      entity.team.members = entity.team.members.map((member) => ({
        id: member.member.id,
        name: member.member.username,
        email: member.member.email,
        role: member.role,
      }));
      return entity;
    });
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.project.findOne({ id });
    entity.team.leaders = entity.team.leaders.map((leader) => ({
      id: leader.leader.id,
      name: leader.leader.username,
      email: leader.leader.email,
      role: leader.role,
    }));
    entity.team.members = entity.team.members.map((member) => ({
      id: member.member.id,
      name: member.member.username,
      email: member.member.email,
      role: member.role,
    }));

    return entity;
  },
};
