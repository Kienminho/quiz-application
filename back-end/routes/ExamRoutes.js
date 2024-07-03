const express = require("express");
const router = express.Router();

const ExamController = require("../controllers/ExamController");
const ExamRoutesValidations = require("./validators/ExamRoutes.validators");
const HandleBadRequest = require("../middlewares/HandleBadRequestMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

router.get(
  "/get-exams-by-current-user",
  AuthMiddleware,
  ExamController.getExamsByCurrentUser
);

router.post(
  "/create-exam",
  AuthMiddleware,
  ExamRoutesValidations.createExamValidation,
  HandleBadRequest,
  ExamController.createExam
);

module.exports = router;
