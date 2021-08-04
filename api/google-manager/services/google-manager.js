const fs = require('fs');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');

const { isDevEnv } = require('../../../utils/isDevEnv');
const { v4: uuidv4 } = require('uuid');

class GoogleManager {
  constructor(email, key) {
    const scopes = [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.group.member',
      'https://www.googleapis.com/auth/admin.directory.user.security',
    ];

    const calendarScopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ]
    this.devlaunchersEmail = 'team@devlaunchers.com';
    // https://www.npmjs.com/package/google-auth-library#json-web-tokens
    this.adminAuth = new JWT({
      email: email,
      key: key,
      // Subject is needed https://github.com/googleapis/google-api-nodejs-client/issues/1884#issuecomment-625062805
      subject: this.devlaunchersEmail,
      scopes: scopes,
    });

    this.calendarAuth = new JWT({
      email: email,
      key: key,
      subject: this.devlaunchersEmail,
      scopes: calendarScopes,
    });


  }

  async createGroup(groupEmail, description, name) {
    try {
      const admin = await google.admin({
        version: 'directory_v1',
        auth: this.adminAuth
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
        throw `Google Admin Directory API returned error ${err} when adding user`;
      }
    }
  }

  async createCalendar(title) {
    try {
      const calendar = await google.calendar({
        version: 'v3',
        auth: this.calendarAuth
      })

      const createdCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: title
        }
      })
      return createdCalendar.data;
    } catch(err) {
      console.error(`Google Calendar API returned error ${err} when creating calendar`);
    }
  }

  async grantAcl(calendarId, email, role) {
    try {
      const calendar = await google.calendar({
        version: 'v3',
        auth: this.calendarAuth
      })

      const acl = await calendar.acl.insert({
        calendarId,
        requestBody: {
            role: role,
            scope: {
              type: role === 'reader' ? 'group' : 'user',
              value: email
            }
        }
      })
    } catch(err) {
      console.error(`Google Calendar API returned error ${err} when granting acl`);
    }
  }

  async createEvent(calendarId, title, groupEmail) {
    try {
      const calendar = await google.calendar({
        version: 'v3',
        auth: this.calendarAuth
      })

      const createdEvent = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        requestBody: {
          end: {
            date: "2021-07-04"
          },
          start: {
            date: "2021-07-04"
          },
          recurrence: [
            "RRULE:FREQ=DAILY"
          ],
          attendees: [
            {
              email: groupEmail,
              responseStatus: "accepted"
            }
          ],
          conferenceData: {
            createRequest: {
              requestId: uuidv4(),
              conferenceSolutionKey: {
                type: "hangoutsMeet"
              },
            }
          },
          summary: `${title} Common Room`,
        }
    })

    const {id, summary, conferenceData } = createdEvent.data;

    //gets meetingcode from uri
    const meetingCode = conferenceData.entryPoints[0].uri.split('/')[3];


    await strapi.services['google-meets'].create({
      name: summary,
      meetingCode,
      conferenceId: conferenceData.conferenceId,
      calendarEventId: id,
    })

    } catch(err) {
      console.error(`Google Calendar API returned error ${err} when creating event`);
    }
  }

  formatEmail(title){
    const titleRegEx = title.replace(/[^a-zA-Z0-9 ]/g, "");
    return titleRegEx.split(' ').join('-').toLowerCase();
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

  async createCalendar(title) {
    const mockCalendar = {
      id: uuidv4(),
    };
    console.log(`google calendar for ${title} has been created`);

    return mockCalendar
  }

  async grantAcl(calendarId, email, role) {
    console.log(`${role} acl has been given to ${email}`);
  }

  async createEvent(calendarId, title, groupEmail) {
    console.log(`event has been created for ${title}`);
  }

  async formatEmail(title) {
    console.log(`${title} has been formatted`);
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
  module.exports = new MockGoogleManager();
}
