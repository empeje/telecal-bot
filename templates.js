const fs = require('fs');
const ejs = require("ejs");
const createMyICalTemplate = (iCalLink) => {
    const template = fs.readFileSync('./templates/my_ical.txt.ejs', 'utf8');
    const rendered_template = ejs.render(template, {iCalLink})
    return rendered_template;
}

const createCalendarLink = (from) => {
    const template = fs.readFileSync('./templates/my_calendar_link.txt.ejs', 'utf8');
    const rendered_template = ejs.render(template, {calendarLink: from.username})
    return rendered_template;
}

const createEvents = (events) => {
    const template = fs.readFileSync('./templates/my_events.txt.ejs', 'utf8');
    const rendered_template = ejs.render(template, {events})
    return rendered_template;
}

module.exports = {createCalendarLink, createMyICalTemplate, createEvents}