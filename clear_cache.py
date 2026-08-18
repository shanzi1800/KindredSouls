#!/usr/bin/env python3
"""
清理 Supabase 缓存工具
用途：删除测试 URL 对应的旧月报缓存，强制后端重新生成
"""
import os
import sys
import requests
from urllib.parse import quote

# Supabase 配置（从 Railway 环境变量读取）
# 如果本地没有，需要手动设置
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ 错误：需要设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY")
    print("   请从 Railway Dashboard 或 .env 文件获取")
    sys.exit(1)

# 测试 URL 参数
BIRTH_DATE = "2014-02-29"
BIRTH_TIME = "15:30"
LAT = "18.7883"
LON = "98.9853"
TZ = "Asia/Bangkok"
LANG = "th"
REPORT_TYPE = "monthly"

# 构建缓存键（与 server.js 中 cacheKey 格式一致）
cache_key = f"wealth:v216e:{BIRTH_DATE}:{BIRTH_TIME}:{LAT}:{LON}:{TZ}:{LANG}:{REPORT_TYPE}"

print(f"🔍 准备删除缓存键: {cache_key}")

# 删除缓存的 API 请求
delete_url = f"{SUPABASE_URL}/rest/v1/ai_insights_cache?cache_key=eq.{quote(cache_key)}"

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Prefer': 'return=representation'  # 返回被删除的记录
}

try:
    response = requests.delete(delete_url, headers=headers)
    
    if response.status_code == 200:
        deleted_records = response.json()
        if deleted_records:
            print(f"✅ 成功删除 {len(deleted_records)} 条缓存记录")
            for record in deleted_records:
                print(f"   - ID: {record.get('id')}, 创建时间: {record.get('created_at')}")
        else:
            print("ℹ️  缓存不存在或已被删除")
    else:
        print(f"❌ 删除失败: HTTP {response.status_code}")
        print(f"   响应: {response.text}")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ 请求失败: {e}")
    sys.exit(1)

print("\n🎉 缓存清理完成！现在可以重新生成报告了。")
