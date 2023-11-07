require('dotenv/config')

const { Bot } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN); // <-- put your bot token between the "" (https://t.me/BotFather)

// Reply to any message with "Hi there!".
bot.on("message", (ctx) => ctx.reply("Hi there!"));

bot.start();
