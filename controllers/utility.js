const myDB = require('../models/dbConnect');

exports.loadCollector = async (req, res) => {
    const collectorName = req.body.searchCQ;
    const collectorId = req.body.selectedCollectorId;
    const sectorsQuery = 'SELECT * FROM donation_sector WHERE collector_id = ?';

    myDB.query(sectorsQuery, [collectorId], (error, results) => {
        if (error) {
            console.error('Error fetching sectors:', error);
        }
        else {
            const sectors = results;
            return res.status(200).render("collectorSector", {
                collectorName: collectorName,
                sectors: sectors
            });
        }
    }
    );
}

exports.suggestCollector = async (req, res) => {
    const query = req.query.query;

    myDB.query(`SELECT id, name FROM collector WHERE name LIKE ?`, [`%${query}%`], (error, results) => {
        if (error) {
            console.error('Error fetching suggestions:', error);
            res.status(500).json({ error: 'Error fetching suggestions' });
        } else {
            res.json(results);
        }
    });
}

exports.donateSector = async (req, res) => {
    if (req.user) {
        const sectorId = req.query.sectorId;
        const collectorId = req.query.collectorId;
        // Generate a MySQL query to fetch sector and collector information
        const sectorQuery = `
        SELECT ds.id AS sector_id, c.id AS collector_id, ds.*, c.*
        FROM donation_sector ds
        JOIN collector c ON ds.collector_id = c.id
        WHERE ds.id = ? AND c.id = ?`;

        // Execute the query
        myDB.query(sectorQuery, [sectorId, collectorId], (error, results) => {
            if (error) {
                console.error('Error fetching sector and collector information:', error);
            } else {
                const data = results[0]; // Assuming the query returns a single row
                console.log(data);
                return res.status(200).render('donateSector', {
                    user: req.user,
                    sector: data
                });
            }
        });
    }
    else {
        console.log("Token does not found");
        res.render("login", {
            message: "Log in first"
        });
    }
}

exports.newSector = async (req, res) => {
    if (req.user) {
        const collectorId = req.body.collectorId;
        res.render('addNewSector', {
            user: req.user
        });
    }
    else {
        res.render("login", {
            message: "Log in first"
        });
    }
}

exports.deleteSector = async (req, res) => {
    const { sectorId, collectorId } = req.body;
    console.log(sectorId, collectorId);

    const deleteQuery = 'DELETE FROM donation_sector WHERE id = ? and collector_id = ?';

    myDB.query(deleteQuery, [sectorId, collectorId], (error, deleteResult) => {
        if (error) {
            console.error('Error deleting sector:', error);
            return res.status(500).send('Error deleting sector');
        }
        res.redirect('/profile'); // Replace with your desired destination
    });
}

exports.addSector = async (req, res) => {
    const { sname, slogan, collectorId } = req.body;

    const insertQuery = 'INSERT INTO donation_sector (collector_id, sector_name, total_collection, slogan) VALUES (?, ?, 0.00, ?)';
    myDB.query(insertQuery, [collectorId, sname, slogan], (error, results) => {
        if (error) {
            console.error('Error inserting sector:', error);
            // Handle the error appropriately
        } else {
            console.log('Sector inserted successfully');
            // Redirect to a suitable page after adding the sector
            res.redirect('/profile'); // Replace with your desired destination
        }
    });
}

exports.sectorDetails = async (req, res) => {
    const sectorId = req.query.sectorId;
    const collectorId = req.query.collectorId;

    // Fetch the sector information from the donation_sector table
    const sectorQuery = 'SELECT * FROM donation_sector WHERE id = ? and collector_id = ?';
    const userQuery = 'SELECT * FROM collector WHERE id = ?';

    myDB.query(sectorQuery, [sectorId, collectorId], (error, sectorResults) => {
        if (error) {
            console.error('Error fetching sector details:', error);
            return res.status(500).send('Error fetching sector details');
        }
        const sectorDetails = sectorResults[0];
        myDB.query(userQuery, [collectorId], (error, collectorResults) => {
            if (error) {
                console.error('Error fetching collector details:', error);
                return res.status(500).send('Error fetching collector details');
            }
            const userDetails = collectorResults[0];
            res.render('sectorDetails', {
                sector: sectorDetails,
                user: userDetails,
                collectorId: collectorId
            });
        });
    });
}

exports.makeDonation = async (req, res) => {
    const { donorId, collectorId, sectorId, amount, paymentType, paymentGateway } = req.body;

    // Insert into the payment table
    const insertPaymentQuery = `
        INSERT INTO payment (donor_id, collector_id, sector_id, donation_date, amount, payment_type, provider, transaction_id)
        VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)`;

    const transaction = generateTransaction(); // Implement a function to generate a unique transaction

    myDB.query(insertPaymentQuery, [donorId, collectorId, sectorId, amount, paymentType, paymentGateway, transaction], (error, result) => {
        if (error) {
            console.error('Error inserting into payment:', error);
            // Handle the error appropriately
        } else {
            // Update total_collection in donation_sector table
            const updateTotalCollectionQuery = `
                UPDATE donation_sector
                SET total_collection = total_collection + ?
                WHERE id = ?`;
            
            myDB.query(updateTotalCollectionQuery, [amount, sectorId], (updateError, updateResult) => {
                if (updateError) {
                    console.error('Error updating total_collection:', updateError);
                    // Handle the error appropriately
                } else {
                    // Redirect to a suitable page after making the donation
                    res.redirect('/'); // Replace with your desired destination
                }
            });
        }
    });
};



const crypto = require('crypto');

function generateTransaction() {
    const transactionLength = 8; // Length of the desired transaction string
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    let transaction = '';
    for (let i = 0; i < transactionLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        transaction += characters[randomIndex];
    }
    
    return transaction;
}
