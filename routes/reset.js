/**
 * Express used for https requests
 */
const express = require("express");

/**
 * Crypto module required for hashing
 */
const crypto = require("crypto");

let path = require('path');

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
const jwt = require("jsonwebtoken");

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * UTF-8 Validator module
 */
const isValidUTF8 = require('utf-8-validate');

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Accessing hash function in utilities
 */
let getHash = require('../utilities/utils').getHash;

/**
 * sendEmail function in utilities utilizing Nodemailer
 */
let sendVerificationEmail = require('../utilities/utils').sendVerificationEmail;

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * This allows parsing of the body of POST requests, that are url encoded
 */
router.use(bodyParser.urlencoded());

/**
 * Config object for jwt creation
 */
config = {
    secret: process.env.JSON_SECRET
};

/**
 * @api {post} /reset Request to update a password
 * @apiName PostReset
 * @apiGroup Reset
 *
 * @apiParam {String} name JWT token containing email name info
 * @apiParam {String} password users desired new password
 * @apiParam {String} confirm users desired new password, again for confirmation
 *
 * @apiSuccess (Success 201) {boolean} success true when password is updated
 * @apiSuccess (Success 201) {String} message informs user that password was successfully updated
 *
 * @apiError (400: Bad Token) {String} message "Token expired or invalid"
 *
 * @apiError (400: Bad Request) {String} message "Invalid request"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.post('/', (req, res) => {
    res.type("application/json");
    if (req.body.name && req.body.password && req.body.confirm && req.body.password === req.body.confirm) {
        let decoded = jwt.decode(req.body.name);
        let values = [decoded.email];
        let theQuery = "SELECT MemberID, Salt FROM Members WHERE Email = $1";
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount > 0) {
                    let updateQuery = "UPDATE Members SET Password = $1 WHERE Email = $2";
                    let salt = result.rows[0].salt;
                    let newPW = getHash(req.body.password, salt);
                    pool.query(updateQuery, [newPW, values[0]])
                        .then(result => {
                            res.redirect("/reset");
                            // res.status(201).send({
                            //     success: true,
                            //     message: "Password updated!"
                            // });
                        })
                        .catch(err => {
                            res.redirect("/attemptfail");
                            // res.status(400).send({
                            //     message: err.detail
                            // });
                        });
                } else {
                    res.redirect("/attemptfail");
                    // res.status(400).send({
                    //     message: "Request failed. Please contact support" +
                    //         " regarding your account"
                    // });
                }
            })
            .catch(err => {
                res.redirect("/attemptfail");
                // res.status(400).send({
                //     message: err.detail
                // })
            });
    } else {
        res.redirect("/attemptfail");
        // res.status(400).send({
        //     message: "Invalid request"
        // });
    }
});

/**
 * @api {get} /reset Success HTML splash for finalizing after posting to reset.
 * @apiName GetReset
 * @apiGroup Reset
 *
 * @apiSuccess (Success 201) {HTML} path Redirects to the success page
 *
 * @apiError (404: Not Found) {String} message "No such path exists"
 *
 */
router.get("/", (req, res) => {
    res.status(200).sendFile(path.join(__dirname + '/support/reset_success.html'));
});

module.exports = router;