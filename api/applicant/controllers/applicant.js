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

    return sanitizeEntity(entity, { model: strapi.models.applicant})
  }
};
