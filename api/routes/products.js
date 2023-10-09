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
const { cloudinary } = require("../../config/cloundinary");

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
    (
      SELECT product_image.image
      FROM product_image 
      WHERE product_image.product_id = product.id
      LIMIT 1
    ) as image,
    (
      SELECT JSON_ARRAYAGG(product_image.image)
      FROM product_image 
      WHERE product_image.product_id = product.id
    ) as listImage,
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
  console.log();
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
    (
      SELECT product_image.image
      FROM product_image 
      WHERE product_image.product_id = product.id
      LIMIT 1
    ) as image,
    (
      SELECT JSON_ARRAYAGG(product_image.image)
      FROM product_image 
      WHERE product_image.product_id = product.id
    ) as listImage,
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

// Filter product
router.post("/filter", (request, response) => {
  const { page = 1, limit = 10 } = request.query;
  const colorIds = request.body.colorIds;
  const sizeIds = request.body.sizeIds;
  const productName = request.body.productName;
  const minPrice = request.body.minPrice;
  const maxPrice = request.body.maxPrice;

  let query = "SELECT COUNT(*) AS total FROM product ";
  let params = [];

  if (colorIds && colorIds.length > 0) {
    query +=
      "INNER JOIN product_color ON product.id = product_color.product_id ";
    query += "WHERE product_color.color_id IN (?) ";
    params.push(colorIds);
  }

  if (sizeIds && sizeIds.length > 0) {
    if (colorIds && colorIds.length > 0) {
      query += " AND ";
    } else {
      query += " WHERE ";
    }
    query +=
      "EXISTS (SELECT 1 FROM product_size WHERE product.id = product_size.product_id AND product_size.size_id IN (?)) ";
    params.push(sizeIds);
  }

  if (productName) {
    if ((colorIds && colorIds.length > 0) || (sizeIds && sizeIds.length > 0)) {
      query += " AND ";
    } else {
      query += " WHERE ";
    }
    query += "product.product_name LIKE ? ";
    params.push(`%${productName}%`);
  }

  if (minPrice && maxPrice) {
    if (
      (colorIds && colorIds.length > 0) ||
      (sizeIds && sizeIds.length > 0) ||
      productName
    ) {
      query += " AND ";
    } else {
      query += " WHERE ";
    }
    query += "product.price BETWEEN ? AND ? ";
    params.push(minPrice, maxPrice);
  }

  database.query(query, params, (error, results) => {
    if (error) {
      console.error("Lỗi truy vấn CSDL:", error);
      response.status(500).json({ error: "Đã xảy ra lỗi khi truy vấn CSDL" });
      return;
    }

    const total = results[0].total;
    const totalPage = Math.ceil(total / limit);

    const offset = (page - 1) * limit;
    const limitParam = parseInt(limit);

    let filterQuery = `
      SELECT 
        product.*,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', color.id, 'colorName', color.color_name))
          FROM product_color
          JOIN color ON product_color.color_id = color.id
          WHERE product_color.product_id = product.id
        ) as colors,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', size.id, 'sizeName', size.size_name))
          FROM product_size
          JOIN size ON product_size.size_id = size.id
          WHERE product_size.product_id = product.id
        ) as sizes,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', product_image.id, 'image', product_image.image))
          FROM product_image 
          WHERE product_image.product_id = product.id
        ) as images
      FROM product
    `;

    let filterParams = [];

    if (colorIds && colorIds.length > 0) {
      filterQuery +=
        " WHERE EXISTS (SELECT 1 FROM product_color WHERE product_color.product_id = product.id AND product_color.color_id IN (?))";
      filterParams.push(colorIds);
    }

    if (sizeIds && sizeIds.length > 0) {
      if (colorIds && colorIds.length > 0) {
        filterQuery += " AND ";
      } else {
        filterQuery += " WHERE ";
      }
      filterQuery +=
        " EXISTS (SELECT 1 FROM product_size WHERE product_size.product_id = product.id AND product_size.size_id IN (?))";
      filterParams.push(sizeIds);
    }

    if (productName) {
      if (
        (colorIds && colorIds.length > 0) ||
        (sizeIds && sizeIds.length > 0)
      ) {
        filterQuery += " AND ";
      } else {
        filterQuery += " WHERE ";
      }
      filterQuery += "product.product_name LIKE ?";
      filterParams.push(`%${productName}%`);
    }

    if (minPrice && maxPrice) {
      if (
        (colorIds && colorIds.length > 0) ||
        (sizeIds && sizeIds.length > 0) ||
        productName
      ) {
        filterQuery += " AND ";
      } else {
        filterQuery += " WHERE ";
      }
      filterQuery += "product.price BETWEEN ? AND ? ";
      filterParams.push(minPrice, maxPrice);
    }

    filterQuery += " LIMIT ?, ?;";
    filterParams.push(offset, limitParam);

    database.query(filterQuery, filterParams, (error, products) => {
      if (error) {
        console.error("Lỗi truy vấn CSDL:", error);
        response.status(500).json({ error: "Đã xảy ra lỗi khi truy vấn CSDL" });
        return;
      }

      // Chuyển chuỗi JSON thành mảng objects
      products.forEach((product) => {
        product.colors = JSON.parse(product.colors);
      });

      // Chuyển chuỗi JSON thành mảng objects
      products.forEach((product) => {
        product.sizes = JSON.parse(product.sizes);
      });

      // Chuyển chuỗi JSON thành mảng objects
      products.forEach((product) => {
        product.images = JSON.parse(product.images);
      });

      response.json({
        total,
        totalPage,
        page: parseInt(page),
        limit: limitParam,
        products,
      });
    });
  });
});

