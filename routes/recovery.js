/**
 * Express used for https requests
 */
const express = require("express");

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * sendRecoveryEmail function in utilities utilizing Nodemailer
 */
let sendRecoveryEmail = require('../utilities/utils').sendRecoveryEmail;

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
let jwt = require('jsonwebtoken');

/**
 * Config object for jwt creation
 */
config = {
    secret: process.env.JSON_SECRET
};

/**
 * @api {post} /recovery Request to register a user
 * @apiName PostRecovery
 * @apiGroup Recovery
 *
 * @apiParam {String} email a users email
 *
 * @apiSuccess (Success 201) {boolean} acknowledge true when request is received
 * @apiSuccess (Success 201) {String} message "Recovery email sent!"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiError (404: Email Not Found) {String} message "Email not found"
 *
 */
router.post('/', (request, response) => {
    response.type("application/json");
    const email = request.body.email;

    let theQuery = "SELECT FirstName, LastName FROM Members WHERE Email=$1";
    let values = [email];

    //TODO: What status code will an acknowledge be?
    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 0) {
                //email does not match
                //TODO: Remove message, change status code?
                response.status(404).send({
                    acknowledge: true,
                    message: 'Email not found'
                });
                return;
            }
            let first = result.rows[0].firstname;
            let last = result.rows[0].lastname;

            
            //send password reset email using firstname and lastname
            //TODO: implement send password
            sendRecoveryEmail(email, first, last);

            response.status(201).send({
                acknowledge: true,
                message: "Recovery email sent"
            })
        })
        .catch((err) => {
            //unable to query, log error
            //TODO: Okay for error response here?
            response.status(400).send({
                acknowledge: false,
                message: err.detail
            })
        });

    
});

module.exports = router;