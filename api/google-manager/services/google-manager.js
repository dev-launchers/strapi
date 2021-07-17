const fs = require('fs');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');

const { isDevEnv } = require('../../../utils/isDevEnv');

class GoogleManager {
  constructor(email, key) {
    const scopes = [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.group.member',
      'https://www.googleapis.com/auth/admin.directory.user.security',
    ];
    // https://www.npmjs.com/package/google-auth-library#json-web-tokens
    this.auth = new JWT({
      email: email,
      key: key,
      // Subject is needed https://github.com/googleapis/google-api-nodejs-client/issues/1884#issuecomment-625062805
      subject: 'team@devlaunchers.com',
      scopes: scopes,
    });
  }

  async createGroup(groupEmail, description, name) {
    try {
      const admin = await google.admin({
        version: 'directory_v1',
        auth: this.auth
      });

      const group = await admin.groups.insert({
        requestBody: {
          email: groupEmail,
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
    const auth = this.auth;
    // Authentication code reference from https://medium.com/swlh/how-to-use-directory-from-google-api-using-node-js-cb375f7a3f14
    const admin = await google.admin({
      version: 'directory_v1',
      auth,
    });
    // https://googleapis.dev/nodejs/googleapis/latest/admin/interfaces/Params$Resource$Members$Insert.html
    try {
      await admin.members.insert({
        groupKey: groupId,
        requestBody: {
          email: user_email,
          role
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

class MockGoogleManager {
  async joinGroup(user_email) {
    console.log(`${user_email} joined mock Google Group`);
  }
}

// Load Google Directory API service account credential

if (!isDevEnv()) {
  const rawKey = fs.readFileSync(process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_KEY);
  const googleKey = JSON.parse(rawKey);
  const email = googleKey.client_email;
  const privateKey = googleKey.private_key;

  module.exports = new GoogleManager(email, privateKey);
} else {
  const rawKey = fs.readFileSync("/srv/app/google-directory-key.json");
  const googleKey = JSON.parse(rawKey);
  const email = googleKey.client_email;
  const privateKey = googleKey.private_key;
  module.exports = new GoogleManager(email, privateKey);
}
