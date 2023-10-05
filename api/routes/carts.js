const express = require('express')
const router = express.Router()

// import file
const database = require("../../config")

// Get All products added to cart
router.get("/", (request, response) => {
    var userId = request.query.userId;
    var page = request.query.page;
    var page_size = request.query.page_size;

    console.log(typeof page);

    if(page == null){
        page = 0;
     }
 
     if(page_size == null){
        page_size = 25;
     }

     const args = [
        userId,
        userId,
        parseInt(page_size),
        parseInt(page)
    ];

    const query = `SELECT 
                 cart.id as cartID,
                 product.id,
                 product.product_name, 
                 product.price, 
                 (
                    SELECT product_image.image
                    FROM product_image 
                    WHERE product_image.product_id = product.id
                    LIMIT 1
                ) as image,
                 product.category, 
                 product.quantity, 
                 product.supplier, 

                 (
                    SELECT JSON_ARRAYAGG(color.color_code)
                    FROM product_color 
                    INNER JOIN color ON color.id = product_color.color_id
                    WHERE product_color.product_id = product.id
                ) as color,
                (
                    SELECT JSON_ARRAYAGG(size.size_name)
                    FROM product_size 
                    INNER JOIN size ON size.id = product_size.size_id
                    WHERE product_size.product_id = product.id
                ) as size,
                 cart.color as cart_color,
                 cart.size as cart_size,
                 (SELECT IF(COUNT(*) >= 1, TRUE, FALSE) FROM favorite WHERE favorite.user_id = ? AND favorite.product_id = product.id) as isFavourite
                 FROM Cart JOIN product JOIN User 
                 ON cart.product_id = product.id AND cart.user_id = user.id 
                 WHERE cart.is_order != 1 AND user_id = ? 
                 LIMIT ? OFFSET ?`

    database.query(query, args, (error, result) => {
        if(error) throw error;
        response.status(200).json({
            "carts" : result
        })

    })
});

// Add product to cart
router.post("/add", (request, response) => {
    const userId = request.body.userId
    const productId = request.body.productId
    const productColor = request.body.productColor
    const productSize = request.body.productSize
  
    const query = "INSERT INTO cart(user_Id, product_Id, size, color) VALUES(?, ?, ?, ?)"
   
    const args = [userId, productId, productSize, productColor]

    database.query(query, args, (error, result) => {
        if (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                response.status(500).send("Deplicate Entry")
            } else {
                throw error;
            }
        } else {
            response.status(200).send("Added to Cart")
        }
    });
});
      
// Remove product from Cart
router.delete("/remove", (request, response) => {
    const userId = request.query.userId;
    const productId = request.query.productId;
    const query = "DELETE FROM cart WHERE user_id = ? and id = ?"
    const args = [userId, productId]

    database.query(query, args, (error, result) => {
        if(error) throw error
        response.status(200).send("Removed from Cart")
    });
});
 
module.exports = router