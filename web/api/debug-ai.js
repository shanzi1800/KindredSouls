// 极简测试：只返回硬编码JSON，无任何网络调用
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).end(); return; }

  // 纯内存测试，无网络调用
  res.status(200).json({
    status: 'ok',
    ts: new Date().toISOString(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage ? {
      heapUsed: Math.round((process.memoryUsage().heapUsed || 0) / 1024 / 1024) + 'MB'
    } : 'unavailable'
  });
};
