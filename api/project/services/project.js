'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
 const fs = require('fs');
 const { JWT } = require('google-auth-library');
 const { google } = require('googleapis');
 const { GoogleGroupManager }  = require('../../../extensions/users-permissions/services/google-group');
 const { isDevEnv } = require('../../../utils/isDevEnv');

 class ProjectManager extends GoogleGroupManager {
   constructor(email, key) {
     super(email, key);
     const scopes = [
       'https://www.googleapis.com/auth/admin.directory.group',
       'https://www.googleapis.com/auth/admin.directory.group.member',
       'https://www.googleapis.com/auth/admin.directory.user.security'];
     // https://www.npmjs.com/package/google-auth-library#json-web-tokens
     console.log(this.auth);
   }

   async createGroup(groupId) {
     console.log(`created group with id: ${groupId}`);
   }

   /*
     Adds current user to Google Group
     Caller is responsible to catch error
   */
   async joinGroup(user_email, role) {
     const auth = this.auth;
     // Authentication code reference from https://medium.com/swlh/how-to-use-directory-from-google-api-using-node-js-cb375f7a3f14
     const admin = await google.admin({
       version: 'directory_v1',
       auth,
     });
     // https://googleapis.dev/nodejs/googleapis/latest/admin/interfaces/Params$Resource$Members$Insert.html
     try {
       const groupRole = role === 'leader' ? 'OWNER' : 'MEMBER';
       await admin.members.insert({
         groupKey: this.groupID,
         requestBody: {
           email: user_email,
           role: groupRole,
         },
       });
     } catch (err) {
       if (err.code == 409) {
         console.warn(`${user_email} already in the Google Group`);
       } else {
         throw `Google Admin Directory API returned error ${err} when adding user`;
       }
     }
   }
 }
 // Load Google Directory API service account credential
/*
 if (!isDevEnv()) {
   const rawKey = fs.readFileSync(process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_KEY);
   const googleKey = JSON.parse(rawKey);
   const email = googleKey.client_email;
   const privateKey = googleKey.private_key;
   const groupID = process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_GROUP_ID;

   module.exports = new GoogleGroupManager(email, privateKey, groupID);
 } else {
   module.exports = new MockGoogleGroupManager();
 }
*/

const rawKey = fs.readFileSync("/srv/app/google-directory-key.json");
const googleKey = JSON.parse(rawKey);
const email = googleKey.client_email;
const privateKey = googleKey.private_key;
const groupID = '1239487nigdfhgdrgidgiihu';

module.exports = new ProjectManager(email, privateKey);;
