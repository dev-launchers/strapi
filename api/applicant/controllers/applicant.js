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

    const applicantProject = await strapi.query('project').findOne({ slug: project });

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
      project: applicantProject ? applicantProject : null,
      level
    };

    const entity = await strapi.services.applicant.create(application);

    if (applicantProject){
      const team = applicantProject.team;
      console.log(team);
      if(isNotEmpty(team.leaders)){
        //lets leaders join google group
        team.leaders.forEach(async (leader) => {
          try {
            const email = leader.leader.email ? leader.leader.email: null;
            // Send an email to project lead.
            await strapi.services.sendmail.send('kuikuigaocn@gmail.com', email, 'New applicant notificaton', `Hi Leaders, ${application.name} joined the project of "${applicantProject.title}".`);
            
          } catch(err) {
            console.error('error: can not notify the project leader.', err);
          }
        });
      };
    }
    
    return sanitizeEntity(entity, { model: strapi.models.applicant});
  },
};
