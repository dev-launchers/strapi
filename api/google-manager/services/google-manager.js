const fs = require('fs');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
const uuid = require('uuid/v4');
// Doc is at https://googleapis.dev/nodejs/googleapis/latest/index.html

const { isDevEnv } = require('../../../utils/isDevEnv');

class GoogleManager {
  constructor(email, key, groupID, serverBaseURL) {
    const scopes = [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.group.member',
      'https://www.googleapis.com/auth/admin.directory.user.security',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly'];
    // https://www.npmjs.com/package/google-auth-library#json-web-tokens
    this.auth = new JWT({
      email: email,
      key: key,
      // Subject is needed https://github.com/googleapis/google-api-nodejs-client/issues/1884#issuecomment-625062805
      subject: process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_JWT_SUBJECT,
      scopes: scopes,
    });
    this.groupID = groupID;
    this.serverBaseURL = serverBaseURL;
  }

  /*
    Adds current user to Google Group
    Caller is responsible to catch error
  */
  async joinGroup(user_email) {
    const auth = this.auth;
    // Authentication code reference from https://medium.com/swlh/how-to-use-directory-from-google-api-using-node-js-cb375f7a3f14
    const admin = await google.admin({
      version: 'directory_v1',
      auth,
    });
    // https://googleapis.dev/nodejs/googleapis/latest/admin/interfaces/Params$Resource$Members$Insert.html
    try {
      await admin.members.insert({
        groupKey: this.groupID,
        requestBody: {
          email: user_email,
          role: 'MEMBER',
        },
      });
    } catch (err) {
      if (err.code == 409) {
        console.warn(`${user_email} already in the Google Group`);
      } else {
        console.error(`Google Admin Directory API returned error ${err} when adding user`);
      }
    }
  }

  /**
   * Creates a subscription channel to start receiving notifications
   * https://developers.google.com/admin-sdk/reports/reference/rest/v1/activities/watch
   */
  async watchAuditLogs(userKey, applicationName, eventName) {
    const auth = this.auth;
    const service = google.admin({ version: 'reports_v1', auth });
    const requestBody = {
      id: uuid(),
      type: 'web_hook',
      address: `${this.serverBaseURL}/google-manager/listen/${applicationName}/${eventName}`,
      payload: true,
      resourceId: uuid(),
      kind: 'api#channel',
    };
    try {
      const resp = await service.activities.watch({
        userKey,
        applicationName,
        eventName,
        requestBody
      });
      const subscriptionChannel = resp.data;
      return subscriptionChannel;
    }
    catch (err) {
      console.error('Google Report API returned error:', err.message);
      throw err.message;
    }
  }

  async stopAuditLogs(channelId, resourceId) {
    const auth = this.auth;
    const service = google.admin({ version: 'reports_v1', auth });
    const requestBody = {
      id: channelId,
      resourceId,
    };
    try {
      await service.channels.stop({
        requestBody
      });
    }
    catch (err) {
      console.error('Stop Google push notifications returned error:', err.message);
      throw err.message;
    }
  }

}

class MockGoogleManager {
  async joinGroup(user_email) {
    console.log(`${user_email} joined mock Google Group`);
  }

  async watchAuditLogs(_userKey, applicationName, eventName) {
    console.log(`Mock Google Manager watch ${eventName} event of ${applicationName}`);
  }

  async stopAuditLogs(channelId, resourceId) {
    console.log(`Mock Google Manager stop watching channel ${channelId} for resoruce ${resourceId}`);
  }
}

// Load Google Directory API service account credential

if (!isDevEnv()) {
  const rawKey = fs.readFileSync(process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_KEY);
  const googleKey = JSON.parse(rawKey);
  const email = googleKey.client_email;
  const privateKey = googleKey.private_key;
  const groupID = process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_GROUP_ID;
  const serverBaseURL = process.env.URL;

  module.exports = new GoogleManager(email, privateKey, groupID, serverBaseURL);
} else {
  module.exports = new MockGoogleManager();
}

