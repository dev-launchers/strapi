'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const axios = require('axios');
const _ = require('lodash');

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
          await axios.post(process.env.OPEN_POSITIONS_DISCORD_WEBHOOK, {
            username: `${projectBeforeModification.title} Notifier`,
            avatar_url:
              'https://avatars.githubusercontent.com/u/53379976?s=200&v=4',
            embeds: [
              {
                title: `${projectBeforeModification.title} Project Page`,
                url: `${process.env.DOMAIN}/projects/${projectBeforeModification.slug}`,
                description: `*someone* **__UPDATED__** the open roles => [Link to the strapi page](${process.env.FRONTEND_URL}/admin/plugins/content-manager/collectionType/application::project.project/${params.id})`,
                color: 15258703, // A yellow color in "decimal value"
                fields: [
                  {
                    name: 'Before Modification',
                    value: formatJSON(projectBeforeModification.openPositions),
                    inline: false,
                  },
                  {
                    name: 'Updated Fields',
                    value: formatJSON(
                      concatinated.filter((pos) => pos.id && !pos.isHidden)
                    ),
                    inline: false,
                  },
                  {
                    name: 'Added Fields',
                    value: formatJSON(concatinated.filter((pos) => !pos.id)),
                    inline: true,
                  },
                  {
                    name: 'Deleted/Hidden Fields',
                    value: formatJSON([
                      ...deletedFields,
                      ...concatinated.filter((pos) => pos.isHidden),
                    ]),
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
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
};
