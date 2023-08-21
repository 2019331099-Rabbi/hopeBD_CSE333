const mysql = require('mysql');

const myDB = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
});

myDB.connect((err) => {
    if (err) console.log(err);
    else console.log("Connected to the database");
});

module.exports = myDB;