const express = require("express");
const router = express.Router();
const authController = require('../controllers/auth');
const utils = require('../controllers/utility');

router.get("/", authController.isLoggedIn, utils.recentSectors, (req, res) => {
    res.render("home", {
        user: req.user,
        sectors: req.sectors
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

