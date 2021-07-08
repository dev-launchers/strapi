module.exports = {
  //...
  settings: {
    cors: {
      // headers: '*',
      origin: [process.env.FRONTEND_URL],
    },
  },
};
