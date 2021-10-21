'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  /**
  * Triggered before user creation.
  */
  lifecycles: {
    async afterCreate(result, data) {

      const { title, description, team } = data;

      const group = await strapi.services['google-manager'].createGroup(description, title);

      await strapi.services.project.giveTeamGroup(team, group);

      //Lets strapi-svc@devlaunchers.com be owner of the google group to fix google meets auto admit problem
      await strapi.services['google-manager'].joinGroup(group.id, process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_JWT_SUBJECT, 'OWNER');


      const calendar = await strapi.services['google-manager'].createCalendar(title);

      const calendarId = calendar.id;

      const projectID = result.id;

      // update calendarId to the project according to projectID
      strapi.query('project').update({ id: projectID }, { calendarId });

      await strapi.services['google-manager'].createEvent(calendar.id, calendar.summary, group.email, projectID);

      await strapi.services.project.giveTeamAcl(team, calendar.id, group);
    },
  },
};
