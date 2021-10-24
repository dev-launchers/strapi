'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const axios = require('axios');
const _ = require('lodash');

module.exports = {
  lifecycles: {
    async beforeUpdate(params, data) {
      try {
        let projectBeforeModification = await strapi
          .query('project')
          .findOne(params, ['heroImage', 'heroImage.formats']);
        let concatinated = [
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
        let deletedFields = _.differenceBy(
          projectBeforeModification.openPositions,
          data.openPositions,
          'id'
        );

       
        if (
          !_.isEqual(
            projectBeforeModification.openPositions,
            data.openPositions
          ) && process.env.NODE_ENV == 'production'
        ) {
          await axios.post(
            process.env.OPEN_POSITIONS_DISCORD_WEBHOOK,
            {
              username: `${projectBeforeModification.title} Notifier`,
              avatar_url:
                'https://avatars.githubusercontent.com/u/53379976?s=200&v=4',
              embeds: [
                {
                  title: `${projectBeforeModification.title} Project Page`,
                  url: `https://devlaunchers.org/projects/${projectBeforeModification.slug}`,
                  description: `*someone* **__UPDATED__** the open roles => [Link to the strapi page](${process.env.FRONTEND_URL}/admin/plugins/content-manager/collectionType/application::project.project/${params.id})`,
                  color: 15258703,
                  fields: [
                    {
                      name: 'Before Modification',
                      value: `\`\`\`JSON\n${JSON.stringify(
                        projectBeforeModification.openPositions,
                        null,
                        1
                      )}\n\`\`\``,
                      inline: false,
                    },
                    {
                      name: 'Updated Fields',
                      value: `\`\`\`JSON\n${JSON.stringify(
                        concatinated.filter((pos) => pos.id && !pos.isHidden),
                        null,
                        1
                      )}\n\`\`\``,
                      inline: false,
                    },
                    {
                      name: 'Added Fields',
                      value: `\`\`\`JSON\n${JSON.stringify(
                        concatinated.filter((pos) => !pos.id),
                        null,
                        1
                      )}\n\`\`\``,
                      inline: true,
                    },
                    {
                      name: 'Deleted/Hidden Fields',
                      value: `\`\`\`JSON\n${JSON.stringify(
                        [
                          ...deletedFields,
                          ...concatinated.filter((pos) => pos.isHidden),
                        ],
                        null,
                        1
                      )}\n\`\`\``,
                      inline: true,
                    },
                    {
                      name: 'Thanks!',
                      value: ':DevLaunchers:',
                    },
                  ],
                  image: {
                    url: `${projectBeforeModification.heroImage.url}`,
                  },
                },
              ],
            }
          );
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
};
