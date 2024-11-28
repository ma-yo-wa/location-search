// config/database.js
const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

let sequelize;

if (env === 'production') {
    sequelize = new Sequelize(config.url, {
        dialect: config.dialect,
        dialectOptions: config.dialectOptions
    });
} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            dialect: config.dialect
        }
    );
}

module.exports = sequelize;