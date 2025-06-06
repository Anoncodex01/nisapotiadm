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
    const [rows] = await connection.query(`
      SELECT
        COUNT(*) AS total_items,
        SUM(price) AS total_value,
        SUM(CASE WHEN amount_funded >= price THEN 1 ELSE 0 END) AS funded_items,
        SUM(amount_funded) AS total_funded
      FROM wishlist
    `);

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database query failed', error: String(error) });
  } finally {
    await connection.end();
  }
} 