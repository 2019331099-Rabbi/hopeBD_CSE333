const express = require("express");
const router = express.Router();
const authController = require('../controllers/auth');

router.get("/", authController.isLoggedIn, (req, res) => {
    res.render("home", {
        user: req.user
    });
});

router.get("/registerD", (req, res) => {
    res.render('registerDonor');
});

router.get("/registerC", (req, res) => {
    res.render('registerCollector');
});

router.get("/login", (req, res) => {
    res.render('login');
});

router.get("/profile", authController.isLoggedIn, (req, res) => {
    if (req.user) {
        if (req.type === 'donor') {
            console.log(req.user);
            res.render("profileD", {
                user: req.user
            });
        }
        else {
            res.render("profileC", {
                user: req.user,
                sectors: req.sectors
            });
        }
    }
    else {
        console.log("Token does not found");
        res.redirect("/login");
    }
});

module.exports = router;

