const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgre',
  password: 'k3v1nk43n917',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'backend'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};