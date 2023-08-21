const myDB = require('../models/dbConnect');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

exports.registerD = async (req, res) => {

    const { name, email, password, passwordConfirm } = req.body;
    const existUser = "SELECT email FROM useremail WHERE email = ?";
    myDB.query(existUser, [email], async (error, results) => {
        if (error) {
            return res.status(500).render('registerDonor', {message: "Internal server error"});
        }
        else if (results.length > 0) {
            return res.render('registerDonor', {message: "This email is already in use"});   
        }
        else if (password !== passwordConfirm) {
            return res.render('registerDonor', {message: "Password don't match"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertEmail = "INSERT INTO useremail (email, user_type) VALUES (?, ?)";
        const insertUser = "INSERT INTO donor (name, email_id, password) VALUES (?, ?, ?)";

        myDB.query(insertEmail, [email, 'donor'], async (error, results) => {
                if (error) console.log(error);
                else {
                    myDB.query(insertUser, [name, results.insertId, hashedPassword], async (error, results) => {
                            if (error) console.log(error);
                            else {
                                return res.status(200).render("registerDonor", {
                                    message: "User successfully registered",
                                });
                            }
                        }
                    );
                }
            }
        );
    });
}

exports.registerC = async (req, res) => {
    const { name, email, phone, district, password, passwordConfirm } = req.body;
    const existUser = "SELECT email FROM useremail WHERE email = ?";
    myDB.query(existUser, [email], async (error, results) => {
        if (error) {
            return res.status(500).render('registerDonor', {message: "Internal server error"});
        }
        else if (results.length > 0) {
            return res.render('registerCollector', {message: "This email is already in use"});   
        }
        else if (password !== passwordConfirm) {
            return res.render('registerCollector', {message: "Password don't match"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertEmail = "INSERT INTO useremail (email, user_type) VALUES (?, ?)";
        const insertUser = "INSERT INTO collector (name, email_id, phone, district, password) VALUES (?, ?, ?, ?, ?)";

        myDB.query(insertEmail, [email, 'collector'], async (error, results) => {
                if (error) console.log(error);
                else {
                    myDB.query(insertUser, [name, results.insertId, phone, district, hashedPassword], async (error, results) => {
                            if (error) console.log(error);
                            else {
                                return res.status(200).render("registerCollector", {
                                    message: "Collector successfully registered",
                                });
                            }
                        }
                    );
                }
            }
        );
    });
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).render('login', {
                message: "Please provide email and password"
            });
        }
        const checkUserInfo = "(SELECT * FROM useremail WHERE email = ?);";
        myDB.query(checkUserInfo, [email], async (error, results) => {
            if (error) {
                return res.status(500).render('login', {
                    message: "Internal Server Error"
                });
            }
            if (!results.length) {
                return res.status(401).render('login', {
                    message: "Email is incorrect"
                });
            }

            if (results[0].user_type === 'donor') {
                const logInfo = "(SELECT * FROM donor WHERE email_id = ?);";
                myDB.query(logInfo, [results[0].id], async (error, resultsP) => {
                    if (error) {
                        return res.status(500).render('login', {
                            message: "Internal Server Error"
                        });
                    }
                    
                    if (!(await bcrypt.compare(password, resultsP[0].password))) {
                        return res.status(401).render('login', {
                            message: "Password is incorrect"
                        });
                    }
                    const email_id = results[0].id;
                    const token = jwt.sign({ email_id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_TOKEN_EXPIRESIN
                    });
        
                    const cookieOptions = {
                        exprires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000),
                        httpOnly: true
                    };
                    res.cookie('jwt', token, cookieOptions);
                    res.redirect("/");
                });
            }

            else {
                const logInfo = "(SELECT * FROM collector WHERE email_id = ?);";
                myDB.query(logInfo, [results[0].id], async (error, resultsP) => {
                    if (error) {
                        return res.status(500).render('login', {
                            message: "Internal Server Error"
                        });
                    }
                    
                    if (!(await bcrypt.compare(password, resultsP[0].password))) {
                        return res.status(401).render('login', {
                            message: "Password is incorrect"
                        });
                    }
                    const email_id = results[0].id;
                    const token = jwt.sign({ email_id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_TOKEN_EXPIRESIN
                    });
        
                    const cookieOptions = {
                        exprires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000),
                        httpOnly: true
                    };
                    res.cookie('jwt', token, cookieOptions);
                    res.redirect("/");
                });
            }
        });
        
    } catch (error) {
        console.log(error);
    }
};

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // console.log(decoded);

            // Check if the user still exists
            const checkUserExist = 'SELECT * FROM useremail WHERE id = ?';

            myDB.query(checkUserExist, [decoded.email_id], async (error, userResults) => {
                if (userResults.length) {
                    if (userResults[0].user_type === 'donor') {
                        const donorData = 'SELECT * FROM donor WHERE email_id = ?';
                        myDB.query(donorData, [userResults[0].id], async (error, donorResults) => {
                            if (donorResults.length) {
                                req.user = donorResults[0];
                                req.type = 'donor';
                            }
                            next(); // Call next() here
                        });
                    }
                    else {
                        const collectorData = 'SELECT * FROM collector WHERE email_id = ?';
                        myDB.query(collectorData, [userResults[0].id], async (error, collectorResults) => {
                            req.user = collectorResults[0];
                            req.type = 'collector';

                            const sectorsData = 'SELECT * FROM donation_sector WHERE collector_id = ?';
                            myDB.query(sectorsData, [collectorResults[0].id], async (error, sectorsResult) => {
                                req.sectors = sectorsResult;
                                next();
                            })
                        });
                    }
                }

                else {
                    next(); // Call next() here for no user found
                }
            });
        } catch (error) {
            console.log(error);
            next(); // Call next() here for error case
        }
    } else {
        next();
    }
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(201).redirect('/');
};