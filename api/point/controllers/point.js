'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */


module.exports = {
  //this allows us to get points via user id
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.point.findOne({ user: id });
    return sanitizeEntity(entity, { model: strapi.models.point });
  },

  //this allows us to update points via user id
  async update(ctx) {
    const { id } = ctx.params;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.point.update({ user: id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.point.update({ user: id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.point });
  },

  async patchBatchPoint(ctx) {
    let updatedPoints = [];
    for (const points of ctx.request.body) {
      const {id, totalPoints, totalSeasonPoints, availablePoints, projectMeetingMinutes} =  points;
      const newCtx = {
        params: {
          id: id
        },
        request: {
          body: {
            totalPoints: totalPoints,
            totalSeasonPoints: totalSeasonPoints,
            availablePoints: availablePoints,
            projectMeetingMinutes: projectMeetingMinutes
          }
        }
      };
      let updated = null;
      try {
        updated = await this.incrementOrDecrementPoint(newCtx);
      } catch(error) {
        // don't quit if encounter errors
        console.log(`Error updating points with error: ${error}`);
      }
      if (updated) {
        updatedPoints.push(updated);
      }
    }
    return updatedPoints;
  },

  async incrementOrDecrementPoint(ctx) {
    const { id } = ctx.params;
    const { totalPoints, totalSeasonPoints, availablePoints, projectMeetingMinutes } = ctx.request.body;

    const currentPoint = await strapi.services.point.findOne({ user: id });

    const newTotalPoints = addPoints(currentPoint.totalPoints, totalPoints);
    const newTotalSeasonPoints = addPoints(currentPoint.totalSeasonPoints, totalSeasonPoints);
    const newAvailablePoints = addPoints(currentPoint.availablePoints, availablePoints);
    const newProjectMeetingMinutes = addPoints(currentPoint.projectMeetingMinutes, projectMeetingMinutes);

    //checks if user input makes currentPoints less than 0
    if (newTotalPoints < 0) {
      throw strapi.errors.badRequest('totalPoints cannot be a negative number that makes the current totalPoints less than 0');
    }
    if (newTotalSeasonPoints < 0) {
      throw strapi.errors.badRequest('totalSeasonPoints cannot be a negative number that makes the current totalSeasonPoints less than 0');
    }
    if (newAvailablePoints < 0) {
      throw strapi.errors.badRequest('availablePoints cannot be a negative number that makes the current availablePoints less than 0');
    }
    if (newProjectMeetingMinutes < 0) {
      throw strapi.errors.badRequest('newProjectMeetingMinutes cannot be a negative number that makes the current newProjectMeetingMinutes less than 0');
    }

    const validatedBody = {
      totalPoints: newTotalPoints,
      totalSeasonPoints: newTotalSeasonPoints,
      availablePoints: newAvailablePoints,
      projectMeetingMinutes: newProjectMeetingMinutes
    };

    const entity = await strapi.services.point.update({ user: id }, validatedBody);
    return sanitizeEntity(entity, { model: strapi.models.point });

  }
};

// helpr function to add points in string together
function addPoints(point1, point2) {
  return Number(point1) + Number(point2);
}
