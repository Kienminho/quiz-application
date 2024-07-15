const { StatusCodes } = require("http-status-codes");
const { Op } = require("sequelize");
const moment = require("moment");
const ExcelJS = require("exceljs");

const Competitions = require("../models/Competitions");
const ApiError = require("../controllers/error/ApiError");
const ApiResponse = require("../controllers/response/ApiResponse");
const ExamsOfCompetition = require("../models/ExamsOfCompetition");
const Unit = require("../models/Unit");
const ExamBanking = require("../models/ExamBanking");
const Organizer = require("../models/Organizer");
const QuestionBanking = require("../models/QuestionBanking");
const AnswerBanking = require("../models/AnswerBanking");
const Participant = require("../models/Participant");
const UserAnswers = require("../models/UserAnswers");
const sequelize = require("sequelize");

const uploadImage = async (req, res) => {
  const filename = req.file.filename;
  res.status(StatusCodes.OK).json(ApiResponse(`/${filename}`, 1));
};

const getListCompetition = async (req, res, next) => {
  try {
    const { pageIndex = 1, pageSize = 50, keyword = "" } = req.query;
    const currentTime = new Date();

    // Construct the where clause
    let whereClause = {
      timeStart: {
        [Op.lte]: currentTime,
      },
      timeEnd: {
        [Op.gte]: currentTime,
      },
      name: {
        [Op.like]: `%${keyword}%`,
      },
      isPublic: true,
    };

    // Calculate offset
    const offset = (+pageIndex - 1) * +pageSize;

    // Find competitions with pagination
    const { count, rows: competitions } = await Competitions.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "bannerUrl",
        "name",
        "timeStart",
        "unitGroupName",
        "timeEnd",
      ],
      order: [["timeStart", "ASC"]],
      limit: +pageSize,
      offset: offset,
    });

    // Respond with paginated data
    return res.status(StatusCodes.OK).json(ApiResponse(competitions, count));
  } catch (error) {
    console.error("Error fetching competitions:", error);
    next(error);
  }
};

const getCompetitionsByUser = async (req, res, next) => {
  try {
    const { pageIndex = 1, pageSize = 50, keyword = "" } = req.query;

    // Construct the where clause
    let whereClause = {
      name: {
        [Op.like]: `%${keyword}%`,
      },
      creatorId: req.user.id,
    };

    // Calculate offset
    const offset = (+pageIndex - 1) * +pageSize;

    // Find competitions with pagination
    const { count, rows: competitions } = await Competitions.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "bannerUrl",
        "name",
        "timeStart",
        "unitGroupName",
        "timeEnd",
        "isPublic",
      ],
      order: [["timeStart", "ASC"]],
      limit: +pageSize,
      offset: offset,
    });

    const resData = competitions.map((item) => {
      return {
        id: item.id,
        bannerUrl:
          item.bannerUrl ??
          "https://myaloha.vn/image/default/banner-contest.png",
        name: item.name,
        timeStart: item.timeStart,
        timeEnd: item.timeEnd,
        unitGroupName: item.unitGroupName,
        isPublic: item.isPublic ? "Xuất bản" : "Chỉnh sửa",
        numberOfExams: 0, //hard code
      };
    });

    // Respond with paginated data
    return res.status(StatusCodes.OK).json(ApiResponse(resData, count));
  } catch (error) {
    next(error);
  }
};

const createCompetition = async (req, res, next) => {
  try {
    const {
      id,
      bannerUrl,
      name,
      rules,
      password,
      themeColor,
      timeStart,
      timeEnd,
      infoRequire,
    } = req.body;

    let competition = null;
    if (id) {
      competition = await Competitions.findByPk(id);
      if (!competition) {
        throw new ApiError(
          ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
        );
      }

      competition.bannerUrl = bannerUrl ?? competition.bannerUrl;
      competition.name = name ?? competition.name;
      competition.rules = rules ?? competition.name;
      competition.password = password ?? competition.password;
      competition.themeColor = themeColor ?? competition.themeColor;
      competition.timeStart = timeStart ?? competition.timeStart;
      competition.timeEnd = timeEnd ?? competition.timeEnd;
      competition.infoRequire = infoRequire ?? competition.infoRequire;

      await competition.save();
    } else {
      competition = await Competitions.create({
        bannerUrl,
        name,
        rules,
        password,
        themeColor,
        timeStart,
        timeEnd,
        infoRequire,
        creatorId: req.user.id,
      });

      await competition.save();
    }

    res.status(StatusCodes.CREATED).json(ApiResponse(competition.id, 1));
  } catch (error) {
    next(error);
  }
};

const getCompetitionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const competition = await Competitions.findByPk(id);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    const participant = await Participant.count({
      where: {
        idCompetition: id,
      },
    });

    const organizer = await Organizer.findOne({
      where: {
        competitionId: competition.id,
      },
      attributes: ["id", "name", "address", "email", "phone"],
    });

    const resData = {
      bannerUrl: competition.bannerUrl,
      name: competition.name,
      rules: competition.rules,
      password: competition.password,
      themeColor: competition.themeColor,
      timeStart: competition.timeStart,
      timeEnd: competition.timeEnd,
      testAttempts: competition.testAttempts,
      participant: participant,
      infoRequire: competition.infoRequire.split(",").map((item) => +item),
      organizer: organizer,
    };

    res.status(StatusCodes.OK).json(ApiResponse(resData, 1));
  } catch (error) {
    next(error);
  }
};

const listInfoRequired = (req, res) => {
  //create array object {id, label}
  const listInfo = [
    { id: 1, label: "Họ tên thí sinh" },
    { id: 2, label: "Email" },
    { id: 3, label: "Ngày sinh" },
    { id: 4, label: "Số điện thoại" },
    { id: 5, label: "CCCD/CMND" },
    { id: 6, label: "Nghề nghiệp" },
    { id: 7, label: "Giới tính" },
    { id: 8, label: "Lớp, MSSV,Nơi công tác" },
  ];

  res.status(StatusCodes.OK).json(ApiResponse(listInfo, listInfo.length));
};

const getExamsOfCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const competition = await Competitions.findByPk(id);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    const exams = await ExamsOfCompetition.findAll({
      where: {
        competitionId: id,
        isDeleted: false,
      },
      attributes: ["id", "examBankingId"],
    });

    //get total question mcq and essay from examBankingId
    const examBankings = await ExamBanking.findAll({
      where: {
        id: exams.map((item) => item.examBankingId),
      },
      attributes: ["id", "total_mc_questions", "total_essay_questions"],
    });

    const resData = {
      isMix: competition.isMix,
      testDuration: competition.testDuration,
      testAttempts: competition.testAttempts,
      examOfCompetitions: examBankings.map((item) => {
        const exam = exams.find((exam) => exam.examBankingId === item.id);
        return {
          id: exam.id,
          examBankingId: item.id,
          totalMCQuestion: item.total_mc_questions,
          totalEssayQuestion: item.total_essay_questions,
        };
      }),
    };

    res.status(StatusCodes.OK).json(ApiResponse(resData));
  } catch (error) {
    next(error);
  }
};

const chooseExamForCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      isMix,
      testDuration = 0,
      testAttempts = 0,
      examOfCompetitions,
    } = req.body;

    const competition = await Competitions.findByPk(id);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }
    //add test duration, test attempts to competition
    competition.testDuration = testDuration;
    competition.testAttempts = testAttempts;
    competition.isMix = isMix;

    const examsCompetition = [];
    for (const examOfCompetition of examOfCompetitions) {
      if (examOfCompetition.id) {
        const exam = await ExamsOfCompetition.findByPk(examOfCompetition.id);
        if (!exam) {
          throw new ApiError(
            ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Exam not found")
          );
        }
        exam.examBankingId = examOfCompetition.examBankingId;
        await exam.save();
      } else {
        examsCompetition.push({
          competitionId: id,
          examBankingId: examOfCompetition.examBankingId,
        });
      }
    }

    //save changes competition and exams of competition
    await competition.save();
    const createdExams = await ExamsOfCompetition.bulkCreate(examsCompetition);
    const resData = createdExams.map((item) => item.id);
    res.status(StatusCodes.OK).json(ApiResponse(resData, 1));
  } catch (error) {
    next(error);
  }
};

const deleteExamForCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const examOfCompetition = await ExamsOfCompetition.findByPk(id);

    if (!examOfCompetition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Exam not found")
      );
    }

    await examOfCompetition.destroy();

    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    next(error);
  }
};

const addUnitsForCompetitions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subUnits, unitGroupName } = req.body;

    const competition = await Competitions.findByPk(id);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    competition.unitGroupName = unitGroupName;

    const unitsCompetition = [];

    for (const subUnit of subUnits) {
      const unit = {
        competitionId: id,
        name: subUnit,
      };
      unitsCompetition.push(unit);
    }

    await competition.save();
    await Unit.bulkCreate(unitsCompetition);

    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    next(error);
  }
};

const getUnitsOfCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;

    const units = await Unit.findAll({
      where: {
        competitionId: id,
      },
      attributes: ["id", "name"],
    });

    res.status(StatusCodes.OK).json(ApiResponse(units, units.length));
  } catch (error) {
    next(error);
  }
};

const updateSubUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Unit not found")
      );
    }

    unit.name = name;
    await unit.save();

    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    next(error);
  }
};

const deleteSubUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Unit not found")
      );
    }
    //remove unit from database
    await unit.destroy();
    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    next(error);
  }
};

const infoOrganizer = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const { id, name, address, email, phone } = req.body;

    const competition = await Competitions.findByPk(competitionId);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    if (id) {
      const organizer = await Organizer.findByPk(id);
      if (!organizer) {
        throw new ApiError(
          ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Organizer not found")
        );
      }

      organizer.name = name;
      organizer.address = address;
      organizer.email = email;
      organizer.phone = phone;

      await organizer.save();
    } else {
      await Organizer.create({
        name,
        address,
        email,
        phone,
        competitionId,
      });
    }

    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const getOrganizerByCompetition = async (req, res, next) => {
  try {
    const { competitionId } = req.params;

    const organizer = await Organizer.findOne({
      where: {
        competitionId,
      },
      attributes: ["id", "name", "address", "email", "phone"],
    });

    res.status(StatusCodes.OK).json(ApiResponse(organizer, 1));
  } catch (error) {
    next(error);
  }
};

const publishCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;

    const competition = await Competitions.findByPk(id);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    competition.isPublic = !competition.isPublic;
    await competition.save();

    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    next(error);
  }
};

//#region  Làm bài thi
const getAllQuestionOfCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;

    const competition = await Competitions.findOne({
      where: {
        id,
        isPublic: true,
        isDeleted: false,
      },
      attributes: ["isMix", "testDuration"],
    });

    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    if (competition.testAttempts > 0) {
      const totald = await d.count({
        where: {
          idCompetition: id,
        },
      });

      if (totald >= competition.testAttempts) {
        throw new ApiError(
          ApiResponse(
            false,
            0,
            StatusCodes.BAD_REQUEST,
            "Competition has reached the maximum number of d"
          )
        );
      }
    }

    const examBankings = await ExamsOfCompetition.findAll({
      where: {
        competitionId: id,
      },
      attributes: ["examBankingId"],
    });

    //get all question and answer of examBankingId
    const questionBankings = await QuestionBanking.findAll({
      where: {
        idExamBanking: examBankings.map((item) => item.examBankingId),
      },
      attributes: ["id", "title", "type"],
    });

    const answers = await AnswerBanking.findAll({
      where: {
        idQuestionBanking: questionBankings.map((item) => item.id),
      },
      attributes: ["id", "answer", "isCorrect", "idQuestionBanking"],
    });

    const resData = {
      isMix: competition.isMix,
      testDuration: competition.testDuration ?? 0,
      questions: questionBankings.map((question) => {
        const answer = answers.filter(
          (item) => item.idQuestionBanking === question.id
        );
        return {
          id: question.id,
          title: question.title,
          type: question.type,
          answers: answer.map((item) => {
            return {
              id: item.id,
              answer: item.answer,
              isCorrect: item.isCorrect,
            };
          }),
        };
      }),
    };

    res.status(StatusCodes.OK).json(ApiResponse(resData, resData.length));
  } catch (error) {
    next(error);
  }
};

const saveResultCompetition = async (req, res, next) => {
  const { id } = req.params;
  const { participant, results } = req.body;

  try {
    // save
    const newParticipant = await Participant.create({
      idCompetition: id,
      ...participant,
    });

    const examBankings = await ExamsOfCompetition.findAll({
      where: {
        competitionId: id,
      },
      attributes: ["examBankingId"],
    });

    //get all question and answer of examBankingId
    const questionBankings = await QuestionBanking.findAll({
      where: {
        idExamBanking: examBankings.map((item) => item.examBankingId),
      },
      attributes: ["id", "title", "type"],
    });

    const answers = await AnswerBanking.findAll({
      where: {
        idQuestionBanking: questionBankings.map((item) => item.id),
      },
      attributes: ["id", "answer", "isCorrect", "idQuestionBanking"],
    });

    //equals correct answer with chosen answer and save data to userAnswer, after calculate correctAnswersRate by type question
    const userAnswers = [];
    let correctAnswersRate = 0;
    let totalCorrectAnswers = 0;
    for (const result of results) {
      const {
        questionId,
        chosenAnswerId = null,
        typeQuestion,
        answerText,
      } = result;
      //typequestion === essay => save to userAnswer with answerText
      if (typeQuestion === "ESSAY") {
        userAnswers.push({
          questionId,
          chosenOption: chosenAnswerId,
          typeQuestion,
          participantId: newParticipant.id,
          answerText,
          isCorrect: null,
        });
      } else {
        const correctAnswer =
          answers.find(
            (item) => item.idQuestionBanking === questionId && item.isCorrect
          ) ?? {};
        const chosenAnswer =
          answers.find((item) => item.id === chosenAnswerId) ?? {};
        if (chosenAnswer.isCorrect) {
          totalCorrectAnswers++;
        }
        userAnswers.push({
          questionId,
          chosenOption: chosenAnswerId ?? null,
          correctOption: correctAnswer.id,
          typeQuestion: typeQuestion,
          participantId: newParticipant.id,
          isCorrect:
            chosenAnswerId == null
              ? false
              : correctAnswer.id === chosenAnswerId,
        });
      }
    }

    correctAnswersRate = (totalCorrectAnswers / questionBankings.length) * 100;
    newParticipant.totalCorrectAnswers = totalCorrectAnswers;
    newParticipant.correctAnswersRate = correctAnswersRate;

    await newParticipant.save();
    await UserAnswers.bulkCreate(userAnswers);

    const resData = {
      userName: newParticipant.fullName,
      totalCorrectAnswers,
      correctAnswersRate,
    };

    res.status(StatusCodes.OK).json(ApiResponse(resData));
  } catch (error) {
    next(error);
  }
};
//#endregion

const statisticParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fromDate,
      toDate,
      pageIndex = 1,
      pageSize = 50,
      keyword = "",
    } = req.query;

    const { data, count } = await getResultParticipant(
      id,
      fromDate,
      toDate,
      pageIndex,
      pageSize,
      keyword,
      next
    );

    res.status(StatusCodes.OK).json(ApiResponse(data, count));
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const competition = await Competitions.findByPk(id);
    const {
      fromDate = competition.timeStart,
      toDate = competition.timeEnd,
      pageIndex = 1,
      pageSize = 50,
      keyword = "",
    } = req.query;

    const { data } = await getResultParticipant(
      id,
      fromDate,
      toDate,
      pageIndex,
      pageSize,
      keyword,
      next
    );

    console.log(1 + " " + data);

    // Initialize a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Kết quả");
    const worksheet2 = workbook.addWorksheet("Thống kê lượt đăng ký");
    const worksheet3 = workbook.addWorksheet("Kết quả cao nhất");

    // Set up worksheet 1
    worksheet.columns = [
      { header: "Họ tên", key: "fullName", width: 20 },
      { header: "Số điện thoại", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 20 },
      { header: "Ngày dự thi", key: "createdAt", width: 20 },
      { header: "Kết quả", key: "totalCorrectAnswers", width: 20 },
      { header: "Độ chính xác", key: "correctAnswersRate", width: 20 },
      { header: "Thời gian làm", key: "duration", width: 20 },
    ];

    // Add data to the worksheet
    data.forEach((d) => {
      worksheet.addRow({
        fullName: d.fullName ?? "",
        phone: d.phone ?? "",
        email: d.email ?? "",
        createdAt: d.createdAt ?? "",
        totalCorrectAnswers: d.totalCorrectAnswers ?? "",
        correctAnswersRate: d.correctAnswersRate ?? "",
        duration: d.duration ?? "",
      });
    });

    // Set up worksheet 2
    worksheet2.columns = [
      { header: "Đơn vị", key: "unitName", width: 20 },
      { header: "Lượt đăng ký", key: "total", width: 20 },
    ];

    const statisticUnit = await getStatisticUnitOfCompetition(id, next);
    console.log(2 + " " + statisticUnit);

    statisticUnit.forEach((d) => {
      worksheet2.addRow({
        unitName: d.unitName ?? "",
        total: d.total ?? "",
      });
    });

    // Set up worksheet 3
    // Set up worksheet 1
    worksheet3.columns = [
      { header: "Họ tên", key: "fullName", width: 20 },
      { header: "Số điện thoại", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 20 },
      { header: "Ngày dự thi", key: "createdAt", width: 20 },
      { header: "Kết quả", key: "totalCorrectAnswers", width: 20 },
      { header: "Độ chính xác", key: "correctAnswersRate", width: 20 },
      { header: "Thời gian làm", key: "duration", width: 20 },
    ];

    let duration = "";
    const pHightestScore = await getParticipantHightestScore(id, next);
    console.log(3 + " " + pHightestScore);

    if (pHightestScore.startTime != null && pHightestScore.finishTime != null) {
      const timeDistance = moment(pHightestScore.finishTime).diff(
        moment(pHightestScore.startTime)
      );
      duration = moment.duration(timeDistance);
    }

    worksheet3.addRow({
      fullName: pHightestScore.fullName ?? "",
      phone: pHightestScore.phone ?? "",
      email: pHightestScore.email ?? "",
      createdAt: pHightestScore.createdAt ?? "",
      totalCorrectAnswers: pHightestScore.totalCorrectAnswers ?? "",
      correctAnswersRate: pHightestScore.correctAnswersRate ?? "",
      duration:
        duration === "" ? "" : `${duration.minutes()}:${duration.seconds()}`,
    });

    // Set the response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Ket-qua-cuoc-thi-${id}.xlsx`
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);

    res.status(StatusCodes.OK).end();
  } catch (error) {
    next(error);
  }
};

