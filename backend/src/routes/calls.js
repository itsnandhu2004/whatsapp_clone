const express = require("express");
const router = express.Router();
const { logCall, getCallHistory } = require("../controllers/callController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/", logCall);
router.get("/", getCallHistory);

module.exports = router;
