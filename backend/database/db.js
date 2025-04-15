const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: true, // For dev environment
  },
};

// Connect to database
async function connect() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

// Execute a query
async function query(queryString, params = []) {
  try {
    const pool = await connect();
    const result = await pool.request();
    
    // Add parameters if any
    if (params && params.length > 0) {
      params.forEach(param => {
        result.input(param.name, param.type, param.value);
      });
    }
    
    return await result.query(queryString);
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  }
}

// Execute a stored procedure
async function procedure(procName, params = []) {
  try {
    const pool = await connect();
    const request = pool.request();
    
    // Add parameters if any
    if (params && params.length > 0) {
      params.forEach(param => {
        request.input(param.name, param.type, param.value);
      });
    }
    
    return await request.execute(procName);
  } catch (err) {
    console.error('Stored procedure execution error:', err);
    throw err;
  }
}

module.exports = {
  connect,
  query,
  procedure,
  sql // Export sql for data types
}; 