// Create product
router.post("/create", uploadImage.array("image", 5), (request, response) => {
  const name = request.body.name;
  const price = request.body.price;
  const quantity = request.body.quantity;
  const supplier = request.body.supplier;
  const category = request.body.category;
  const colorIds = request.body.colorIds;
  const sizeIds = request.body.sizeIds;

  const files = request.files;

  const filePaths = files.map((file) => file.path);

  const query =
    "INSERT INTO product(product_name, price, quantity, supplier, category) VALUES(?, ?, ?, ?, ?)";

  const args = [name, price, quantity, supplier, category];

  database.query(query, args, (error, result) => {
    if (error) {
      response.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      const productId = result.insertId;

      const arrColorId = Array.isArray(colorIds) ? colorIds : [colorIds];

      // Thêm màu vào sản phẩm
      if (arrColorId && Array.isArray(arrColorId) && arrColorId.length > 0) {
        arrColorId.map((colorId) => {
          const colorValues = [productId, Number(colorId)];

          const insertColorQuery =
            "INSERT INTO product_color (product_id, color_id) VALUES (?, ?)";
          database.query(
            insertColorQuery,
            colorValues,
            (error, colorResult) => {
              if (error) {
                console.log("error...458", error);
                response.status(500).json({ message: "Internal error server" });
                throw error;
              }
            }
          );
        });
      }

      const arrSizeId = Array.isArray(sizeIds) ? sizeIds : [sizeIds];
      // Thêm thể loại vào sản phẩm
      if (arrSizeId && Array.isArray(arrSizeId) && arrSizeId?.length > 0) {
        arrSizeId?.map((sizeId) => {
          const sizeValues = [productId, Number(sizeId)];
          const insertSizeQuery =
            "INSERT INTO product_size (product_id, size_id) VALUES (?, ?)";
          database.query(
            insertSizeQuery,
            sizeValues,
            (error, categoryResult) => {
              if (error) {
                response.status(500).json({ message: "Internal error server" });
                throw error;
              }
            }
          );
        });
      }

      filePaths.forEach((filePath) => {
        // cloudinary.uploader.upload(filePath, (error, result) => {
        // if (error) {
        //   return response
        //     .status(500)
        //     .json({ message: "Error uploading image" });
        // }

        // const imageUrl = result.secure_url;

        const insertImageQuery =
          "INSERT INTO product_image (product_id, image) VALUES (?, ?)";
        const imageValues = [productId, filePath];

        database.query(insertImageQuery, imageValues, (error, imageResult) => {
          if (error) {
            return response
              .status(500)
              .json({ message: "Internal error server" });
          }
        });
      });
      // });
    }

    return response
      .status(200)
      .json({ data: result, message: "Product created successfully" });
  });
});

