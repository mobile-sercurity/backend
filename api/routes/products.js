const express = require("express");
const router = express.Router();

// Deal with file
const fileSystem = require("fs");

// Upload and store images
const multer = require("multer");

const storage = multer.diskStorage({
  // Place of picture
  destination: (request, file, callback) => {
    callback(null, "storage_product/");
  },
  filename: (request, file, callback) => {
    const avatarName = Date.now() + file.originalname;
    callback(null, avatarName);
  },
});

const uploadImage = multer({
  storage: storage,
});

// import file
const database = require("../../config");
const checkAuth = require("../../middleware/check_auth");

// Get All products
router.get("/all", (request, response) => {
  var page = request.query.page;
  var page_size = request.query.page_size;

  if (page == null || page < 1) {
    page = 1;
  }

  if (page_size == null) {
    page_size = 20;
  }

  // OFFSET starts from zero
  page = page - 1;
  // OFFSET * LIMIT
  page = page * page_size;

  const args = [parseInt(page_size), parseInt(page)];

  const query = "SELECT * FROM product LIMIT ? OFFSET ?";
  database.query(query, args, (error, result) => {
    if (error) throw error;
    response.status(200).json({
      page: page + 1,
      error: false,
      products: result,
    });
  });
});

// Get products by category
router.get("/", (request, response) => {
  const user_id = request.query.userId;
  const category = request.query.category;
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
  page = offset * page_size; // 20

  const args = [
    user_id,
    user_id,
    category,
    parseInt(page_size),
    parseInt(page),
  ];

  //const query = "SELECT * FROM product WHERE category = ? LIMIT ? OFFSET ?";
  const query = `SELECT product.id,
    product.product_name,
    product.price,
    product.quantity,
    product.supplier,
    product.image,
    product.category,
    (SELECT IF(COUNT(*) >= 1, TRUE, FALSE) FROM favorite WHERE favorite.user_id = ? AND favorite.product_id = product.id) as isFavourite,
    (SELECT IF(COUNT(*) >= 1, TRUE, FALSE) FROM cart WHERE cart.user_id = ? AND cart.product_id = product.id) as isInCart
    FROM product 
    WHERE category = ? 
    LIMIT ? OFFSET ?`;

  database.query(query, args, (error, result) => {
    if (error) throw error;
    response.status(200).json({
      page: offset + 1, //2
      error: false,
      products: result,
    });
  });
});

// Search for products
router.get("/search", (request, response) => {
  const user_id = request.query.userId;
  const keyword = request.query.q?.toLowerCase();
  var page = request.query.page;
  var page_size = request.query.page_size;

  if (page == null || page < 1) {
    page = 1;
  }

  if (page_size == null) {
    page_size = 20;
  }

  // OFFSET starts from zero
  page = page - 1;
  // OFFSET * LIMIT
  page = page * page_size;

  const searchQuery = "%" + keyword + "%";

  const args = [
    user_id,
    user_id,
    searchQuery,
    searchQuery,
    parseInt(page_size),
    parseInt(page),
  ];

  //const query = "SELECT * FROM product WHERE product_name LIKE ? OR category LIKE ? LIMIT ? OFFSET ?";

  const query = `SELECT product.id,
    product.product_name,
    product.price,
    product.quantity,
    product.supplier,
    product.image,
    product.category,
    (SELECT IF(COUNT(*) >= 1, TRUE, FALSE) FROM favorite WHERE favorite.user_id = ? AND favorite.product_id = product.id) as isFavourite,
    (SELECT IF(COUNT(*) >= 1, TRUE, FALSE) FROM cart WHERE cart.user_id = ? AND cart.product_id = product.id) as isInCart
    FROM product 
    WHERE product_name LIKE ? OR category LIKE ?
    LIMIT ? OFFSET ?`;

  database.query(query, args, (error, result) => {
    if (error) throw error;
    response.status(200).json({
      page: page + 1,
      error: false,
      products: result,
    });
  });
});

// Filter product
router.post("/filter", (request, response) => {
  const { page = 1, limit = 10 } = req.query;
  const colorIds = req.body.colorIds;

  let query = "SELECT COUNT(*) AS total FROM product ";
  let params = [];
});

