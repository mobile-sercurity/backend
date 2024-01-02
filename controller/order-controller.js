const database = require("../config");

// filter ordering
const filterOrder = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const orderNumber = req.body.orderNumber;
  const status = req.body.status;

  let query = " SELECT COUNT(*) AS total FROM ordering ";
  let params = [];

  if (orderNumber) {
    query += " WHERE order_number LIKE ? ";
    params.push(`%${orderNumber}%`);
  }

  if (status != null) {
    if (orderNumber) {
      query += " AND ";
    } else {
      query += " WHERE ";
    }
    query += " status = ?";
    params.push(`%${status}%`);
  }

  database.query(query, params, (error, results) => {
    if (error) {
      console.error("Lỗi truy vấn CSDL:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi truy vấn CSDL" });
      return;
    }

    const total = results[0].total;
    const totalPage = Math.ceil(total / limit);

    const offset = (page - 1) * limit;
    const limitParam = parseInt(limit);

    let filterQuery = "Select * from ordering";
    let filterParams = [];

    if (orderNumber) {
      filterQuery += " WHERE order_number LIKE ?";
      filterParams.push(`%${orderNumber}%`);
    }

    if (status != null) {
      if (orderNumber) {
        filterQuery += " AND ";
      } else {
        filterQuery += " WHERE ";
      }
      filterQuery += "status = ?";
      filterParams.push(`%${status}%`);
    }

    filterQuery += ` LIMIT ?, ?; `;
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

// update ordering
const updateOrder = async (req, res) => {
  const id = req.body.id;
  const status = req.body.status;

  let query = "UPDATE ordering SET status = ? WHERE ordering_id = ?";
  let params = [status, id];

  database.query(query, params, (error, result) => {
    if (error) throw error;

    res.status(200).json({
      message: "Order updated successfully",
    });
  });
};

// get by id
const getOrderById = async (req, res) => {
  const id = req.params.id;

  let query = `
    SELECT od.*,
    JSON_OBJECT('userId', user.id, 'userName', user.name, 'email', user.email) as user ,
    JSON_OBJECT('productId', product.id, 'productName', product.product_name, 'price', product.price, 'supplier', product.supplier, 'category', product.category) as product
    FROM ordering od
    LEFT JOIN user ON user.id = od.user_id
    LEFT JOIN product ON product.id = od.product_id
    WHERE od.ordering_id = ?
    `;
  let params = [id];

  database.query(query, params, (error, result) => {
    if (error) {
      console.error("Lỗi truy vấn CSDL:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi truy vấn CSDL" });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({
        error: "Không tìm thấy đơn hàng",
      });
      return;
    }

    const userObject = JSON.parse(result[0].user);
    const productObject = JSON.parse(result[0].product);

    const finalResult = {
      ...result[0],
      user: userObject,
      product: productObject,
    };

    return res.status(200).json({
      data: finalResult,
      message: "Successfully",
    });
  });
};

module.exports = { filterOrder, updateOrder, getOrderById };
