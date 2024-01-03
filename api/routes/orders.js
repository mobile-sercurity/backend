const express = require("express");
const router = express.Router();

// import file
const database = require("../../config");

const util = require("../../utils/mail");
const util2 = require("../../utils/encrypt");
const {
  filterOrder,
  updateOrder,
  getOrderById,
} = require("../../controller/order-controller");

const orderStatusCode = require("../../constant/order-const");

// Order a product
router.post("/add", (request, response) => {
  var status = request.body.status;
  const name_on_card = request.body.name_on_card;
  var card_number = request.body.card_number;
  const expiration_date = request.body.expiration_date;
  const userId = request.body.userId;
  const cartId = request.body.productId;
  var order_number;

    card_number = util2.encrypt(card_number)
    
    order_number = '88' + util.getRandomInt(100000, 999999)
    
    if(typeof status == 'undefined' && status == null){
        status = orderStatusCode.PendingConfirm;
    }

    const query = "INSERT INTO Ordering(order_number, order_date ,status,name_on_card, card_number,expiration_date,user_id, cart_id) VALUES(?,NOW(),?,?,?,?,?,?)"
    const args = [order_number,status, name_on_card, card_number, expiration_date, userId, cartId]

    database.query(query, args, (error, result) => {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                response.status(500).send("Deplicate Entry")
            } else {
                throw error;
            }
        } else {
            response.status(200).send("You ordered a product")
        }
    });
});

router.get("/", (request, response) => {
  const productId = request.body.id;

  var order_number;

  const queryCategory = "SELECT category FROM product WHERE id = ?";
  database.query(queryCategory, productId, (error, result) => {
    if (error) throw error;

    result = result[0]["category"];

    console.log(result);

    if (result === "mobile") {
      console.log("hello");
      order_number = 55 + getRandomInt(100000, 999999);
    } else if (result == "laptop") {
      order_number = 66 + getRandomInt(100000, 999999);
    } else if (result == "baby") {
      order_number = 77 + getRandomInt(100000, 999999);
    } else if (result == "toy") {
      order_number = 88 + getRandomInt(100000, 999999);
    }

    response.status(200).json({
      category: result,
    });
  });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
});

// Get Orders
router.get("/get", (request, response) => {
  var userId = request.query.userId;
  var page = request.query.page;
  var page_size = request.query.page_size;

  if (page == null || page < 1) {
    page = 1;
  }

  if (page_size == null) {
    page_size = 20;
  }

  // OFFSET starts from zero
  const offset = page - 1;
  // OFFSET * LIMIT
  page = offset * page_size;

  const args = [userId, parseInt(page_size), parseInt(page)];

  const query = `SELECT DISTINCT Ordering.order_number,
                          DATE_FORMAT(Ordering.order_date, '%d/%m/%Y') As order_date, 
                          Ordering.status,Product.product_name,
                          Product.price,
                          Product.id,
                          User.name,
                          Ordering.status as status,
                          Shipping.address as address,
                          Shipping.phone as phone,
                          Shipping.address
                          FROM Ordering 
                          INNER JOIN cart ON cart.id = Ordering.cart_id 
                          INNER JOIN Product ON Product.id = cart.product_id
                          JOIN User 
                          INNER JOIN Shipping ON Ordering.cart_id  = Shipping.cart_id
                          WHERE Ordering.user_id = ? 
                          GROUP BY cart.id
                          LIMIT ? OFFSET ?`

  database.query(query, args, (error, orders) => {
    if (error) throw error;
    response.status(200).json({
      page: offset + 1,
      error: false,
      orders: orders,
    });
  });
});

// order
router.post("/filter", filterOrder);
router.post("/update", updateOrder);
router.get("/getById/:id", getOrderById);

module.exports = router;
