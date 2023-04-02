'use strict';

function isEmpty(val){
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}
function replaceSpaces(val){
    return val.trim().replace(/\s+/g, '_');
}
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
      if (!isEmpty(username)) {
        data.username = replaceSpaces(username);
      }
      if (!isEmpty(firstName)) {
        data.firstName = replaceSpaces(firstName);
      }
      if (!isEmpty(lastName)) {
        data.lastName = replaceSpaces(lastName);
      }
    },
  },
};
