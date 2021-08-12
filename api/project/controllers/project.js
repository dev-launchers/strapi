'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

const TEAM_EMAIL = 'team@devlaunchers.com';

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
    const { slug } = ctx.params;

    const entity = await strapi.services.project.findOne({ slug });
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
      //formats email based on the title of the project
      const formatedEmail = strapi.services['google-manager'].formatEmail(title);

      const group = await strapi.services['google-manager'].createGroup(`${formatedEmail}@devlaunchers.com`, description, title);
      await strapi.services['google-manager'].joinGroup(group.id, 'alejandroarmas@devlaunchers.com', 'OWNER');

      if(!Object.keys(team).length === 0) {
        //lets leaders join google group
        team.leaders.forEach(async (leader) => {
          try {
            const user = await strapi.query('user', 'users-permissions').findOne({id: leader.leader.id});

            await strapi.services['google-manager'].joinGroup(group.id, user.email, 'OWNER');
          } catch(err) {
            console.error('error letting leaders join google group: ', err);
          }
        });

        //lets members join google group
        team.members.forEach(async (member) => {
          try {
            const user = await strapi.query('user', 'users-permissions').findOne({id: member.member.id});

            await strapi.services['google-manager'].joinGroup(group.id, user.email, 'MEMBER');
          } catch(err) {
            console.error('error letting members join google group: ', err);
          }
        });
      }


      //Lets team@devlaunchers.com be owner of the google group to fix google meets auto admit problem
      await strapi.services['google-manager'].joinGroup(group.id, TEAM_EMAIL, 'OWNER');

      const calendar = await strapi.services['google-manager'].createCalendar(title);

      await strapi.services.project.update({ slug }, { calendarId: calendar.id });

      await strapi.services['google-manager'].createEvent(calendar.id, calendar.summary, group.email);

      if(!Object.keys(team).length === 0) {
        //gives project leads owner acl of calendar
        team.leaders.forEach(async (leader) => {
          try {
            const user = await strapi.query('user', 'users-permissions').findOne({id: leader.leader.id});

            await strapi.services['google-manager'].grantAcl(calendar.id, user.email, 'owner', 'user');
          } catch(err) {
            console.error(err);
          }
        });
      }

      //gives the remainder of the google group reader acl for the calendar
      await strapi.services['google-manager'].grantAcl(calendar.id, group.email, 'reader', 'group');

      return ctx.send('successfully created google resources');
    } catch(err) {
      console.log('error trying to give project google resources: ', err);
      ctx.send(err, 500);
    }
  }
};
