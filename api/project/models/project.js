'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const _ = require('lodash');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook(
  process.env.OPEN_POSITIONS_DISCORD_WEBHOOK || 'Alejandro hack'
);

const formatJSON = (jsonData) => {
  return `\`\`\`JSON\n${JSON.stringify(jsonData, null, 1)}\n\`\`\``;
};

module.exports = {
  lifecycles: {
    async beforeUpdate(params, data) {
      try {
        let projectBeforeModification = await strapi
          .query('project')
          .findOne(params, ['heroImage', 'heroImage.formats']);

        // We're concatenating the openPositions before and after the modification in one array then we filter out the duplication
        const concatinated = [
          ...projectBeforeModification.openPositions,
          ...data.openPositions,
        ]
          .filter(
            (v, i, a) =>
              a.findIndex(
                (t) =>
                  t.id === v.id &&
                  t.title === v.title &&
                  t.description === v.description &&
                  t.isHidden === v.isHidden
              ) === i
          )
          .slice(projectBeforeModification.openPositions.length);

        // We're only showing the modified fields before modification in an array
        const modifiedFieldsBeforeModification = [];
        projectBeforeModification.openPositions.forEach((b4Pos) => {
          concatinated.forEach((afterPos) => {
            b4Pos.id === afterPos.id &&
              (b4Pos.title !== afterPos.title ||
                b4Pos.description !== afterPos.description) &&
              modifiedFieldsBeforeModification.push(b4Pos);
          });
        });

        const deletedFields = _.differenceBy(
          projectBeforeModification.openPositions,
          data.openPositions,
          'id'
        );

        if (
          !_.isEqual(
            projectBeforeModification.openPositions,
            data.openPositions
          ) &&
          process.env.NODE_ENV == 'production'
        ) {
          const embedBeforeModification = new MessageBuilder()
            .setTitle(`${projectBeforeModification.title} Project Page`)
            .setURL(
              `${process.env.FRONTEND_URL}/projects/${projectBeforeModification.slug}`
            )
            .setDescription(
              `*someone* **__UPDATED__** the open roles => [Link to the strapi page](${
                process.env.URL
              }/admin/plugins/content-manager/collectionType/application::project.project/${
                params.id
              })\n**Before Modification**${formatJSON(
                modifiedFieldsBeforeModification
              )}`
            )
            .setColor(15258703);

          const embedUpdatedFields = new MessageBuilder()
            .setTitle('**Updated Fields**')
            .setDescription(
              formatJSON(concatinated.filter((pos) => pos.id && !pos.isHidden))
            )
            .setColor(16744206);

          const embedAddedFields = new MessageBuilder()
            .setTitle('**Added Fields**')
            .setDescription(formatJSON(concatinated.filter((pos) => !pos.id)))
            .setColor(8504279);

          const embedDeletedFields = new MessageBuilder()
            .setTitle('**Deleted/Hidden Fields**')
            .setDescription(
              formatJSON([
                ...deletedFields,
                ...concatinated.filter((pos) => pos.isHidden),
              ])
            )
            .setColor(12956064);

          hook.setUsername(`${projectBeforeModification.title} Notifier`);
          hook.setAvatar(
            'https://avatars.githubusercontent.com/u/53379976?s=200&v=4'
          );

          hook
            .send(embedBeforeModification)
            .then(() => {
              hook.send(embedUpdatedFields).then(() => {
                hook.send(embedAddedFields).then(() => {
                  hook.send(embedDeletedFields);
                });
              });
            });
        }
      } catch (error) {
        console.error(error);
      }
    },
    async afterCreate(result, data) {
      const { title, description, team } = data;

      const group = await strapi.services['google-manager'].createGroup(
        description,
        title
      );

      await strapi.services.project.giveTeamGroup(team, group);

      //Lets strapi-svc@devlaunchers.com be owner of the google group to fix google meets auto admit problem
      await strapi.services['google-manager'].joinGroup(
        group.id,
        process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_JWT_SUBJECT,
        'OWNER'
      );

      const calendar = await strapi.services['google-manager'].createCalendar(
        title
      );

      const calendarId = calendar.id;

      const projectID = result.id;

      // update calendarId to the project according to projectID
      strapi.query('project').update({ id: projectID }, { calendarId });

      await strapi.services['google-manager'].createEvent(
        calendar.id,
        calendar.summary,
        group.email,
        projectID
      );

      await strapi.services.project.giveTeamAcl(team, calendar.id, group);
    },
  },
};
