'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const isNotEmpty = (team) => {
  if((team) && (!(team.length === 0))) {
    return true;
  }
  return false;
};

module.exports = {
  find(params){
    return strapi.query('project').find(params, ['interests', 'interests.categories','heroImage','subProjects', 'opportunities','opportunities.skills']);
  },

  async giveTeamGroup(team, group) {
    if(isNotEmpty(team.leaders)){
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

    if(isNotEmpty(team.members)) {
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
    if(isNotEmpty(team.leaders)){
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
  },
};
