'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async watchAuditLogs(ctx) {
    const { application, event } = ctx.params;
    try {
      const subscriptionChannel = await strapi.services['google-manager'].watchAuditLogs('all', application, event);
      return subscriptionChannel;
    } catch (err) {
      ctx.badRequest(err);
    }
  },

  async listenAuditLogs(ctx) {
    const { application, event } = ctx.params;
    console.log(`Receive ${event} for app ${application}, data`, ctx.request.body);
    ctx.send({});
  },

  async stopAuditLogs(ctx) {
    const { channelId, resourceId } = ctx.request.body;
    try {
      await strapi.services['google-manager'].stopAuditLogs(channelId, resourceId);
      ctx.send({
        message: `stop watching channel ${channelId} for resoruce ${resourceId}`,
      });
    } catch (err) {
      ctx.badRequest(err);
    }
  }
};
