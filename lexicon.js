/**
 * lexicon.js — 城市名 → 经纬度/时区 映射表
 * 用于占星页面城市搜索自动补全
 * 覆盖全球主要城市 + 中文常用城市
 * 数据来源：GeoNames / OpenStreetMap Nominatim
 */
export const CITY_LEXICON = [
  // ── 🇨🇳 中国大陆 ──
  { city: 'Beijing', cityZh: '北京', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Shanghai', cityZh: '上海', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Shenzhen', cityZh: '深圳', lat: 22.5431, lon: 114.0579, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Guangzhou', cityZh: '广州', lat: 23.1291, lon: 113.2644, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Hangzhou', cityZh: '杭州', lat: 30.2741, lon: 120.1551, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Chengdu', cityZh: '成都', lat: 30.5728, lon: 104.0668, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Nanjing', cityZh: '南京', lat: 32.0603, lon: 118.7969, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Wuhan', cityZh: '武汉', lat: 30.5928, lon: 114.3055, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Xian', cityZh: '西安', lat: 34.3416, lon: 108.9398, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Chongqing', cityZh: '重庆', lat: 29.5630, lon: 106.5516, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Tianjin', cityZh: '天津', lat: 39.3434, lon: 117.3616, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Suzhou', cityZh: '苏州', lat: 31.2989, lon: 120.5853, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Dalian', cityZh: '大连', lat: 38.9140, lon: 121.6147, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Qingdao', cityZh: '青岛', lat: 36.0671, lon: 120.3826, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Changsha', cityZh: '长沙', lat: 28.2282, lon: 112.9388, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Zhengzhou', cityZh: '郑州', lat: 34.7466, lon: 113.6253, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Shenyang', cityZh: '沈阳', lat: 41.8057, lon: 123.4328, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Kunming', cityZh: '昆明', lat: 25.0406, lon: 102.7123, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Jinan', cityZh: '济南', lat: 36.6512, lon: 117.1205, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Nanchang', cityZh: '南昌', lat: 28.6820, lon: 115.8581, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Taiyuan', cityZh: '太原', lat: 37.8706, lon: 112.5489, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Hefei', cityZh: '合肥', lat: 31.8612, lon: 117.2830, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Fuzhou', cityZh: '福州', lat: 26.0745, lon: 119.2965, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Xiamen', cityZh: '厦门', lat: 24.4798, lon: 118.0894, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Changchun', cityZh: '长春', lat: 43.8171, lon: 125.3235, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Harbin', cityZh: '哈尔滨', lat: 45.8038, lon: 126.5340, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Shijiazhuang', cityZh: '石家庄', lat: 38.0428, lon: 114.5149, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Lanzhou', cityZh: '兰州', lat: 36.0611, lon: 103.8343, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Guiyang', cityZh: '贵阳', lat: 26.6470, lon: 106.6302, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Urumqi', cityZh: '乌鲁木齐', lat: 43.8256, lon: 87.6168, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Nanning', cityZh: '南宁', lat: 22.8170, lon: 108.3665, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Haikou', cityZh: '海口', lat: 20.0444, lon: 110.1999, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Foshan', cityZh: '佛山', lat: 23.0218, lon: 113.1219, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Dongguan', cityZh: '东莞', lat: 23.0205, lon: 113.7518, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Ningbo', cityZh: '宁波', lat: 29.8683, lon: 121.5440, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Wuxi', cityZh: '无锡', lat: 31.4912, lon: 120.3119, tz: 'Asia/Shanghai', country: 'CN' },
  { city: 'Foshan', cityZh: '佛山', lat: 23.0218, lon: 113.1219, tz: 'Asia/Shanghai', country: 'CN' },

  // ── 🇨🇳 台湾 ──
  { city: 'Taipei', cityZh: '台北', lat: 25.0330, lon: 121.5654, tz: 'Asia/Taipei', country: 'TW' },
  { city: 'Kaohsiung', cityZh: '高雄', lat: 22.6273, lon: 120.3014, tz: 'Asia/Taipei', country: 'TW' },
  { city: 'Taichung', cityZh: '台中', lat: 24.1477, lon: 120.6736, tz: 'Asia/Taipei', country: 'TW' },
  { city: 'Tainan', cityZh: '台南', lat: 22.9998, lon: 120.2269, tz: 'Asia/Taipei', country: 'TW' },

  // ── 🇭🇰 🇲🇴 港澳 ──
  { city: 'Hong Kong', cityZh: '香港', lat: 22.3193, lon: 114.1694, tz: 'Asia/Shanghai', country: 'HK' },
  { city: 'Macau', cityZh: '澳门', lat: 22.1987, lon: 113.5439, tz: 'Asia/Shanghai', country: 'MO' },

  // ── 🇹🇭 泰国（默认坐标）──
  { city: 'Bangkok', cityZh: '曼谷', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok', country: 'TH' },
  { city: 'Phuket', cityZh: '普吉', lat: 7.8804, lon: 98.3923, tz: 'Asia/Bangkok', country: 'TH' },
  { city: 'Chiang Mai', cityZh: '清迈', lat: 18.7883, lon: 98.9853, tz: 'Asia/Bangkok', country: 'TH' },
  { city: 'Pattaya', cityZh: '芭提雅', lat: 12.9276, lon: 100.8770, tz: 'Asia/Bangkok', country: 'TH' },

  // ── 🇸🇬 新加坡 ──
  { city: 'Singapore', cityZh: '新加坡', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore', country: 'SG' },

  // ── 🇻🇳 越南 ──
  { city: 'Ho Chi Minh City', cityZh: '胡志明市', lat: 10.8231, lon: 106.6297, tz: 'Asia/Bangkok', country: 'VN' },
  { city: 'Hanoi', cityZh: '河内', lat: 21.0285, lon: 105.8542, tz: 'Asia/Bangkok', country: 'VN' },
  { city: 'Da Nang', cityZh: '岘港', lat: 16.0544, lon: 108.2022, tz: 'Asia/Bangkok', country: 'VN' },

  // ── 🇲🇾 马来西亚 ──
  { city: 'Kuala Lumpur', cityZh: '吉隆坡', lat: 3.1390, lon: 101.6869, tz: 'Asia/Bangkok', country: 'MY' },
  { city: 'Penang', cityZh: '槟城', lat: 5.4164, lon: 100.3327, tz: 'Asia/Bangkok', country: 'MY' },

  // ── 🇮🇳 印度 ──
  { city: 'Mumbai', cityZh: '孟买', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata', country: 'IN' },
  { city: 'New Delhi', cityZh: '新德里', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata', country: 'IN' },
  { city: 'Bangalore', cityZh: '班加罗尔', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata', country: 'IN' },
  { city: 'Kolkata', cityZh: '加尔各答', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata', country: 'IN' },
  { city: 'Chennai', cityZh: '金奈', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', country: 'IN' },
  { city: 'Hyderabad', cityZh: '海德拉巴', lat: 17.3850, lon: 78.4867, tz: 'Asia/Kolkata', country: 'IN' },

  // ── 🇯🇵 日本 ──
  { city: 'Tokyo', cityZh: '东京', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo', country: 'JP' },
  { city: 'Osaka', cityZh: '大阪', lat: 34.6937, lon: 135.5023, tz: 'Asia/Tokyo', country: 'JP' },
  { city: 'Kyoto', cityZh: '京都', lat: 35.0116, lon: 135.7681, tz: 'Asia/Tokyo', country: 'JP' },
  { city: 'Nagoya', cityZh: '名古屋', lat: 35.1815, lon: 136.9066, tz: 'Asia/Tokyo', country: 'JP' },
  { city: 'Yokohama', cityZh: '横滨', lat: 35.4437, lon: 139.6380, tz: 'Asia/Tokyo', country: 'JP' },
  { city: 'Sapporo', cityZh: '札幌', lat: 43.0618, lon: 141.3545, tz: 'Asia/Tokyo', country: 'JP' },
  { city: 'Fukuoka', cityZh: '福冈', lat: 33.5904, lon: 130.4017, tz: 'Asia/Tokyo', country: 'JP' },

  // ── 🇰🇷 韩国 ──
  { city: 'Seoul', cityZh: '首尔', lat: 37.5665, lon: 126.9780, tz: 'Asia/Seoul', country: 'KR' },
  { city: 'Busan', cityZh: '釜山', lat: 35.1796, lon: 129.0756, tz: 'Asia/Seoul', country: 'KR' },
  { city: 'Incheon', cityZh: '仁川', lat: 37.4563, lon: 126.7052, tz: 'Asia/Seoul', country: 'KR' },

  // ── 🇺🇸 美国 ──
  { city: 'New York', cityZh: '纽约', lat: 40.7128, lon: -74.0060, tz: 'America/New_York', country: 'US' },
  { city: 'Los Angeles', cityZh: '洛杉矶', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles', country: 'US' },
  { city: 'Chicago', cityZh: '芝加哥', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago', country: 'US' },
  { city: 'Houston', cityZh: '休斯顿', lat: 29.7604, lon: -95.3698, tz: 'America/Chicago', country: 'US' },
  { city: 'San Francisco', cityZh: '旧金山', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles', country: 'US' },
  { city: 'Seattle', cityZh: '西雅图', lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles', country: 'US' },
  { city: 'Boston', cityZh: '波士顿', lat: 42.3601, lon: -71.0589, tz: 'America/New_York', country: 'US' },
  { city: 'Miami', cityZh: '迈阿密', lat: 25.7617, lon: -80.1918, tz: 'America/New_York', country: 'US' },
  { city: 'Las Vegas', cityZh: '拉斯维加斯', lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles', country: 'US' },
  { city: 'Denver', cityZh: '丹佛', lat: 39.7392, lon: -104.9903, tz: 'America/Denver', country: 'US' },
  { city: 'Atlanta', cityZh: '亚特兰大', lat: 33.7490, lon: -84.3880, tz: 'America/New_York', country: 'US' },
  { city: 'Phoenix', cityZh: '凤凰城', lat: 33.4484, lon: -112.0740, tz: 'America/Phoenix', country: 'US' },

  // ── 🇬🇧 英国 ──
  { city: 'London', cityZh: '伦敦', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', country: 'GB' },
  { city: 'Manchester', cityZh: '曼彻斯特', lat: 53.4808, lon: -2.2426, tz: 'Europe/London', country: 'GB' },
  { city: 'Birmingham', cityZh: '伯明翰', lat: 52.4862, lon: -1.8904, tz: 'Europe/London', country: 'GB' },
  { city: 'Edinburgh', cityZh: '爱丁堡', lat: 55.9533, lon: -3.1883, tz: 'Europe/London', country: 'GB' },

  // ── 🇫🇷 法国 ──
  { city: 'Paris', cityZh: '巴黎', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', country: 'FR' },
  { city: 'Lyon', cityZh: '里昂', lat: 45.7640, lon: 4.8357, tz: 'Europe/Paris', country: 'FR' },
  { city: 'Marseille', cityZh: '马赛', lat: 43.2965, lon: 5.3698, tz: 'Europe/Paris', country: 'FR' },

  // ── 🇩🇪 德国 ──
  { city: 'Berlin', cityZh: '柏林', lat: 52.5200, lon: 13.4050, tz: 'Europe/Berlin', country: 'DE' },
  { city: 'Munich', cityZh: '慕尼黑', lat: 48.1351, lon: 11.5820, tz: 'Europe/Berlin', country: 'DE' },
  { city: 'Hamburg', cityZh: '汉堡', lat: 53.5511, lon: 9.9937, tz: 'Europe/Berlin', country: 'DE' },
  { city: 'Frankfurt', cityZh: '法兰克福', lat: 50.1109, lon: 8.6821, tz: 'Europe/Berlin', country: 'DE' },

  // ── 🇪🇸 西班牙 ──
  { city: 'Madrid', cityZh: '马德里', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid', country: 'ES' },
  { city: 'Barcelona', cityZh: '巴塞罗那', lat: 41.3851, lon: 2.1734, tz: 'Europe/Madrid', country: 'ES' },

  // ── 🇮🇹 意大利 ──
  { city: 'Rome', cityZh: '罗马', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome', country: 'IT' },
  { city: 'Milan', cityZh: '米兰', lat: 45.4642, lon: 9.1900, tz: 'Europe/Rome', country: 'IT' },
  { city: 'Venice', cityZh: '威尼斯', lat: 45.4408, lon: 12.3155, tz: 'Europe/Rome', country: 'IT' },

  // ── 🇳🇱 荷兰 ──
  { city: 'Amsterdam', cityZh: '阿姆斯特丹', lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam', country: 'NL' },

  // ── 🇷🇺 俄罗斯 ──
  { city: 'Moscow', cityZh: '莫斯科', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', country: 'RU' },
  { city: 'St. Petersburg', cityZh: '圣彼得堡', lat: 59.9311, lon: 30.3609, tz: 'Europe/Moscow', country: 'RU' },

  // ── 🇦🇺 澳洲 ──
  { city: 'Sydney', cityZh: '悉尼', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney', country: 'AU' },
  { city: 'Melbourne', cityZh: '墨尔本', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne', country: 'AU' },
  { city: 'Brisbane', cityZh: '布里斯班', lat: -27.4698, lon: 153.0251, tz: 'Australia/Brisbane', country: 'AU' },
  { city: 'Perth', cityZh: '珀斯', lat: -31.9505, lon: 115.8605, tz: 'Australia/Perth', country: 'AU' },
  { city: 'Adelaide', cityZh: '阿德莱德', lat: -34.9285, lon: 138.6007, tz: 'Australia/Adelaide', country: 'AU' },

  // ── 🇨🇦 加拿大 ──
  { city: 'Toronto', cityZh: '多伦多', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto', country: 'CA' },
  { city: 'Vancouver', cityZh: '温哥华', lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver', country: 'CA' },
  { city: 'Montreal', cityZh: '蒙特利尔', lat: 45.5017, lon: -73.5673, tz: 'America/Montreal', country: 'CA' },
  { city: 'Calgary', cityZh: '卡尔加里', lat: 51.0447, lon: -114.0719, tz: 'America/Edmonton', country: 'CA' },

  // ── 🇧🇷 巴西 ──
  { city: 'Sao Paulo', cityZh: '圣保罗', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo', country: 'BR' },
  { city: 'Rio de Janeiro', cityZh: '里约热内卢', lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo', country: 'BR' },

  // ── 🇮🇩 印尼 ──
  { city: 'Jakarta', cityZh: '雅加达', lat: -6.2088, lon: 106.8456, tz: 'Asia/Bangkok', country: 'ID' },
  { city: 'Bali', cityZh: '巴厘岛', lat: -8.3405, lon: 115.0920, tz: 'Asia/Bangkok', country: 'ID' },

  // ── 🇵🇭 菲律宾 ──
  { city: 'Manila', cityZh: '马尼拉', lat: 14.5995, lon: 120.9842, tz: 'Asia/Bangkok', country: 'PH' },

  // ── 🇳🇿 新西兰 ──
  { city: 'Auckland', cityZh: '奥克兰', lat: -36.8509, lon: 174.7645, tz: 'Pacific/Auckland', country: 'NZ' },
  { city: 'Wellington', cityZh: '惠灵顿', lat: -41.2865, lon: 174.7762, tz: 'Pacific/Auckland', country: 'NZ' },

  // ── 🇹🇷 土耳其 ──
  { city: 'Istanbul', cityZh: '伊斯坦布尔', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul', country: 'TR' },
  { city: 'Ankara', cityZh: '安卡拉', lat: 39.9334, lon: 32.8597, tz: 'Europe/Istanbul', country: 'TR' },

  // ── 🇿🇦 南非 ──
  { city: 'Johannesburg', cityZh: '约翰内斯堡', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg', country: 'ZA' },
  { city: 'Cape Town', cityZh: '开普敦', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg', country: 'ZA' },

  // ── 🇦🇷 阿根廷 ──
  { city: 'Buenos Aires', cityZh: '布宜诺斯艾利斯', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires', country: 'AR' },
];

/**
 * 根据城市名模糊搜索（英文名 或 中文名）
 */
export function searchCity(query: string): typeof CITY_LEXICON[0][] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return CITY_LEXICON.filter(c =>
    c.city.toLowerCase().includes(q) ||
    c.cityZh.includes(query) ||
    c.country.toLowerCase().includes(q)
  ).slice(0, 8); // 最多返回8个
}

/**
 * 根据坐标查找最近城市
 */
export function findNearestCity(lat: number, lon: number): typeof CITY_LEXICON[0] {
  let minDist = Infinity;
  let nearest = CITY_LEXICON[0];
  for (const c of CITY_LEXICON) {
    const d = Math.sqrt((c.lat - lat) ** 2 + (c.lon - lon) ** 2);
    if (d < minDist) { minDist = d; nearest = c; }
  }
  return nearest;
}
