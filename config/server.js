module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: process.env.URL,
  proxy: true,
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "89f3d0d1ff175b5cb4e6e6e642697183")
    }
  }
});
