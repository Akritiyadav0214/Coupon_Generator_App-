require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is required.');
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`MessMate server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to database error:', err.message);
    process.exit(1);
  });
