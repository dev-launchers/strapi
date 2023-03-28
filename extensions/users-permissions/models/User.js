'use strict';

module.exports = {
  /**
   * Triggered before user creation.
   */
  lifecycles: {
    // async beforeUpdate(params, data) {
    //   if (data.username)
    //     data.username = data.username.trim().replace(/\s+/g, '_');
    // },
    async beforeUpdate(params, data) {
      const {username, firstName, lastName} = data;
      if (username !== null && username !== undefined) {
        strapi.log.info('username');
        data.username = data.username.trim().replace(/\s+/g, '_');
      }
      if (firstName !== null && firstName !== undefined) {
        strapi.log.info('firstName');
        data.firstName = data.firstName.trim().replace(/\s+/g, '_');
      }
      if (lastName !== null && lastName !== undefined) {
        strapi.log.info('lastName');
        data.lastName = data.lastName.trim().replace(/\s+/g, '_');
      }
    },
  },
};