const getResultParticipant = async (
  id,
  fromDate,
  toDate,
  pageIndex = 1,
  pageSize = 50,
  keyword = "",
  next
) => {
  try {
    const whereClause = {
      idCompetition: id,
      fullName: {
        [Op.like]: `%${keyword}%`,
      },
      createdAt: {
        [Op.gte]: fromDate,
        [Op.lte]: toDate,
      },
    };

    const offset = (+pageIndex - 1) * +pageSize;

    const { count, rows: participant } = await Participant.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "fullName",
        "phone",
        "email",
        "createdAt",
        "totalCorrectAnswers",
        "correctAnswersRate",
        "startTime",
        "finishTime",
      ],
      order: [["createdAt", "DESC"]],
      limit: +pageSize,
      offset: offset,
    });

    if (participant.length === 0) {
      return {
        data: [],
        count: 0,
      };
    }

    const resData = participant.map((item) => {
      const timeDistance = moment(item.finishTime).diff(moment(item.startTime));
      const duration = moment.duration(timeDistance);
      return {
        id: item.id,
        fullName: item.fullName,
        totalCorrectAnswers: item.totalCorrectAnswers,
        correctAnswersRate: item.correctAnswersRate,
        duration: `${duration.minutes()}:${duration.seconds()}`,
        createdAt: item.createdAt,
      };
    });

    return {
      data: resData,
      count,
    };
  } catch (error) {
    next(error);
  }
};

const getStatisticUnitOfCompetition = async (id, next) => {
  try {
    //group participant by unit and count
    const data = await Participant.findAll({
      where: {
        idCompetition: id,
      },
      attributes: ["idSubUnit", [sequelize.fn("COUNT", "id"), "total"]],
      group: ["idSubUnit"],
      //get name of unit
      include: [
        {
          model: Unit,
          attributes: ["name"],
        },
      ],
    });

    if (data.length === 0) return [];

    const resData = data.map((item) => {
      return {
        unitName: item.Unit.name,
        total: item.get("total"),
      };
    });

    return resData;
  } catch (error) {
    next(error);
  }
};

const getParticipantHightestScore = async (id, next) => {
  try {
    const data = await Participant.findOne({
      where: {
        idCompetition: id,
      },
      attributes: [
        "id",
        "fullName",
        "phone",
        "email",
        "createdAt",
        "totalCorrectAnswers",
        "correctAnswersRate",
        "startTime",
        "finishTime",
      ],
      order: [["correctAnswersRate", "DESC"]],
    });

    return data != null
      ? data
      : {
          id: "",
          fullName: "",
          createdAt: "",
          totalCorrectAnswers: "",
          correctAnswersRate: "",
          startTime: null,
          finishTime: null,
        };
  } catch (error) {
    next(error);
  }
};

const deleteCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;

    const competition = await Competitions.findByPk(id);
    if (!competition) {
      throw new ApiError(
        ApiResponse(false, 0, StatusCodes.NOT_FOUND, "Competition not found")
      );
    }

    //delete all reference
    await Unit.destroy({
      where: {
        competitionId: id,
      },
    });

    await ExamsOfCompetition.destroy({
      where: {
        competitionId: id,
      },
    });

    await Participant.destroy({
      where: {
        idCompetition: id,
      },
    });

    await competition.destroy();

    res.status(StatusCodes.OK).json(ApiResponse(true, 1));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompetition,
  getCompetitionsByUser,
  getCompetitionById,
  listInfoRequired,
  chooseExamForCompetition,
  deleteExamForCompetition,
  uploadImage,
  getListCompetition,
  addUnitsForCompetitions,
  getUnitsOfCompetition,
  updateSubUnit,
  deleteSubUnit,
  infoOrganizer,
  getOrganizerByCompetition,
  publishCompetition,
  getExamsOfCompetition,
  getAllQuestionOfCompetition,
  saveResultCompetition,
  statisticParticipant,
  exportExcel,
  deleteCompetition,
};
