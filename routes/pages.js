const express = require("express");
const router = express.Router();
const authController = require('../controllers/auth');
const utils = require('../controllers/utility');

router.post('/', (req, res) => {
    const categories = req.body.categories;
    req.session.selectedCategories = categories;
    res.redirect('/');
})

router.get("/", authController.isLoggedIn, utils.recentSectors, (req, res) => {
    if (req.type == 'admin') {
        res.render("adminHome", {
            user_name: req.user_name,
            pendingSectors: req.pendingSectors
        })
    }
    else {
        
        res.render("home", {
            user: req.user,
            sectors: req.sectors
        });
    }
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

router.get("/profile", authController.isLoggedIn, utils.listPayments, (req, res) => {
    if (req.user) {
        if (req.type === 'donor') {
            res.render("profileD", {
                user: req.user,
                listPayments: req.listPayments
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

