const dotenv = require('dotenv');

// Determine which environment file to load
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

// Load the corresponding .env file
dotenv.config({ path: envFile });

console.log(`Loaded ${envFile} configuration.`);
