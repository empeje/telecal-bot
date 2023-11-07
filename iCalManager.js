const ical = require('node-ical');
const moment = require('moment-timezone');

const getEventForTheNext1Month = async (iCalLink)  => {
    const data = await ical.async.fromURL(iCalLink, {});

    // Get the current date and the date one month from now
    const now = moment();
    const oneMonthFromNow = moment().add(1, 'months');

    // Filter the events for the next month
    const eventsForNextMonth = Object.values(data).filter((event) => {
        const eventDate = moment(event.start);
        return eventDate.isBetween(now, oneMonthFromNow, null, '[]');
    });

    // Print the filtered events

    let replyMessage = "";

    replyMessage += 'Events for the next month:\n';

    eventsForNextMonth.forEach((event) => {
        if(!event.start)
            return;
        replyMessage += 'Event:' + event.summary;
        replyMessage += 'Start:' + event.start;
        replyMessage += 'End:' + event.end;
        replyMessage += 'Location:' + event.location;
        replyMessage += '\n';
    });
    return replyMessage;
}

module.exports = {getEventForTheNext1Month}