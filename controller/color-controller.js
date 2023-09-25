const database = require("../config");

// create color
const createColor = async (req, res) => {
  const color = req.body.color;
  const code = req.body.code;

  const query = "INSERT INTO color (color_name, color_code) VALUES (?, ?)";

  const args = [color, code];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res.status(200).json({ data: result, message: "Your color is created" });
    }
  });
};

// filter color
const filterColor = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const color = req.body.color;

  let query = "SELECT COUNT(*) AS total FROM color";
  let params = [];

  if (color) {
    query = "SELECT COUNT(*) AS total FROM color WHERE color_name LIKE ?";
    params = [`%${color}%`];
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

    let filterQuery = "SELECT * FROM color";
    let filterParams = [];

    if (color) {
      filterQuery += " WHERE color_name LIKE ?";
      filterParams = [`%${color}%`];
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

// update color
const updateColor = async (req, res) => {
  const id = req.body.id;
  const color = req.body.color;
  const code = req.body.code;

  const query = "UPDATE color SET color_name = ?, color_code = ? WHERE id = ?";

  const args = [color, code, id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res.status(200).json({ data: result, message: "Your color is updated" });
    }
  });
};

// delete color
const deleteColor = async (req, res) => {
  const id = req.params.id;

  const query = "DELETE FROM color WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res.status(200).json({ data: result, message: "Your color is deleted" });
    }
  });
};

// get color by id
const getColorById = async (req, res) => {
  const id = req.params.id;

  const query = "SELECT * FROM color WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      if (result.length === 0) {
        res.status(404).json({ message: "Color not found" });
      } else {
        res.status(200).json({ data: result, message: "Success" });
      }
    }
  });
};

module.exports = {
  createColor,
  filterColor,
  updateColor,
  deleteColor,
  getColorById,
};
