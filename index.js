const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

const LocationService = require("./services/locationService");

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });
// app.use("/search", limiter);

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgresql://locations_db_user:y8KwwqToDzseHKK0H29IoSD5DwOWLQyE@dpg-ct4022qj1k6c73ecl940-a.oregon-postgres.render.com/locations_db', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.get("/search", async (req, res) => {
  try {
    const { q: searchText, latitude, longitude } = req.query;

    // Input validation
    if (latitude && isNaN(parseFloat(latitude))) {
      return res.status(400).json({
        success: false,
        error: "Invalid latitude format",
      });
    }

    if (longitude && isNaN(parseFloat(longitude))) {
      return res.status(400).json({
        success: false,
        error: "Invalid longitude format",
      });
    }

    const results = await LocationService.searchLocations({
      searchText,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.use((req, res) => {
  console.log("DATABASE_URL:", process.env.NODE_ENV, process.env.DATABASE_URL);
  res.status(404).json({
    success: false,
    error: "Route not foun",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something broke!",
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
