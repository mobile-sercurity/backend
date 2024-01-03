const database = require("../config");
// For Token
const jwt = require("jsonwebtoken");
const dateTimeUtil = require("../utils/date-time-util");

const bcrypt = require("bcrypt");
const crypto = require("crypto");

const orderStatusCode = require("../constant/order-const");
const util = require("../utils/mail");

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

                                    //test password: 123456
                                    const decryptedCardNumber = decryptInformation("12345678", req.body.cardNumber);
                                    const decryptedCvc = decryptInformation("12345678", req.body.cvc);

                                    console.log("Card Number: " + decryptedCardNumber);
                                    console.log("Card CVC: " + decryptedCvc);

                                    const cardToken = await stripe.customers.createSource(
                                        userStripeId,
                                        {
                                            source: "tok_visa"
                                        }
                                    );
                                    
                                    const expirationDate = req.body.month + "/" + req.body.year;
                                    saveUserCardInfo(email, userStripeId, req.body.cardNumber, req.body.cvc, expirationDate, req.body.nameOnCard);

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

                            const cartId = req.body.cartId;

                            savePaidByVisaOrder(result[0].id, cartId);
                            saveCartIsOrderedStatus(cartId);

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

async function saveUserCardInfo(email, userStripeId, cardNumber, cvc, expirationDate, nameOnCard) {
    let query = "UPDATE user SET stripe_id = ?, card_number = ?, cvc = ?, expiration_date = ?, name_on_card = ? WHERE email = ?";
    let params = [userStripeId, cardNumber, cvc, expirationDate, nameOnCard, email];

    database.query(query, params, (error, result) => {
        if (error) throw error;
    });
}

async function savePaidByVisaOrder(userId, cartId) {
    const order_number = '88' + util.getRandomInt(100000, 999999);
    const status = orderStatusCode.PaidByVisa;

    const query = "INSERT INTO ordering(order_number, order_date , status, user_id, cart_id) VALUES(?, NOW(), ?, ?, ?)";
    const args = [order_number, status, userId, cartId];

    database.query(query, args, (error, result) => {
        if (error) {
            throw error;
        }
    });
}

async function saveCartIsOrderedStatus(cartId) {
    const query = "UPDATE cart SET is_order = 1 WHERE id = ?";
    const args = [cartId];

    database.query(query, args, (error, result) => {
        if (error) {
            throw error;
        }
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