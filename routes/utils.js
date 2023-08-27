const express = require('express');
const myDB = require('../models/dbConnect');
const router = express.Router();
const utils = require('../controllers/utility');
const authController = require('../controllers/auth');

router.get('/suggest', utils.suggestCollector);
router.post('/searchCollector', authController.isLoggedIn, utils.loadCollector);
router.get('/donateSector', authController.isLoggedIn, utils.donateSector);
router.get('/sectorDetails', utils.sectorDetails);

router.post('/deleteSector', utils.deleteSector);
router.post('/newSector', authController.isLoggedIn, utils.newSector);
router.post('/addSector', utils.addSector);
router.post('/makeDonation', utils.makeDonation);
router.post('/payment/success', utils.successPayment);
router.post('/updateProfilePhoto', (req, res) => {
    const collectorId = req.body.collectorId;
    const profilePhoto = req.files.profilePhoto;
    const uploadPath = __dirname + '/..' + '/upload/' + 'collectorimg/' + profilePhoto.name;
    console.log(uploadPath);
    console.log(profilePhoto);

    profilePhoto.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send("Error in inserting photo");
        }
        else {
            const updateQuery =
                `UPDATE collector
                SET profile_photo = ?
                WHERE id = ?`;
            myDB.query(updateQuery, [profilePhoto.name, collectorId], (error, results) => {
                if (error) {
                    console.error('Error in updating profile:', error);
                    // Handle the error appropriately
                } else {
                    // console.log('Sector inserted successfully');
                    // Redirect to a suitable page after adding the sector
                    res.redirect('/profile'); // Replace with your desired destination
                }
            });
        }
    });
});



module.exports = router;