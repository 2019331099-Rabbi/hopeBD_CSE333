const express = require('express');
const exphbs = require('express-handlebars');
const fileUpload = require('express-fileupload');
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');

const app = express();

// default option
app.use(fileUpload());
app.use(cookieParser());

// .env
dotenv.config({ path: "./.env" });

// static files
app.use(express.static('public'));
app.use(express.static('upload'));

// Template engine
app.set('view engine', 'hbs');

app.use("/", require('./routes/pages'));
app.use("/admin", require('./routes/admin'));
app.use("/auth", require('./routes/auth'));
app.use("/utils", require('./routes/utils'));

app.listen(process.env.PORT, () => {
    console.log("server run successfully");
});
