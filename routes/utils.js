const express = require('express');
const myDB = require('../models/dbConnect');
const router = express.Router();
const utils = require('../controllers/utility');

const authController = require('../controllers/auth');

router.get('/suggest', utils.suggestCollector);
router.post('/searchCollector', utils.loadCollector);
router.get('/donateSector', authController.isLoggedIn, utils.donateSector);
router.get('/sectorDetails', utils.sectorDetails);

router.post('/deleteSector', utils.deleteSector);
router.post('/newSector', authController.isLoggedIn, utils.newSector);
router.post('/addSector', utils.addSector);
router.post('/makeDonation', utils.makeDonation);

module.exports = router;