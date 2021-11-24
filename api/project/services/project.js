'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const _ = require('lodash');

const isNotEmpty = (team) => {
  if((team) && (!(team.length === 0))) {
    return true;
  }
  return false;
};

module.exports = {
  find(params){
    return strapi.query('project').find(params, ['interests', 'interests.categories']);
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

  returnOldTeam(project) {
    const oldLeaders = project.team.leaders.map(leader => ({
      id: leader.id,
      role: leader.role,
      leader: leader.leader.id
    }));

    const oldMembers = project.team.members.map(member => ({
      id: member.id,
      role: member.role,
      member: member.member.id
    }));

    const oldTeam = {
      id: project.team.id,
      leaders: oldLeaders,
      members: oldMembers
    };

    return oldTeam;
  },

  async addNewMembersToGoogleResources(oldTeam, newTeam, calendarId, group){
    const { leaders: oldLeaders, members: oldMembers } = oldTeam;
    const { leaders: newLeaders, members: newMembers} = newTeam;

    if((newMembers.length > oldMembers.length) || (newLeaders.length > oldLeaders.length)){
      const addedMembers = _.differenceBy(newMembers, oldMembers, 'id');
      const addedLeaders = _.differenceBy(newLeaders, oldLeaders, 'id');

      if(addedMembers.length !== 0){
        addedMembers.forEach(async (member) => {
          try {
            const user = await strapi.query('user', 'users-permissions').findOne({ id: member.member });
            await strapi.services['google-manager'].joinGroup(group.id, user.email, 'MEMBER');
            await strapi.services['google-manager'].grantAcl(calendarId, user.email, 'reader', 'user');
          } catch (err) {
            console.error(err);
          }
        });
      }

      if(addedLeaders.length !== 0){
        addedLeaders.forEach(async (leader) => {
          try {
            const user = await strapi.query('user', 'users-permissions').findOne({ id: leader.leader });
            await strapi.services['google-manager'].joinGroup(group.id, user.email, 'OWNER');
            await strapi.services['google-manager'].grantAcl(calendarId, user.email, 'owner', 'user');
          } catch (err) {
            console.error(err);
          }
        });
      }
    }
  }
};
