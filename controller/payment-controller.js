const database = require("../config");
// For Token
const jwt = require("jsonwebtoken");
const dateTimeUtil = require("../utils/date-time-util");

const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const addNewCard = async (req, res) => {
    try {
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const email = decoded.email;

        let query = "SELECT * FROM user WHERE email = ?";
        let params = [email];

        database
            .query(query, params, async (error, result) => {
                if (error) throw error;
                if (result[0] != null) {
                    let userStripeId = null;
                    if (result[0].stripe_id == null) {
                        const customer = await stripe.customers.create({
                            name: result[0].name,
                            email: result[0].email
                        });
                        userStripeId = customer.id;
                        saveUserStripeId(email, userStripeId);
                    }
                    else {
                        userStripeId = result[0].stripe_id;
                    }
                    const cardToken = await stripe.customers.createSource(
                        userStripeId,
                        {
                            source: req.body.cardNumber
                        }
                    );
                    console.log(cardToken);
                    res.status(200).send({ card: cardToken });
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

function saveUserStripeId(email, userStripeId) {
    let query = "UPDATE user SET stripe_id = ? WHERE email = ?";
    let params = [userStripeId, email];

    database.query(query, params, (error, result) => {
        if (error) throw error;
    });
}


module.exports = {
    addNewCard,
    createCharge
}