// Insert Product
router.post(
  "/insert",
  // checkAuth,
  uploadImage.single("image"),
  (request, response) => {
    const name = request.body.name;
    const price = request.body.price;
    const quantity = request.body.quantity;
    const supplier = request.body.supplier;
    const category = request.body.category;

    const file = request.file;
    var filePath = "";
    if (file != null) {
      filePath = file.path;
    }

    const query =
      "INSERT INTO product(product_name, price, quantity, supplier, category, image) VALUES(?, ?, ?, ?, ?,?)";

    const args = [name, price, quantity, supplier, category, filePath];

    database.query(query, args, (error, result) => {
      if (error) throw error;
      response.status(200).send("Product Inserted");
    });
  }
);

// Create product
router.post("/create", uploadImage.single("image"), (request, response) => {
  const name = request.body.name;
  const price = request.body.price;
  const quantity = request.body.quantity;
  const supplier = request.body.supplier;
  const category = request.body.category;
  const colorIds = request.body.colorIds;
  const sizeIds = request.body.sizeIds; // Corrected field name

  const file = request.file;
  var filePath = "";
  if (file != null) {
    filePath = file.path;
  }

  const query =
    "INSERT INTO product(product_name, price, quantity, supplier, image, category) VALUES(?, ?, ?, ?, ?, ?)";

  const args = [name, price, quantity, supplier, filePath, category];

  database.query(query, args, (error, result) => {
    if (error) {
      response.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      const productId = result.insertId;
      const arrColorId = JSON.parse(colorIds);
      console.log("arrColorId...", typeof arrColorId);
      console.log("arrColorId...123", Array.isArray(arrColorId));
      // Thêm màu vào sản phẩm
      if (arrColorId && Array.isArray(arrColorId) && arrColorId.length > 0) {
        const insertColorQuery =
          "INSERT INTO product_color (product_id, color_id) VALUES (?, ?)";
        const colorValues = arrColorId.map((colorId) => [productId, colorId]);
        console.log("colorValues///", colorValues);
        database.query(
          insertColorQuery,
          [colorValues],
          (error, colorResult) => {
            if (error) {
              return response
                .status(500)
                .json({ message: "Internal error server" });
              // throw error;
            }
          }
        );
      }

      console.log("sizeIds...", sizeIds);
      const arrSizeId = JSON.parse(sizeIds);
      // Thêm thể loại vào sản phẩm
      if (arrSizeId && Array.isArray(arrSizeId) && arrSizeId?.length > 0) {
        const insertSizeQuery =
          "INSERT INTO product_size (product_id, size_id) VALUES (?, ?)";
        const sizeValues = arrSizeId?.map((sizeId) => [productId, sizeId]); // Corrected field name
        console.log("sizeValues...", sizeValues);
        database.query(
          insertSizeQuery,
          [sizeValues],
          (error, categoryResult) => {
            if (error) {
              return response
                .status(500)
                .json({ message: "Internal error server" });
              // throw error;
            }
          }
        );
      }
    }

    return response
      .status(200)
      .json({ data: result, message: "Product created successfully" });
  });
});

// Delete Product
router.delete("/:id", (request, response) => {
  const id = request.params.id;
  const query = "DELETE FROM product WHERE id = ?";
  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) throw error;
    response.status(200).send("Product is deleted");
  });
});

// Update image of product
router.put("/update", uploadImage.single("image"), (request, response) => {
  const id = request.body.id;

  const file = request.file;
  var filePath = "";
  if (file != null) {
    filePath = file.path;
  }

  const selectQuery = "SELECT image FROM product WHERE id = ?";
  database.query(selectQuery, id, (error, result) => {
    console.log(result);
    if (error) throw error;
    try {
      // Get value from key image
      var image = result[0]["image"];
      // Delete old image
      fileSystem.unlinkSync(image);
    } catch (err) {
      console.error("Can't find file in storage/pictures Path");
    }
  });

  const query = "UPDATE product SET image = ? WHERE id = ?";

  const args = [filePath, id];

  database.query(query, args, (error, result) => {
    if (error) throw error;

    if (result["affectedRows"] == 1) {
      response.status(200).send("Product Image is updated");
    } else {
      response.status(500).send("Invalid Update");
    }
  });
});

module.exports = router;