// api update product
router.post(
  "/updateProduct",
  uploadImage.array("image", 5),
  (request, response) => {
    const id = request.body.id;
    const name = request.body.name;
    const price = request.body.price;
    const quantity = request.body.quantity;
    const supplier = request.body.supplier;
    const category = request.body.category;
    const colorIds = request.body.colorIds;
    const sizeIds = request.body.sizeIds;
    const imageDel = request.body.imageDel || [];

    const files = request.files;
    const newFilePaths = files ? files.map((file) => file.path) : [];

    const filePaths = [...newFilePaths];

    const query =
      "UPDATE product SET product_name = ? , price = ? , quantity = ? , supplier = ? , category = ? WHERE id = ? ";

    const args = [name, price, quantity, supplier, category, id];

    database.query(query, args, (error, result) => {
      if (error) {
        response.status(500).json({ message: "Internal error server" });
        throw error;
      }

      const arrColorId = Array.isArray(colorIds) ? colorIds : [colorIds];

      const deleteColorsQuery =
        "DELETE FROM product_color WHERE product_id = ?";
      database.query(deleteColorsQuery, [id], (error, deleteColorResult) => {
        if (error) {
          response
            .status(500)
            .json({ message: "Internal error server (Colors)" });
          throw error;
        }

        if (arrColorId && Array.isArray(arrColorId) && arrColorId.length > 0) {
          arrColorId.forEach((colorId) => {
            const colorValues = [id, Number(colorId)];
            const insertColorQuery =
              "INSERT INTO product_color (product_id, color_id) VALUES (?, ?)";
            database.query(
              insertColorQuery,
              colorValues,
              (error, colorResult) => {
                if (error) {
                  response
                    .status(500)
                    .json({ message: "Internal error server (Colors)" });
                  throw error;
                }
              }
            );
          });
        }

        const arrSizeId = Array.isArray(sizeIds) > 0 ? sizeIds : [sizeIds];

        const deleteSizesQuery =
          "DELETE FROM product_size WHERE product_id = ?";
        database.query(deleteSizesQuery, [id], (error, deleteSizeResult) => {
          if (error) {
            response
              .status(500)
              .json({ message: "Internal error server (Sizes)" });
            throw error;
          }

          if (arrSizeId && Array.isArray(arrSizeId) && arrSizeId.length > 0) {
            arrSizeId.forEach((sizeId) => {
              const sizeValues = [id, Number(sizeId)];
              const insertSizeQuery =
                "INSERT INTO product_size (product_id, size_id) VALUES (?, ?)";
              database.query(
                insertSizeQuery,
                sizeValues,
                (error, categoryResult) => {
                  if (error) {
                    response
                      .status(500)
                      .json({ message: "Internal error server (Sizes)" });
                    throw error;
                  }
                }
              );
            });
          }

          const deleteImagesQuery =
            "DELETE FROM product_image WHERE product_id = ? AND id = ?";
          const insertImageQuery =
            "INSERT INTO product_image (product_id, image) VALUES (?, ?)";

          // Xoá các ảnh
          const arrImageDel = Array.isArray(imageDel) ? imageDel : [imageDel];
          if (arrImageDel.length > 0) {
            arrImageDel?.forEach((imageId) => {
              database.query(
                deleteImagesQuery,
                [id, Number(imageId)],
                (error, deleteImageResult) => {
                  if (error) {
                    response
                      .status(500)
                      .json({ message: "Internal error server (Images)" });
                    throw error;
                  }
                }
              );
            });
          }

          // Thêm ảnh mới
          if (newFilePaths.length > 0) {
            filePaths.forEach((filePath) => {
              // cloudinary.uploader.upload(filePath, (error, result) => {
              //   if (error) {
              //     return response
              //       .status(500)
              //       .json({ message: "Error uploading image" });
              //   }

              // const imageUrl = result.secure_url;
              const imageValues = [id, filePath];
              database.query(
                insertImageQuery,
                imageValues,
                (error, imageResult) => {
                  if (error) {
                    response
                      .status(500)
                      .json({ message: "Internal error server (Images)" });
                    throw error;
                  }
                }
              );
            });
            // });
          }

          response.status(200).json({
            data: result,
            message: "Product updated successfully",
          });
        });
      });
    });
  }
);

// APi get by id
router.get("/getById/:id", (req, res) => {
  const id = req.params.id;

  const getProductQuery = `
    SELECT 
      product.*,
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', color.id, 'colorName', color.color_name))
        FROM product_color
        JOIN color ON product_color.color_id = color.id
        WHERE product_color.product_id = ?
      ) as colors,
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', size.id, 'sizeName', size.size_name))
        FROM product_size
        JOIN size ON product_size.size_id = size.id
        WHERE product_size.product_id = ?
      ) as sizes,
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', product_image.id, 'image', product_image.image))
        FROM product_image 
        WHERE product_image.product_id = product.id
      ) as images
    FROM product
    WHERE id = ?
  `;

  database.query(getProductQuery, [id, id, id, id], (error, results) => {
    if (error) {
      console.error("Lỗi truy vấn CSDL:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi truy vấn CSDL" });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      return;
    }

    const product = results[0];
    product.colors = JSON.parse(product.colors);
    product.sizes = JSON.parse(product.sizes);
    product.images = JSON.parse(product.images);

    res.status(200).json({ data: product, message: "Successfully" });
  });
});

// delete product with id
router.post("/deleteProduct", async (request, response) => {
  const id = request.body.id;

  await database.query("DELETE FROM product_color WHERE product_id = ?", [id]);
  await database.query("DELETE FROM product_size WHERE product_id = ?", [id]);
  await database.query("DELETE FROM product_image WHERE product_id = ?", [id]);

  const query = "DELETE FROM product WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      response.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      response.status(200).json({ data: result, message: "Product deleted" });
    }
  });
});

module.exports = router;
