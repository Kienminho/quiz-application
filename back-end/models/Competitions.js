const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./User");

class Competitions extends Model {}

Competitions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bannerUrl: {
      type: DataTypes.STRING(1000),
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rules: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(1000),
    },
    themeColor: {
      type: DataTypes.STRING(10),
      defaultValue: "#000000",
      allowNull: false,
    },
    timeStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    timeEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    infoRequire: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    testDuration: {
      type: DataTypes.INTEGER,
    },
    testAttempts: {
      type: DataTypes.INTEGER,
    },
    isMix: {
      type: DataTypes.ENUM("question", "question-answer"),
    },
    unitGroupName: {
      type: DataTypes.STRING(100),
      defaultValue: "Nhóm/Đơn vị mới 2",
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Competitions",
    timestamps: true,
  }
);

// Define associations
Competitions.belongsTo(User, {
  foreignKey: "creatorId",
  as: "Creator",
});

module.exports = Competitions;