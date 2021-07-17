'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */


function userFacingMeets(internalMeet) {
  return {
    name: internalMeet.name,
    meetingCode: internalMeet.meetingCode,
  };
}

module.exports = {
  async findOne(ctx) {
    const { name } = ctx.params;
    const meet = await strapi.services['google-meets'].findOne({ name: name });
    const entity = userFacingMeets(meet);

    return sanitizeEntity(entity, { model: strapi.models.repo });
  }
};
