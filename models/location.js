"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Location.init(
    {
      street: DataTypes.STRING,
      city: DataTypes.STRING,
      zip_code: DataTypes.STRING,
      county: DataTypes.STRING,
      country: DataTypes.STRING,
      latitude: DataTypes.FLOAT,
      longitude: DataTypes.FLOAT,
      time_zone: DataTypes.STRING,
      geohash: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Location",
    }
  );
  return Location;
};
