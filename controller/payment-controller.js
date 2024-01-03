const database = require("../config");
// For Token
const jwt = require("jsonwebtoken");
const dateTimeUtil = require("../utils/date-time-util");

const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require('stripe')(STRIPE_SECRET_KEY);

const addNewCard = async (req, res) => {
    try {
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const email = decoded.email;

        let query = "SELECT * FROM user WHERE email = ?";
        let params = [email];

        database
            .query(query, params, (error, result) => {
                if (error) throw error;
                const plainPassword = req.body.password;
                try {
                    bcrypt.compare(plainPassword, result[0].password, async (err, isSame) => {
                        if (isSame) {
                            if (result[0] != null) {
                                if (result[0].stripe_id == null) {

                                    const customer = await stripe.customers.create({
                                        name: result[0].name,
                                        email: result[0].email
                                    });
                                    let userStripeId = customer.id;

                                    const decryptedCardNumber = decryptInformation(plainPassword, req.body.cardNumber);
                                    const decryptedCvc = decryptInformation(plainPassword, req.body.cvc);

                                    console.log("Card Number: " + decryptedCardNumber);
                                    console.log("Card CVC: " + decryptedCvc);

                                    const cardToken = await stripe.customers.createSource(
                                        userStripeId,
                                        {
                                            source: "tok_visa"
                                        }
                                    );

                                    // saveUserCardInfo(email, userStripeId, decryptedCardNumber, decryptedCvc, expirationDate);

                                    console.log(cardToken);
                                    res.status(200).send({ card: cardToken });
                                }
                                else {
                                    res.status(400).send({ success: false, msg: "User's card already exists" });
                                }
                            }
                        } else {
                            res.status(400).send("Invalid Password");
                        }
                    });

                } catch (error) {
                    res.status(400).send({ success: false, msg: error.message });
                }

            });

    } catch (error) {
        if (error.message === 'card is not defined') {
            res.status(200).send({ card: cardId });
        }
        else {
            console.log(error.name + ": " + error.message);
            res.status(400).send({ success: false, msg: error.message });
        }
    }

}

const createCharge = async (req, res) => {

    try {
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const email = decoded.email;

        let query = "SELECT * FROM user WHERE email = ?";
        let params = [email];

        database
            .query(query, params, async (error, result) => {
                try {
                    if (error) throw error;
                    if (result[0] != null) {
                        if (result[0].stripe_id == null) {
                            throw new Error("You haven't registered a card to payment")
                        }
                        else {
                            const paymentIntent = await stripe.paymentIntents.create({
                                customer: result[0].stripe_id,
                                amount: req.body.amount,
                                currency: 'VND',
                                payment_method: 'pm_card_visa',
                            });

                            res.status(200).send(
                                {
                                    success: true,
                                    paymentId: paymentIntent.id,
                                    paymentTime: dateTimeUtil.formatDateTime(new Date())
                                });
                        }
                    }
                } catch (error) {
                    res.status(400).send({ success: false, msg: error.message });
                }
            });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}

function saveUserCardInfo(email, userStripeId, cardNumber, cvc, expirationDate) {
    let query = "UPDATE user SET stripe_id = ?, card_number = ?, cvc = ?, expiration_date = ? WHERE email = ?";
    let params = [userStripeId, cardNumber, cvc, expirationDate, email];

    database.query(query, params, (error, result) => {
        if (error) throw error;
    });
}

function decryptInformation(password, encryptedInfo) {
    const key = crypto.createHash('sha256').update(password).digest();

    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    let decrypted = decipher.update(encryptedInfo, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = {
    addNewCard,
    createCharge
}