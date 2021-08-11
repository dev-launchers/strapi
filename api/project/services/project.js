'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async giveTeamGroup(team, group) {
    if(team.leaders){
      //lets leaders join google group
      team.leaders.forEach(async (leader) => {
        try {
          const id = leader.leader.id ? leader.leader.id : leader.leader;
          const user = await strapi.query('user', 'users-permissions').findOne({ id });

          await strapi.services['google-manager'].joinGroup(group.id, user.email, 'OWNER');
        } catch(err) {
          console.error('error letting leaders join google group: ', err);
        }
      });
    }

    if(team.members) {
      //lets members join google group
      team.members.forEach(async (member) => {
        try {
          const id = member.member.id ? member.member.id : member.member;
          const user = await strapi.query('user', 'users-permissions').findOne({ id });

          await strapi.services['google-manager'].joinGroup(group.id, user.email, 'MEMBER');
        } catch(err) {
          console.error('error letting members join google group: ', err);
        }
      });
    }
  },

  async giveTeamAcl(team, calendarId, group) {
    if(team.leaders){
      //gives project leads owner acl of calendar
      team.leaders.forEach(async (leader) => {
        try {
          const id = leader.leader.id ? leader.leader.id : leader.leader;
          const user = await strapi.query('user', 'users-permissions').findOne({ id });

          await strapi.services['google-manager'].grantAcl(calendarId, user.email, 'owner', 'user');
        } catch(err) {
          console.error(err);
        }
      });
    }

    //gives the remainder of the google group reader acl for the calendar
    await strapi.services['google-manager'].grantAcl(calendarId, group.email, 'reader', 'group');
  }
};
