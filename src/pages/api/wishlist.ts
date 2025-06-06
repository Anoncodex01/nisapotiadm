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
    const [wishlist] = await connection.query(`
      SELECT w.*, GROUP_CONCAT(wi.image_url) as images
      FROM wishlist w
      LEFT JOIN wishlist_images wi ON w.id = wi.wishlist_id
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `);

    // Format images as array
    const formatted = (wishlist as any[]).map(item => ({
      ...item,
      images: item.images ? item.images.split(',') : []
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database query failed', error: String(error) });
  } finally {
    await connection.end();
  }
} 