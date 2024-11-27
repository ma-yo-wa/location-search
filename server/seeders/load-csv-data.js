const fs = require('fs');
const csvParser = require('csv-parser');

const csvFilePath = './data/geolocation_data.csv';

module.exports = {
  async up(queryInterface, Sequelize) {
    const records = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          records.push({
            street: row.street,
            city: row.city,
            zip_code: row.zip_code,
            county: row.county,
            country: row.country,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            time_zone: row.time_zone,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        })
        .on('end', async () => {
          try {
            await queryInterface.bulkInsert('Locations', records);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => reject(error));
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Locations', null, {});
  },
};
