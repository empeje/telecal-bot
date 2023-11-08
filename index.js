require('dotenv/config')

const {createCalendarLink, createMyICalTemplate} =require('./templates')
const {Bot, session} = require("grammy");
const {Menu} = require("@grammyjs/menu");
const {freeStorage} = require("@grammyjs/storage-free");
const {getEventForTheNext1Month, getAppointments, generateFreeSlots} = require("./iCalManager");
const {db, getUserByUsername, deleteUserICal, insertUserICal, updateUserICal} = require("./user_ical")

const {
    conversations,
    createConversation,
} = require("@grammyjs/conversations");

// Bot setup

const bot = new Bot(process.env.BOT_TOKEN); // <-- put your bot token between the "" (https://t.me/BotFather)
bot.use(session({
    initial: () => ({iCalLink: null, tempInquiry: null}),
    storage: freeStorage(bot.token),
}));

// Conversations
async function askForICal(conversation, ctx) {
    await ctx.reply("Please provide your iCalLink");
    const newCtx = await conversation.wait();
    const { message } = newCtx;
    if(message && message.text) {
        const iCalLink = message.text;
        newCtx.session.iCalLink = iCalLink;
        updateUserICal(newCtx.message.from.username, iCalLink)
        await newCtx.reply(createMyICalTemplate(iCalLink), {parse_mode: "MarkdownV2"});
    }
}

const getDatesForNextWeek = (startDate) =>
    Array.from({ length: 8 }, (_, i) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        return currentDate.getDate();
    });


async function booking(conversation, ctx) {
    const iCalLink = await getUserByUsername(ctx.session.tempInquiry);

    if(!iCalLink) {
        await ctx.reply("User not found");
        return
    }

    const today = new Date();
    const possibleDates = getDatesForNextWeek(today).join(' ');
    console.log({possibleDates})
    await ctx.reply("Select possible dates " + possibleDates);

    const newCtx = await conversation.wait();
    const { message } = newCtx;
    const searchElement = Number(message.text);
    if (possibleDates.includes(searchElement)) {
        let from;
        console.log({searchElement, today})
        if(searchElement == today.getDate()) {
            from = today;
            from.setHours(from.getHours() + 1)
        } else {
            from = new Date(today.getFullYear(), today.getMonth(), searchElement);
        }

        let until = new Date(today.getFullYear(), today.getMonth(), searchElement + 1);
        console.log({iCalLink})
        const events = generateFreeSlots(await getAppointments(iCalLink), from, until);
        newCtx.reply(events.map(e => `${e.start.toLocaleString('en-US', { hour: 'numeric', hour12: true})} - ${e.end.toLocaleString('en-US', { hour: 'numeric', hour12: true})}`).join("\n"));
    } else {
        await newCtx.reply(`Date not found or invalid`);
    }
}

bot.use(conversations());
bot.use(createConversation(askForICal));
bot.use(createConversation(booking));

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
    console.log({selectedMenu})
    if(selectedMenu != '') {
        ctx.session.tempInquiry = selectedMenu;
        console.log(`=== Booking ${selectedMenu}`)
        await ctx.conversation.enter("booking")
    } else {
        // Send the menu.
        await ctx.reply("Check out this menu:", {reply_markup: menu});
    }
});

bot.catch(async (error) => {
    const ctx = error.ctx;
    // Log the error
    console.error('Error in bot:', error);
    // You can also notify the user about the error or take other actions
    await ctx.reply("Bot is having internal error, please try again.");
});

bot.start();