const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DEFAULT_POOL_SETTINGS = {
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0
};

const parseDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const url = new URL(process.env.DATABASE_URL);

    const databaseName = url.pathname.replace(/^\//, '');

    if (!databaseName) {
      throw new Error('DATABASE_URL must include a database name (e.g. mysql://user:pass@host:port/database)');
    }

    const config = {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
      database: databaseName
    };

    const params = Object.fromEntries(url.searchParams.entries());

    return { config, params };
  } catch (error) {
    console.error('Invalid DATABASE_URL provided.');
    throw error;
  }
};

const buildSslConfig = (urlSslMode) => {
  const sslMode = (process.env.DB_SSL_MODE || urlSslMode || 'disable').toLowerCase();

  if (sslMode !== 'require') {
    return undefined;
  }

  if (!process.env.DB_SSL_CA_PATH) {
    return { rejectUnauthorized: false };
  }

  try {
    const caPath = path.resolve(process.cwd(), process.env.DB_SSL_CA_PATH);
    const ca = fs.readFileSync(caPath, 'utf8');
    return { ca };
  } catch (error) {
    console.warn('Unable to read CA certificate. Falling back to insecure SSL mode.', error.message);
    return { rejectUnauthorized: false };
  }
};

const parsedUrl = parseDatabaseUrl();

const poolConfig = parsedUrl
  ? { ...DEFAULT_POOL_SETTINGS, ...parsedUrl.config }
  : {
      ...DEFAULT_POOL_SETTINGS,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };

const sslOptions = buildSslConfig(parsedUrl?.params?.['ssl-mode']);

if (sslOptions) {
  poolConfig.ssl = sslOptions;
}

const pool = mysql.createPool(poolConfig);

const verifyConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL connection established successfully.');
  } catch (error) {
    console.error('MySQL connection failed.', error.message);
    throw error;
  }
};

const query = async (sql, params = []) => {
  return pool.execute(sql, params);
};

module.exports = {
  pool,
  query,
  verifyConnection
};
