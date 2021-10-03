const { CronJob } = require('cron');
const fs = require('fs');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
const uuid = require('uuid/v4');
// Doc is at https://googleapis.dev/nodejs/googleapis/latest/index.html

const { isDevEnv } = require('../../../utils/isDevEnv');
const { v4: uuidv4 } = require('uuid');

class GoogleManager {
  constructor(email, key, serverBaseURL, auditFreqMins) {
    const adminScopes = [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.group.member',
      'https://www.googleapis.com/auth/admin.directory.user.security',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    ];

    const calendarScopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    this.subject = process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_JWT_SUBJECT;
    // https://www.npmjs.com/package/google-auth-library#json-web-tokens
    this.adminAuth = new JWT({
      email: email,
      key: key,
      // Subject is needed https://github.com/googleapis/google-api-nodejs-client/issues/1884#issuecomment-625062805
      subject: this.subject,
      scopes: adminScopes,
    });

    this.calendarAuth = new JWT({
      email: email,
      key: key,
      subject: this.subject,
      scopes: calendarScopes,
    });
    this.serverBaseURL = serverBaseURL;
    this.auditFreqMilliSecs = minuteToMilliSeconds(auditFreqMins);
  }

  async createGroup(description, name) {
    try {
      const admin = await google.admin({
        version: 'directory_v1',
        auth: this.adminAuth
      });
      const group = await admin.groups.insert({
        requestBody: {
          email: this.formatEmail(name),
          name,
          description,
        }
      });
      console.log("inserted the group");
      return group.data;
    } catch (err) {
      if (err.code === 409) {
        console.warn('Google group already exists');
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
    const auth = this.adminAuth;
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
        console.error(`Google Admin Directory API returned error ${err} when adding user`);
        throw new Error(err);
      }
    }
  }

  async getGroup(title) {
    try {
      const admin = await google.admin({
        version: 'directory_v1',
        auth: this.adminAuth
      });

      const group = await admin.groups.get({
        groupKey: this.formatEmail(title),
      });

      return group.data;
    } catch (err) {
      if (err.code === 404) {
        console.error('Google group does not exist');
        /*
          we have to return undefined to allow strapi's code
          to work even if the project doesn't have a google group
        */
        return undefined;
      } else {
        console.error(`Google Admin Directory API returned error ${err} when getting group`);
        throw new Error(err);
      }
    }
  }

  async createCalendar(title) {
    try {
      const calendar = await google.calendar({
        version: 'v3',
        auth: this.calendarAuth
      });

      const createdCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: title
        }
      });
      return createdCalendar.data;
    } catch (err) {
      console.error(`Google Calendar API returned error ${err} when creating calendar`);
      throw new Error(err);
    }
  }

  async grantAcl(calendarId, email, role, scopeType) {
    try {
      const calendar = await google.calendar({
        version: 'v3',
        auth: this.calendarAuth
      });

      await calendar.acl.insert({
        calendarId,
        requestBody: {
          role: role,
          scope: {
            type: scopeType,
            value: email
          }
        }
      });
    } catch (err) {
      console.error(`Google Calendar API returned error ${err} when granting acl`);
      throw new Error(err);
    }
  }

  async createEvent(calendarId, title, groupEmail, projectID) {
    try {
      const calendar = await google.calendar({
        version: 'v3',
        auth: this.calendarAuth
      });

      const createdEvent = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        requestBody: {
          end: {
            date: this.getCurrentDate(),
          },
          start: {
            date: this.getCurrentDate(),
          },
          recurrence: [
            'RRULE:FREQ=DAILY'
          ],
          attendees: [
            {
              email: groupEmail,
              responseStatus: 'accepted'
            }
          ],
          conferenceData: {
            createRequest: {
              requestId: uuidv4(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            }
          },
          summary: `${title} Common Room`,
          //This prevents the event from blocking time on the calendar
          transparency: 'transparent'
        }
      });

      const { id, summary, conferenceData } = createdEvent.data;

      /*
        gets meetingcode from uri
        Ex uri: https://meet.google.com/nuz-gfbn-nxv
        Ex split array: ['https:', '', 'meet.google.com', 'nuz-gfbn-nxv']
      */
      const meetingCode = conferenceData.entryPoints[0].uri.split('/')[3];

      await strapi.services['google-meets'].create({
        name: summary,
        project: projectID,
        meetingCode,
        conferenceId: conferenceData.conferenceId,
        calendarEventId: id,
      });

    } catch (err) {
      console.error(`Google Calendar API returned error ${err} when creating event`);
      throw new Error(err);
    }
  }

  formatEmail(title) {
    const titleRegEx = title.replace(/[^a-zA-Z0-9 ]/g, '');
    return `${titleRegEx.split(' ').join('-').toLowerCase()}@devlaunchers.com`;
  }

  getCurrentDate() {
    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();
    return `${year}-${month}-${day}`;
  }

  /**
   * Creates a subscription channel to start receiving notifications
   * https://developers.google.com/admin-sdk/reports/reference/rest/v1/activities/watch
   */
  async watchAuditLogs(userKey, applicationName, eventName) {
    const auth = this.adminAuth;
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
    const auth = this.adminAuth;
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

  async listAuditReports(userKey, applicationName, eventName) {
    const auth = this.adminAuth;
    const service = google.admin({ version: 'reports_v1', auth });
    const currentTime = new Date();
    const startTime = new Date(currentTime - this.auditFreqMilliSecs).toISOString();
    try {
      const resp = await service.activities.list({
        userKey,
        applicationName,
        eventName,
        startTime,
      });
      const reports = resp.data;
      return reports;
    }
    catch (err) {
      console.error('Failed to list audit reports, error:', err.message);
      throw err.message;
    }
  }
}

