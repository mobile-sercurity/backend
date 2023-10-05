const database = require("../config");

const createSize = async (req, res) => {
  const size = req.body.size;

  const query = "INSERT INTO size values (?,?)";

  const args = [id, size];

  database.query(query, args, (error, result) => {
    if (error) {
      if (error.code === "ER_DUP_ENTRY") {
        res.status(500).send("Duplicate Entry");
      } else {
        throw error;
      }
    } else {
      res.status(200).json({ data: result, message: "Your size is added" });
    }
  });
};

const filterSize = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const size = req.body.size;

  let query = "SELECT COUNT(*) AS total FROM size";
  let params = [];

  if (size) {
    query = "SELECT COUNT(*) AS total FROM size WHERE size_name LIKE ?";
    params = [`%${size}%`];
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

    let filterQuery = "SELECT id, size_name as sizeName FROM size";
    let filterParams = [];

    if (size) {
      filterQuery += " WHERE size_name LIKE ?";
      filterParams = [`%${size}%`];
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

const deleteSize = async (req, res) => {
  const id = req.params.id;

  const query = "DELETE FROM size WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      throw error;
    } else {
      res.status(200).json({ data: result, message: "Your size is deleted" });
    }
  });
};

// update size
const updateSize = async (req, res) => {
  const id = req.body.id;
  const size = req.body.size;

  const query = "UPDATE size SET size_name = ? WHERE id = ?";

  const args = [size, id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      res.status(200).json({ data: result, message: "Your size is updated" });
    }
  });
};

// get size by id
const getSizeById = async (req, res) => {
  const id = req.params.id;

  const query = "SELECT * FROM size WHERE id = ?";

  const args = [id];

  database.query(query, args, (error, result) => {
    if (error) {
      res.status(500).json({ message: "Internal error server" });
      throw error;
    } else {
      if (result.length === 0) {
        res.status(404).json({ message: "Size not found" });
      } else {
        res.status(200).json({ data: result, message: "Success" });
      }
    }
  });
};

module.exports = {
  createSize,
  filterSize,
  deleteSize,
  updateSize,
  getSizeById,
};
