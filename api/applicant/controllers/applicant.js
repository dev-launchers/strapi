'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');

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

    console.log('new application');

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
      project: applicantProject ? applicantProject : null,
      level
    };

    const entity = await strapi.services.applicant.create(application);
    console.log(entity);

    if (applicantProject){
      const team = applicantProject.team;
      console.log(team);
      if(team.leaders){
        //lets leaders join google group
        team.leaders.forEach(async (leader) => {
          try {
            const id = leader.leader.id ? leader.leader.id : leader.leader;
            const email = leader.leader.email ? leader.leader.email: null;
            console.log(email)
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
