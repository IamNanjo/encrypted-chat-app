const PORT = Number(process.env.CHAT_PORT) || 10443;
const DATABASE_URL =
  process.env.CHAT_DATABASE_URL || "/var/www/chat-app/db/out/chat-app.db";

module.exports = {
  apps: [
    {
      name: "chat",
      script: ".output/server/index.mjs",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT,
        DATABASE_URL,
      },
    },
  ],
};
