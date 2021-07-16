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
 const axios = require('axios');
 const { v4: uuidv4 } = require('uuid');

 class ProjectManager extends GoogleGroupManager {
   constructor(email, key) {
     super(email, key);
   }

   async createGroup(ownerEmail, description, name) {
     try {
       const admin = await google.admin({
         version: 'directory_v1',
         auth: this.auth
       });

       const group = await admin.groups.insert({
         requestBody: {
           email: ownerEmail,
           name,
           description,
         }
       })

       return group.data;
     } catch(err) {
       if(err.code === 409){
         console.warn('Google group already exists')
       } else {
         throw new Error(`Google Admin Directory API returned ${err} when creating google group`);
       }
     }
   }

   /*
     Adds current user to Google Group
     Caller is responsible to catch error
   */
   async joinGroup(groupId, user_email, role) {
     const admin = await google.admin({
       version: 'directory_v1',
       auth: this.auth,
     });
     
     try {
       await admin.members.insert({
         groupKey: groupId,
         requestBody: {
           email: user_email,
           role: 'MEMBER',
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

const rawKey = fs.readFileSync("/srv/app/google-directory-key.json");
const googleKey = JSON.parse(rawKey);
const email = googleKey.client_email;
const privateKey = googleKey.private_key;
const groupID = '1239487nigdfhgdrgidgiihu';
const projectManager = new ProjectManager(email, privateKey);
//console.log("project manager func: ", projectManager.createGroup('alearm246@gmail.com', 'backend description', 'site backend').then(res => console.log(res)))
module.exports = {
  projectManager
}
