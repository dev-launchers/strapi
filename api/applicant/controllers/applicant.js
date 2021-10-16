'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');
const isNotEmpty = (team) => {
  if((team) && (!(team.length === 0))) {
    return true;
  }
  return false;
};
module.exports = {

  async create(ctx){
    const {
      email,
      name,
      timestamp,
      age,
      role,
      zip,
      skills,
      experience,
      commitment,
      accepted,
      reason,
      project,
      level
    } = ctx.request.body;


    const applicantProject = await strapi.services.project.findOne({ slug: project });

    const application = {
      email,
      name,
      timestamp,
      age,
      role,
      zip,
      skills,
      experience,
      commitment,
      accepted,
      reason,
      project: applicantProject.id,
      level
    };

    const entity = await strapi.services.applicant.create(application);
    const team = applicantProject.team;

    if(isNotEmpty(team.leaders)){
      //lets leaders join google group
      team.leaders.forEach(async (leader) => {
        try {
          const id = leader.leader.id ? leader.leader.id : leader.leader;
          const email = leader.leader.email ? leader.leader.email: null;

          // Send an email to project lead.
          // strapi.services.email.send('strapi-svc@devlaunchers.com', email, 'New applicant notificaton', 'Hi Leaders, {application.name} joined the project {applicantProject.title}.');
          strapi.services.email.send('kuikuigaocn@.com', email, 'New applicant notificaton', 'Hi Leaders, {application.name} joined the project {applicantProject.title}.');
          
        } catch(err) {
          console.error('error: ', err);
        }
      });
    };


    return sanitizeEntity(entity, { model: strapi.models.applicant});
  }
};