class MockGoogleManager {
  async createGroup(groupEmail, description, name) {
    const mockGroup = {
      id: uuidv4(),
    };
    console.log(`Mock google group for ${groupEmail} has been created with name: ${name} and description: ${description} `);

    return mockGroup;
  }

  async joinGroup(user_email) {
    console.log(`${user_email} joined mock Google Group`);
  }

  async getGroup(groupEmail) {
    const mockGroup = {
      id: uuidv4(),
      email: groupEmail
    };
    console.log(`${groupEmail} has been fetched from google group`);

    return mockGroup;
  }

  async createCalendar(title) {
    const mockCalendar = {
      id: uuidv4(),
    };
    console.log(`google calendar for ${title} has been created`);

    return mockCalendar;
  }

  async grantAcl(calendarId, email, role) {
    console.log(`${role} acl has been given to ${email}`);
  }

  async createEvent(calendarId, title, groupEmail, projectID) {
    console.log(`event has been created for ${title} and email: ${groupEmail}`);
  }

  async formatEmail(title) {
    console.log(`${title} has been formatted`);
  }

  async watchAuditLogs(_userKey, applicationName, eventName) {
    console.log(`Mock Google Manager watch ${eventName} event of ${applicationName}`);
  }

  async stopAuditLogs(channelId, resourceId) {
    console.log(`Mock Google Manager stop watching channel ${channelId} for resoruce ${resourceId}`);
  }
}

function minuteToMilliSeconds(minutes) {
  return minutes * 60 * 1000;
}

// Load Google Directory API service account credential

if (!isDevEnv()) {
  const rawKey = fs.readFileSync(process.env.DEVLAUNCHERS_GOOGLE_DIRECTORY_KEY);
  const googleKey = JSON.parse(rawKey);
  const email = googleKey.client_email;
  const privateKey = googleKey.private_key;
  const serverBaseURL = process.env.URL;
  const auditFreq = process.env.AUDIT_FREQ_MINUTES;

  const manager = new GoogleManager(email, privateKey, serverBaseURL, auditFreq);
  const cronTime = `0 */${auditFreq} * * * *`;
  const job = new CronJob(cronTime, function () {
    manager.listAuditReports('all', 'meet', 'call_ended').then(reports => {
      reports.items.forEach(r => {
        strapi.log.info('Report for Google Meet', r.events[0].parameters);
      });
    });
  });
  job.start();

  module.exports = manager;
} else {
  
  module.exports = new MockGoogleManager();
}
