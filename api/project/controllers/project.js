'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

const TEAM_EMAIL = process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_JWT_SUBJECT;

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
        role: member.role,
      }));
      return sanitizeEntity(entity, {model: strapi.models.project});
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
      role: member.role,
    }));
    return sanitizeEntity(entity, {model: strapi.models.project});
  },

  async giveGoogleResources(ctx) {
    try {
      const { slug } = ctx.params;

      const project = await strapi.services.project.findOne({ slug });

      const { title, description, team } = project;

      const group = await strapi.services['google-manager'].createGroup(description, title);

      await strapi.services.project.giveTeamGroup(team, group);

      //Lets team@devlaunchers.com be owner of the google group to fix google meets auto admit problem
      await strapi.services['google-manager'].joinGroup(group.id, TEAM_EMAIL, 'OWNER');

      const calendar = await strapi.services['google-manager'].createCalendar(title);

      await strapi.services.project.update({ slug }, { calendarId: calendar.id });

      await strapi.services['google-manager'].createEvent(calendar.id, calendar.summary, group.email);

      await strapi.services.project.giveTeamAcl(team, calendar, group);

      return ctx.send('successfully created google resources');
    } catch(err) {
      console.log('error trying to give project google resources: ', err);
      ctx.send(err, 500);
    }
  }
};
