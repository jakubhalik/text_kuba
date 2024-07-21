const { Pool } = require('pg');
const readlineSync = require('readline-sync');

const owner = process.env.owner;
const host = process.env.host;
const port = process.env.port;
const numberifiedPortForTypeSafety = parseInt(port, 10);

// Prompt for the password without showing input
const password = readlineSync.question(
    'Enter the password for the database: ',
    {
        hideEchoBack: true,
    }
);

const pool = new Pool({
    host: host,
    port: numberifiedPortForTypeSafety,
    database: `text_${owner}`,
    user: owner,
    password: password,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(res.rows);
    console.log('If time got logged out, your db configuration works great.');
    pool.end();
});
