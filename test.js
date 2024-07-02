const { Pool } = require('pg');
const readlineSync = require('readline-sync');

// Prompt for the password without showing input
const password = readlineSync.question(
    'Enter the password for the database: ',
    {
        hideEchoBack: true,
    }
);

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'text_kuba',
    user: 'kuba',
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
