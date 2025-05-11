import mysql from 'mysql2/promise';

async function testConnection() {
  const connection = await mysql.createConnection({
    host: '192.250.229.162',
    port: 3306,
    user: 'nisapoti_nis',
    password: 'Alvin@2025',
    database: 'nisapoti_nis'
  });

  try {
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables);

    // For each table, show its structure
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\nStructure of table ${tableName}:`);
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.log(columns);

      // Show a sample row
      const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 1`);
      console.log(`\nSample row from ${tableName}:`, rows[0]);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testConnection();
