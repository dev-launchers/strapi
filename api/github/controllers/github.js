'use strict';

const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async listCodeFreq(ctx) {
    const { user, repo } = ctx.params;
    let freq = await strapi.services['github'].repoCodeFreq(user, repo);
    const entity = {
      url: strapi.services['github'].repoURL(user, repo),
      changes: freq,
    };
    return sanitizeEntity(entity, { model: strapi.models.repo });
  },
  async listContributors(ctx) {
    const { user, repo } = ctx.params;
    let contributors = await strapi.services['github'].repoContributors(user, repo);
    const entity = {
      url: strapi.services['github'].repoURL(user, repo),
      contributors: contributors,
    };
    return sanitizeEntity(entity, { model: strapi.models.repo });
  }
};
