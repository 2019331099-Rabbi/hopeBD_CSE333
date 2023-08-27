const express = require('express');
const myDB = require('../models/dbConnect');
const router = express.Router();
const utils = require('../controllers/utility');
const authController = require('../controllers/auth');

router.get('/sectorDetails', authController.isLoggedIn, (req, res) => {
    const sectorId = req.query.sectorId;

    // Fetch the sector information from the donation_sector table
    const sectorQuery = `
    SELECT
        ds.id AS sector_id,
        ds.sector_name,
        ds.creation_date,
        ds.total_collection,
        ds.slogan,
        ds.is_verified,
        ds.photo as sector_photo,
        c.id AS collector_id,
        c.name AS collector_name,
        c.email_id,
        c.phone,
        c.district,
        c.profile_photo,
        c.validation_photo
    FROM donation_sector ds
    INNER JOIN collector c ON ds.collector_id = c.id
    WHERE ds.id = ?;`;

    const validationQuery = `SELECT photo_path
    FROM sector_verification_photo
    WHERE sector_id = ?;`;

    myDB.query(sectorQuery, [sectorId], (error, sectorResult) => {
        if (error) {
            console.error('Error fetching sector details:', error);
            return res.status(500).send('Error fetching sector details');
        }
        // console.log(sectorResult);
        myDB.query(validationQuery, [sectorId], async (error, validationResults) => {
            if (error) {
                console.error('Error fetching sector details:', error);
                return res.status(500).send('Error fetching sector details');
            }
            res.render('sectorDetailsAdmin', {
                sector: sectorResult[0],
                user_name: req.user_name,
                validationPhotos: validationResults
            });
        })
    });
});

router.post('/deleteSector', (req, res) => {
    const { sectorId, collectorId } = req.body;
    console.log(sectorId, collectorId);

    const deleteQuery = 'DELETE FROM donation_sector WHERE id = ?';

    myDB.query(deleteQuery, [sectorId], (error, deleteResult) => {
        if (error) {
            console.error('Error deleting sector:', error);
            return res.status(500).send('Error deleting sector');
        }
        res.redirect('/'); // Replace with your desired destination
    });
})

router.post('/acceptSector', (req, res) => {
    const { sectorId, collectorId } = req.body;
    console.log(sectorId, collectorId);

    const acceptQuery = `
    UPDATE donation_sector
    SET is_verified = 1
    WHERE id = ?;`;

    myDB.query(acceptQuery, [sectorId], (error, acceptResult) => {
        if (error) {
            console.error('Error deleting sector:', error);
            return res.status(500).send('Error deleting sector');
        }
        res.redirect('/'); // Replace with your desired destination
    });
})

module.exports = router;