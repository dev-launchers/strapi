'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.project.search(ctx.query);
    } else {
      entities = await strapi.services.project.find(ctx.query);
    }

    return entities.map((entity) => {
      entity.team.leaders = entity.team.leaders.map((leader) => ({
        id: leader.leader.id,
        username: leader.leader.username,
        email: leader.leader.email,
        role: leader.role,
      }));
      entity.team.members = entity.team.members.map((member) => ({
        id: member.member.id,
        username: member.member.username,
        role: member.role,
      }));
      return sanitizeEntity(entity, {model: strapi.models.project});
    });
  },
  async findOne(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.services.project.findOne({ slug }, ['team.leaders.leader.profile', 'team.members.member.profile', 'heroImage','interests','subProjects','opportunities']);
    console.log(entity);
    entity.team.leaders = entity.team.leaders.map((leader) => ({
      id: leader.leader.id,
      username: leader.leader.username,
      profile: leader.leader.profile,
      email: leader.leader.email,
      role: leader.role,
    }));
    entity.team.members = entity.team.members.map((member) => ({
      id: member.member.id,
      username: member.member.username,
      profile: member.member.profile,
      role: member.role,
    }));
    return sanitizeEntity(entity, {model: strapi.models.project});
  },

  async giveGoogleResources(ctx) {
    try {
      const { slug, id } = ctx.params;

      const project = await strapi.services.project.findOne({ slug });

      const { title, description, team } = project;

      const group = await strapi.services['google-manager'].createGroup(description, title);

      await strapi.services.project.giveTeamGroup(team, group);

      //Lets team@devlaunchers.com be owner of the google group to fix google meets auto admit problem
      await strapi.services['google-manager'].joinGroup(group.id, process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_JWT_SUBJECT, 'OWNER');

      const calendar = await strapi.services['google-manager'].createCalendar(title);

      await strapi.services.project.update({ slug }, { calendarId: calendar.id });

      await strapi.services['google-manager'].createEvent(calendar.id, calendar.summary, group.email, id);

      await strapi.services.project.giveTeamAcl(team, calendar.id, group);

      return ctx.send('successfully created google resources');
    } catch(err) {
      console.log('error trying to give project google resources: ', err);
      ctx.send(err, 500);
    }
  },

  async recommendProjectToUsers(ctx) {
    try {
      const { interests } = ctx.state.user;
      const projects = await strapi.services.project.find();
      const recommendedProjectSlugs = [];
      const recommendedProjects = [];

      const getProjectSlugs = (projects, userCategory) => {
        for(const project of projects){
          for(const projectInterest of project.interests){
            for(const projectCategories of projectInterest.categories){
              if((projectCategories.category === userCategory.category) && (!(recommendedProjectSlugs.includes(project.slug)))){
                recommendedProjectSlugs.push(project.slug);
              }
            }
          }
        }
      };

      /*
        This loops through the users interest's categories and compares them
        with the project interest's categories and see if they match
        NOTE: It pushes duplicates into the array so I prevent it from happening by using sets
      */
      for(const interest of interests){
        for(const category of interest.categories){
          getProjectSlugs(projects, category);
        }
      }

      /*
        Using the project slugs, I get the project and add them to
        the recommendedProjects array
      */
      for(const recommendedProjectSlug of recommendedProjectSlugs){
        const recommendedProject = await strapi.services.project.findOne({slug: recommendedProjectSlug});
        recommendedProjects.push(recommendedProject);
      }

      return ctx.send(recommendedProjects);
    } catch(err) {
      console.error(err);
    }
  }
};
