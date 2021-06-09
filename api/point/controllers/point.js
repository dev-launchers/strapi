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

    const entity = await strapi.services.point.findOne({ user: id })
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

  async incrementOrDecrementPoint(ctx){
    const { id } = ctx.params;
    const { totalPoints, totalSeasonPoints, availablePoints } = ctx.request.body;

    const currentPoint = await strapi.services.point.findOne({ user: id });

    const newTotalPoints = currentPoint.totalPoints + totalPoints;
    const newTotalSeasonPoints = currentPoint.totalSeasonPoints + totalSeasonPoints;
    const newAvailablePoints = currentPoint.availablePoints + availablePoints;

    //checks if user input makes currentPoints less than 0
    if(newTotalPoints < 0){
      throw strapi.errors.badRequest("totalPoints can't be a negative number that makes the current totalPoints less than 0");
    }
    if(newTotalSeasonPoints < 0){
      throw strapi.errors.badRequest("totalSeasonPoints can't be a negative number that makes the current totalSeasonPoints less than 0");
    }
    if(newAvailablePoints < 0){
      throw strapi.errors.badRequest("availablePoints can't be a negative number that makes the current availablePoints less than 0");
    }

    const validatedBody = {
      totalPoints: newTotalPoints,
      totalSeasonPoints: newTotalSeasonPoints,
      availablePoints: newAvailablePoints
    }

    const entity = await strapi.services.point.update({ user: id }, validatedBody);
    return sanitizeEntity(entity, { model: strapi.models.point });

  }
};
