module.exports = {
  //...
  settings: {
    cors: {
      enabled: true,
      origin: [process.env.FRONTEND_URL, process.env.URL, "http://localhost:3000"],
    },
  },
};
