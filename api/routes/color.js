const express = require("express");
const {
  createColor,
  filterColor,
  deleteColor,
  updateColor,
  getColorById,
} = require("../../controller/color-controller");
const router = express.Router();

router.post("/create", createColor);
router.post("/filter", filterColor);
router.post("/update", updateColor);
router.post("/delete/:id", deleteColor);
router.get("/:id", getColorById);

module.exports = router;
