const myDB = require('../models/dbConnect');
const { v4: uuidv4 } = require('uuid');

exports.loadCollector = async (req, res) => {
    const collectorName = req.body.searchCQ;
    const collectorId = req.body.selectedCollectorId;
    const sectorsQuery = 'SELECT * FROM donation_sector WHERE collector_id = ?';

    myDB.query(sectorsQuery, [collectorId], (error, sectorResults) => {
        if (error) {
            console.error('Error fetching sectors:', error);
        }
        else {
            const collectorQuery = `
            SELECT name, phone, district, profile_photo
            FROM collector 
            WHERE id = ?;`;
            myDB.query(collectorQuery, [collectorId], (error, collctorResults) => {
                if (error) console.log(error);
                else {
                    return res.status(200).render("collectorSector", {
                        collector: collctorResults[0],
                        sectors: sectorResults,
                        user: req.user
                    });
                }
            })
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

    const projectPhoto = req.files.projectPhoto;
    const uploadPath = __dirname + '/..' + '/upload/' + 'sectorimg/' + projectPhoto.name;
    console.log(uploadPath);
    console.log(projectPhoto);

    // use mv() to place the file on the server
    projectPhoto.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send("Error in inserting photo");
        }
        else {
            const insertQuery = `INSERT INTO donation_sector (collector_id, sector_name, creation_date, total_collection, slogan, photo)
            VALUES (?, ?, NOW(), 0.00, ?, ?)`;
            myDB.query(insertQuery, [collectorId, sname, slogan, projectPhoto.name], (error, results) => {
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
    });
}

exports.sectorDetails = async (req, res) => {
    const sectorId = req.query.sectorId;
    const collectorId = req.query.collectorId;

    // Fetch the sector information from the donation_sector table
    const sectorQuery = 'SELECT * FROM donation_sector WHERE id = ? and collector_id = ?';
    const userQuery = 'SELECT * FROM collector WHERE id = ?';
    const paymentQuery = `SELECT p.amount, p.transaction_id, d.name
    FROM payment p
    INNER JOIN donor d ON p.donor_id = d.id
    WHERE p.collector_id = ? AND p.sector_id = ?;`;

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

            myDB.query(paymentQuery, [collectorId, sectorId], (error, paymentResults) => {
                if (error) {
                    console.error('Error fetching collector details:', error);
                    return res.status(500).send('Error fetching collector details');
                }
                // console.log(collectorId, sectorId);
                // console.log(paymentResults);
                const userDetails = collectorResults[0];
                res.render('sectorDetails', {
                    sector: sectorDetails,
                    user: userDetails,
                    collectorId: collectorId,
                    paymentResults: paymentResults,
                });
            })
        });
    });
}

const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = 'hopeb64e608aeca1ed'
const store_passwd = 'hopeb64e608aeca1ed@ssl'
const is_live = false //true for live, false for sandbox

exports.makeDonation = async (req, res) => {
    const { amount, paymentType, paymentGateway } = req.body;
    const donorId = req.query.donorId;
    const collectorId = req.query.collectorId;
    const sectorId = req.query.sectorId;
    // console.log(req.body);

    const donorQuery = `SELECT name FROM donor WHERE id = ?`;
    myDB.query(donorQuery, [donorId], (err, donorResults) => {
        if (err) console.log(err);
        else {
            const name = donorResults[0].name;
            const tran_id = uuidv4();
            const data = {
                total_amount: amount,
                currency: 'BDT',
                tran_id: tran_id, // use unique tran_id for each api call
                success_url: `http://localhost:5001/utils/payment/success?tran_id=${tran_id}&donorId=${donorId}&sectorId=${sectorId}&collectorId=${collectorId}&amount=${amount}&paymentType=${paymentType}&paymentGateway=${paymentGateway}`,
                fail_url: 'http://localhost:3030/fail',
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: name,
                cus_email: 'customer@example.com',
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            // console.log(data);
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.redirect(GatewayPageURL)
                console.log('Redirecting to: ', GatewayPageURL)
            });
        }
    })
};

exports.successPayment = async (req, res) => {
    const { tran_id, donorId, sectorId, collectorId, amount, paymentType, paymentGateway } = req.query;

    // Insert into the payment table
    const insertPaymentQuery = `
        INSERT INTO payment (donor_id, collector_id, sector_id, donation_date, amount, payment_type, provider, transaction_id)
        VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)`;

    myDB.query(insertPaymentQuery, [donorId, collectorId, sectorId, amount, paymentType, paymentGateway, tran_id], (error, result) => {
        if (error) {
            console.error('payment error');
        } else {
            // Update total_collection in donation_sector table
            const updateTotalCollectionQuery = `
                UPDATE donation_sector
                SET total_collection = total_collection + ?
                WHERE id = ?`;

            myDB.query(updateTotalCollectionQuery, [amount, sectorId], async (err, updateResult) => {
                if (err) {
                    console.error('Update Error');
                } else {
                    res.redirect('/'); // Replace with your desired destination
                }
            });
        }
    });

}

exports.recentSectors = async (req, res, next) => {
    if (req.type == 'admin') {
        next();
    }
    else {
        const sectorQuery = `
        SELECT *
        FROM donation_sector
        WHERE is_verified = 1
        ORDER BY creation_date DESC
        LIMIT 4;`;
        myDB.query(sectorQuery, async (error, results) => {
            if (error) {
                console.error('Error fetching sectors:', error);
            }
            else {
                req.sectors = results;
                next();
            }
        });
    }
};
