'use strict';

module.exports = {
    /**
     * Triggered before user creation.
     */
    lifecycles:{
        async beforeCreate(data)  {
            data.username=data.username.trim().replace(/\s+/g,'_');
        },
    },
  };

