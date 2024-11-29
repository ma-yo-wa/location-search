require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { sequelize } = require("./models");

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

sequelize
  .authenticate()
  .then(() => {
    const LocationService = require("./services/locationService");

    app.get("/search", limiter, async (req, res) => {
      try {
        const { q: searchText, latitude, longitude, page = 1, limit = 10 } = req.query;

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
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        });

        res.json(results);
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
          success: false,
          error: "Internal server error: " + error.message,
        });
      }
    });

    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Route not found",
      });
    });

    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        error: "Something broke! " + err.message,
      });
    });

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("Database connection error:", error);
    process.exit(1); // Exit the process with failure
  });
