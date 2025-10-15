import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      // Test koneksi ke Supabase
      const { data, error } = await supabase
        .from('user')
        .select('count')
        .limit(1);

      if (error) throw error;

      res.status(200).json({ 
        message: 'Database connection successful!',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}