'use strict';

const axios = require('axios');

class GithubManager {
  constructor() {
    this.url = 'https://api.github.com';
    this.defaultHeaders = {
      'Accept': 'application/vnd.github.v3+json',
    };
    this.knownBots = ['fluxcdbot'];
  }

  repoURL(user, repo) {
    return `https://github.com/${user}/${repo}`;
  }

  async repoCodeFreq(user, repo) {
    const resp = await axios.get(
      `${this.url}/repos/${user}/${repo}/stats/code_frequency`,
      this.defaultHeaders,
    );
    const freq = resp.data.map(change => {
      return {
        datetime: new Date(change[0] * 1000),
        addedLines: change[1],
        removedLines: change[2],
      };
    });
    return freq;
  }

  async repoContributors(user, repo) {
    const resp = await axios.get(
      `${this.url}/repos/${user}/${repo}/stats/contributors`,
      this.defaultHeaders,
    );
    const contributors = resp.data.reduce((filtered, c) => {
      const username = c.author.login;
      if (!this.knownBots.includes(username)) {
        filtered.push({
          name: c.author.login,
          githubURL: c.author.html_url,
          avatarURL: c.author.avatar_url,
          contributions: c.total
        });
      }
      return filtered;
    }, []);
    contributors.sort((c1, c2) => {
      return c2.contributions - c1.contributions;
    });
    return contributors;
  }
}

module.exports = new GithubManager();
