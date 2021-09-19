'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

async function updateProjectMeetingMinutes(currentPoints, user, project, duration) {
  if (currentPoints != undefined) {
    let projectMeetingMinutes = currentPoints.projectMeetingMinutes;
    // Find index of the project
    let index = projectMeetingMinutes.findIndex(meetingMinutes => {
      return project.id === meetingMinutes.project.id
    });
    if (index != -1) {
      projectMeetingMinutes[index].minutes += duration;
    } else {
      // Create a new point if this is the first time the user joined the project meeting
      projectMeetingMinutes.push({
        project,
        minutes: duration,
      });
    }
    await strapi.query('point').update(
      { user: user.id },
      { projectMeetingMinutes },
    );
  }
}

async function createProjectMeetingMinutes(user, project, duration) {
  await strapi.query('point').create({
    user: user.id,
    projectMeetingMinutes: [
      {
        project,
        minutes: duration,
      }
    ],
  });
}

module.exports = { updateProjectMeetingMinutes, createProjectMeetingMinutes };
