const database = require("../config");

// create Category
const createCategory = (req, res) => {
  const category = req.body.category;

  const query = "INSERT INTO category (category_name) VALUES (?)";

  const args = [category];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res
        .status(200)
        .json({ data: result, message: "Your category is created" });
    }
  });
};

// filter category
const filterCategory = (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const category = req.body.category;

  let query = "SELECT COUNT(*) AS total FROM category";
  let params = [];

  if (category) {
    query = "SELECT COUNT(*) AS total FROM category WHERE category_name LIKE ?";
    params = [`%${category}%`];
  }

  database.query(query, params, (error, result) => {
    if (error) {
      console.error("Lỗi truy vấn cơ sở dữ liệu:", error);
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
      return;
    }

    const total = result[0].total;
    const totalPage = Math.ceil(total / limit);

    const offset = (page - 1) * limit;
    const limitParam = parseInt(limit);

    let filterQuery = "SELECT * FROM category";
    let filterParams = [];

    if (category) {
      filterQuery += " WHERE category_name LIKE ?";
      filterParams = [`%${category}%`];
    }

    filterQuery += ` LIMIT ?, ?;`;
    filterParams.push(offset, limitParam);

    database.query(filterQuery, filterParams, (error, data) => {
      if (error) {
        console.error("Lỗi truy vấn cơ sở dữ liệu:", error);
        res
          .status(500)
          .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
        return;
      }

      res.json({
        total,
        totalPage: totalPage,
        page: parseInt(page),
        limit: limitParam,
        data,
      });
    });
  });
};

// update category
const updateCategory = (req, res) => {
  const id = req.params.id;
  const category = req.body.category;

  const query = "UPDATE category SET category_name = ? WHERE id = ?";

  const args = [category, id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res
        .status(200)
        .json({ data: result, message: "Your category is updated" });
    }
  });
};

// delete category
const deleteCategory = (req, res) => {
  const id = req.params.id;

  const query = "DELETE FROM category WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res
        .status(200)
        .json({ data: result, message: "Your category is deleted" });
    }
  });
};

// get category by id
const getCategoryById = (req, res) => {
  const id = req.params.id;

  const query = "SELECT * FROM category WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res.status(200).json({ data: result, message: "Get category success" });
    }
  });
};

module.exports = {
  createCategory,
  filterCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
