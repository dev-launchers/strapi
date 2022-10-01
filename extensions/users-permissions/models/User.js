'use strict';

module.exports = {
  /**
   * Triggered before user creation.
   */
  lifecycles: {
    async beforeUpdate(params, data) {
      if (data.username)
        data.username = data.username.trim().replace(/\s+/g, '_');
    },
  },
};
