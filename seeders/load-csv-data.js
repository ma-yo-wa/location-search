const fs = require('fs');
const csvParser = require('csv-parser');
const ngeohash = require('ngeohash');

const csvFilePath = './data/geolocation_data.csv';

module.exports = {
  async up(queryInterface, Sequelize) {
    const records = [];

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(csvFilePath);

      fileStream
        .pipe(csvParser())
        .on('data', (row) => {
          records.push({
            street: row.street || null, // Use null if not provided
            city: row.city || null,
            zip_code: row.zip_code || null,
            county: row.county || null,
            country: row.country || null,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            geohash: row.latitude && row.longitude ? ngeohash.encode(parseFloat(row.latitude), parseFloat(row.longitude)) : null,
            time_zone: row.time_zone || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        })
        .on('end', async () => {
          if (records.length === 0) {
            console.warn('No records found to insert.');
            resolve(); // Resolve even if no records
            return;
          }

          try {
            await queryInterface.bulkInsert('Locations', records);
            console.log('Data successfully inserted into Locations table.');
            resolve();
          } catch (error) {
            console.error('Error inserting data into Locations table:', error.message);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error.message);
          reject(error);
        });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Locations', null, {});
  },
};
