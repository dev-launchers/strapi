# How to contribute to the Devlaunchers backend

## Requirements:
Before you start contributing, you're going to need a few things:
- **Docker:**
    - We will use Docker to build and manage containers
      Pick the Docker for your operating systems.
      For Windows, refer to https://docs.docker.com/docker-for-windows/install/.
      For Mac, refer to https://docs.docker.com/docker-for-mac/install/.
- **Tilt:**
    - We use Tilt to provide a frontend for docker-compose, and rebuild containers when source is changed.
      Refer to https://docs.tilt.dev/install.html to install tilt.
      We are not using kubernetes, so skip kubernetes installation.
- **Code Editor**
    - Either [Atom](https://atom.io/) or [Visual Studio Code](https://code.visualstudio.com/)
    - Why? These are code editors that most of our contributors use, so we can help you more
      if you use one of these. However, most other code editors should work.

# Setup

1. Make sure your to create a parent folder. You will need to clone the strapi repo and the
platform__dev-env repo into that parent folder.
```
├── strapi
├── platform__dev-env
```

2. Make sure to add all the env var to the `api.env.example`. After adding all the env var,
make sure to remove .example from `api.env.example`. It should look like this `api.env`.
If you don't know the env var, just ask in the backend-chat channel on discord and someone
should send you all the env vars.

## communication
**Discord:**
  - You will be needing a discord account to be able to efficiently
    communicate with the backend team. Message Alejandro Armas#4672 or cthuang#2709
    if you need any help.

# Standards

## Code Styles
To prevent formatting wars and be consistent, here are the coding style guidelines we have made:
- Use 2 space indentation (2 space tabs are fine too)
- Remove **all** unused variables, and make sure you do before every commit
    - This helps make sure the code runs as smooth as possible, as JavaScripts garbage collector has to do **much** less work.
- Remove unnecessary **console.log()** from files before commiting
- Remove **all** unnecessary comments prior to commiting
    - Example:
    ```js
        // This needs to be changed, I don't like the font!
    ```
- Use single quotes (`' '`) for strings
- Always use ES6's Template Literals for string interpolation, and **never** concatenate strings.
    - Example:
      ```js
      // Very Bad:
      console.log(user + " has " + xp + " xp.");

      // Good:
      console.log(`${user} has ${xp} xp.`);
      ```
- End statements and expressions with semicolons (`;`).
- Use camelCase when naming variables

## Commits, Branches, and Pull Requests
- Before starting anything, make sure you:
    - ```bash
      git checkout main
      git pull
      git checkout -b "branch-name"
      ```
    - This ensures that you are working on the newest copy of the app.
- We are using semantic versioning for commits to tag releases:
    - Follow the [Format Guide](https://github.com/semantic-release/semantic-release#commit-message-format)
- Create a new branch for each new feature you add.
- During a PR:
    - You may be asked questions about what certain things do
    - You may be asked to refactor/change your code because:
        - It doesn't comply with the standards we've set forth
        - It would be wise to add a new feature
        - Or, something is missing or confusing

# Running
In the root directory of this repo, run `./run.sh` to spin up all services.
If you only want to run a subset of services run `./run.sh <service 1>, <service 2> ... <service n>`.
For example, if you only want to run the api, run `./run.sh strapi`. If you want to run the bot, run `./run.sh bot`.
Tilt will automatically detect change in source and handle restarts.
It also provides an UI to read logs from each container, and restart them at http://localhost:10350/.
