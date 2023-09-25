const express = require("express");
const router = express.Router();
// import file

const {
  createSize,
  filterSize,
  deleteSize,
  updateSize,
  getSizeById,
} = require("../../controller/size-controller");

router.post("/create", createSize);
router.post("/filter", filterSize);
router.post("/delete/:id", deleteSize);
router.post("/update", updateSize);
router.get("/:id", getSizeById);

module.exports = router;
