const express = require("express");
const {
  createCategory,
  getCategoryById,
  filterCategory,
  updateCategory,
  deleteCategory,
} = require("../../controller/category-controller");
const router = express.Router();

router.post("/create", createCategory);
router.post("/filter", filterCategory);
router.post("/update", updateCategory);
router.post("/delete/:id", deleteCategory);
router.get("/:id", getCategoryById);

module.exports = router;
