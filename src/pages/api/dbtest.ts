import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const connection = await mysql.createConnection({
    host: '192.250.229.162',
    port: 3306,
    user: 'nisapoti_nis',
    password: 'Alvin@2025',
    database: 'nisapoti_nis'
  });

  try {
    // Simple test query
    const [result] = await connection.query('SELECT 1 + 1 as result');
    
    res.status(200).json({
      message: 'Database connection successful',
      result: result
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: String(error)
    });
  } finally {
    await connection.end();
  }
}
