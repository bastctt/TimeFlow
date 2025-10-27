import { Pool } from 'pg';

// Database pool configuration with security best practices
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Security: SSL/TLS configuration
  // Only enable if DB_SSL_ENABLED is explicitly set to 'true'
  // For managed databases (AWS RDS, Azure, etc.) that require SSL
  ssl: process.env.DB_SSL_ENABLED === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  } : false,
  // Connection pool limits
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000,
  application_name: 'timeflow_api',
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('📊 Pool stats:', {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    });
  }, 60000);
}

export default pool;
