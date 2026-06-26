// 测试：wealth-oracle 的头部完全复制版
export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import { PROMPT_VERSION } from '../config.js';

export default async function handler(req, res) {
  return res.status(200).json({ 
    test: 'ok', 
    supabase: typeof createClient,
    PROMPT_VERSION,
    runtime: typeof process.env.SUPABASE_URL
  });
}
