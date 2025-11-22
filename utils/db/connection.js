const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Inicializar la base de datos y crear tablas necesarias
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Crear tabla de reportes
    const createReportsTable = `
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guildId VARCHAR(20) NOT NULL,
        adminId VARCHAR(20) NOT NULL,
        adminTag VARCHAR(50) NOT NULL,
        description LONGTEXT NOT NULL,
        photo1Url LONGTEXT NOT NULL,
        photo2Url LONGTEXT NOT NULL,
        messageId VARCHAR(20),
        channelId VARCHAR(20),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        isDeleted BOOLEAN DEFAULT FALSE,
        INDEX(guildId),
        INDEX(adminId),
        INDEX(createdAt)
      );
    `;

    await connection.query(createReportsTable);
    connection.release();

    console.log('Tabla de reportes verificada/creada');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
}

// Obtener una conexión del pool
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error obteniendo conexión:', error);
    throw error;
  }
}


// Ejecutar una query
async function query(sql, params = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  initializeDatabase,
  getConnection,
  query,
};