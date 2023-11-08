const ical = require('node-ical');
const moment = require('moment-timezone');
const {createEvents} = require("./templates");

async function getAppointments(iCalLink) {
    const data = await ical.async.fromURL(iCalLink, {});

    // Get the current date and the date one month from now
    const now = moment();
    const oneMonthFromNow = moment().add(1, 'months');

    // Filter the events for the next month
    const eventsForNextMonth = Object.values(data).filter((event) => {
        const eventDate = moment(event.start);
        return eventDate.isBetween(now, oneMonthFromNow, null, '[]');
    });
    return eventsForNextMonth.filter(event => !!event.start).sort((a, b) => a.start - b.start);
}

const generateFreeSlots = (events, from, until) => {
    const oneHour = 60 * 60 * 1000;
    const freeSlots = [];

    from.setMinutes(0, 0); // from the current hours
    until.setHours(0, 0, 0, 0); // until the last hour tomorrow

    for (let time = from.getTime(); time < until.getTime(); time += oneHour) {
        const slotStart = new Date(time);
        const slotEnd = new Date(time + oneHour);
        const isSlotFree = !events.some(event => (slotStart < event.end && slotEnd > event.start));
        if (isSlotFree) {
            freeSlots.push({ start: slotStart, end: slotEnd });
        }
    }

    return freeSlots;
};

const getEventForTheNext1Month = async (iCalLink)  => {
    const eventsForNextMonth = await getAppointments(iCalLink);

    // Print the filtered events
    return createEvents(eventsForNextMonth);
}

module.exports = {getEventForTheNext1Month, generateFreeSlots, getAppointments}