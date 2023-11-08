const sqlite3 = require('sqlite3').verbose();

// Connect to the SQLite database or create it if it doesn't exist
const db = new sqlite3.Database('db/calendars.db');

// Create table if it doesn't exist
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS user_ical (username TEXT, iCalLink TEXT)');
});

db.query = function (sql, params) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.all(sql, params, function (error, rows) {
            if (error)
                reject(error);
            else
                resolve({ rows: rows });
        });
    });
};

// Insert a user
const insertUserICal = (username, iCalLink) => {
    const stmt = db.prepare('INSERT INTO user_ical (username, iCalLink) VALUES (?, ?)');
    stmt.run(username, iCalLink);
    stmt.finalize();
};

// Update a user's iCalLink
const updateUserICal = (username, iCalLink) => {
    const ical = getUserByUsername(username);
    if(!!ical) {
        db.run('UPDATE user_ical SET iCalLink = ? WHERE username = ?', [iCalLink, username]);
    } else {
        insertUserICal(username, iCalLink)
    }
};

// Delete a user by username
const deleteUserICal = (username) => {
    db.run('DELETE FROM user_ical WHERE username = ?', username);
};

// Get a user by username
const getUserByUsername = async (username) => {
    const res = (await db.query('SELECT * FROM user_ical WHERE username = ?', username));
    return res && res.rows && res.rows.length > 0 ? res.rows[0].iCalLink : null;
};

module.exports = {db, insertUserICal, updateUserICal, deleteUserICal, getUserByUsername}