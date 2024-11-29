# Location Service API

## Overview

This project is a Node.js application that provides a RESTful API for searching locations based on coordinates or text queries. It utilizes Sequelize for database interactions, caching for performance optimization, and geohashing for location proximity calculations.

## Installation

To install and run the application, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/location-service.git
   cd location-service
   ```

2. **Install Dependencies**:
   Make sure you have Node.js and npm installed. Then, run:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Copy the `.env.example` file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
   This file contains the necessary environment variables for local development. You can modify the values as needed.

4. **Prepare Geolocation Data**:
   Place your geolocation data CSV file in the following path:
   ```
   ./data/geolocation_data.csv
   ```

5. **Run Database Migrations and Seed Data**:
   Use Sequelize CLI to set up the database:
   ```bash
   npm run db:setup
   ```

6. **Start the Application**:
   You can start the application in development mode using:
   ```bash
   npm run dev
   ```
   Or in production mode using:
   ```bash
   npm start
   ```

7. **Access the API**:
   The API will be available at `http://localhost:3000/search`.

## Approach and Design Decisions

### Architecture
- **Express.js**: The application is built using Express.js, which provides a robust framework for building web applications and APIs.
- **Sequelize**: This ORM is used for database interactions, allowing for easy querying and data manipulation.
- **Caching**: Implemented using `node-cache` to store frequently accessed search results, reducing database load and improving response times.
- **Geolocation Utilities**: Functions for calculating distances and geohashing are encapsulated in a separate utility module, promoting code reusability and separation of concerns.

### Search Logic
The search functionality supports four main cases:
1. **Exact Coordinates**: Returns a location if the latitude and longitude match exactly.
2. **Text Search with Coordinates**: Searches for locations based on a text query and filters results based on proximity to the provided coordinates.
3. **Text Search Only**: Searches for locations based solely on a text query.
4. **Coordinates Only**: If only coordinates are provided and there is no exact match, the application uses geohashing to find nearby locations based on proximity.

### Error Handling
- Comprehensive error handling is implemented to manage invalid inputs and server errors gracefully, providing meaningful feedback to the API consumers.

## Additional Information
- **Testing**: The application includes unit tests using Jest to ensure the functionality of the location service and caching mechanisms. You can run the tests using:
   ```bash
   npm run test
   ```
- **Rate Limiting**: The API is protected against abuse by limiting the number of requests from a single IP address.

## Important Note
If you are writing code, do not include the "line_number|" before each line of code.

## GitHub Repository
