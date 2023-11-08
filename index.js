require('dotenv/config')

const {createCalendarLink, createMyICalTemplate} =require('./templates')
const {Bot, session} = require("grammy");
const {Menu} = require("@grammyjs/menu");
const {freeStorage} = require("@grammyjs/storage-free");
const {getEventForTheNext1Month, getAppointments, generateFreeSlots} = require("./iCalManager");

const {
    conversations,
    createConversation,
} = require("@grammyjs/conversations");

// Bot setup

const bot = new Bot(process.env.BOT_TOKEN); // <-- put your bot token between the "" (https://t.me/BotFather)
bot.use(session({
    initial: () => ({iCalLink: null}),
    storage: freeStorage(bot.token),
}));

// Conversations
async function askForICal(conversation, ctx) {
    await ctx.reply("Please provide your iCalLink");
    const newCtx = await conversation.wait();
    const { message: { text: iCalLink } } = newCtx;
    newCtx.session.iCalLink = iCalLink;
    await newCtx.reply(createMyICalTemplate(iCalLink), {parse_mode: "MarkdownV2"});
}

bot.use(conversations());
bot.use(createConversation(askForICal));

// Create a simple menu
const menu = new Menu("my-menu-identifier")
    .text("Get my calendar link", (ctx) => ctx.reply(createCalendarLink(ctx.from), {parse_mode: "MarkdownV2"})).row()
    .text("Show my iCal link", (ctx) => ctx.reply(createMyICalTemplate(ctx.session.iCalLink), {parse_mode: "MarkdownV2"})).row()
    .text("Change my iCal link", (ctx) => ctx.conversation.enter("askForICal")).row()
    .text("Show my next schedules", async (ctx) => ctx.reply(await getEventForTheNext1Month(ctx.session.iCalLink), {parse_mode: "HTML"})).row()
    .text("Show my free slots", async (ctx) => {
        let from = new Date();
        let until = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
        const events = generateFreeSlots(await getAppointments(ctx.session.iCalLink), from, until);
        console.log({e: events})
        ctx.reply(events.map(e => `${e.start.toLocaleString('en-US', { hour: 'numeric', hour12: true})} - ${e.end.toLocaleString('en-US', { hour: 'numeric', hour12: true})}`).join("\n"));
    });

// Make it interactive.
bot.use(menu);

bot.command("start", async (ctx) => {
    const selectedMenu = ctx.match;
    // Send the menu.
    await ctx.reply("Check out this menu:", {reply_markup: menu});
});

// Global error handler
bot.catch(async (error) => {
    const ctx = error.ctx;
    // Log the error
    console.error('Error in bot:', error);
    // You can also notify the user about the error or take other actions
    await ctx.reply("Both is having internal error, please try again.");
});

bot.start();