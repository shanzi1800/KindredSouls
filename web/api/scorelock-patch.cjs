// 临时脚本：升级泰语 scoreLock
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ai-advisor.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 在 scoreLock 定义前插入分数提取逻辑
const insertPoint = '    // ── FORCED DATA LOCK: Use EXACT scores from input ──\n    const scoreLock';
const newInsert = `    // ── 提取八字/星座/易经分数用于硬锁 ──
    const baziScoreMatch = bazi?.match(/คะแนนรวม[：:]\\s*(\\d+)/);
    const baziScore = baziScoreMatch ? baziScoreMatch[1] : (baziMeta?.find(m => m.includes('BAZI_SCORE'))?.match(/BAZI_SCORE_(\\d+)/)?.[1] || null);
    
    const zodiacScoreMatch = zodiac?.match(/คะแนนรวม[：:]\\s*(\\d+)/);
    const zodiacScore = zodiacScoreMatch ? zodiacScoreMatch[1] : (zodiacMeta?.find(m => m.includes('ZODIAC_SCORE'))?.match(/ZODIAC_SCORE_(\\d+)/)?.[1] || null);
    
    const ichingScoreMatch = iching?.match(/คะแนนอี้จิง[：:]\\s*(\\d+)/);
    const ichingScore = ichingScoreMatch ? ichingScoreMatch[1] : (ichingMeta?.find(m => m.includes('ICHING_SCORE'))?.match(/ICHING_SCORE_(\\d+)/)?.[1] || null);
    
    // ── FORCED DATA LOCK: Use EXACT scores from input ──
    const scoreLock`;

content = content.replace(insertPoint, newInsert);

// 替换泰语 scoreLock
const oldTh = `      ? \`[ข้อมูลบังคับ ห้ามตัด ห้ามเปลี่ยน ห้ามสร้างเอง]
คะแนนรวม = \${overall}
ไพ่ทาโรต์ = "\${tarot?.name || ''} \${tarotOrient}"
ในบทที่ 4 ต้องกลับมาอ้างคะแนนทั้ง 4 ดวงชะตา (บาซี / ราศี / อี้จิง / ไพ่ทาโรต์) ให้ครบถ้วน ห้ามตัดทิ้ง
ห้ามใช้คะแนนหรือชื่อแผนภูมิที่ไม่ปรากฏในข้อมูลนี้ (ห้ามนำคะแนน/แผนภูมิจากการคำนวณก่อนหน้ามาใช้)
หมายเหตุ: คะแนนอี้จิง ให้ค้นหา "I Ching Score" หรือ "คะแนนอี้จิง" ในส่วน [I CHING]

\``;

const newTh = `      ? \`[ข้อมูลบังคับ ห้ามตัด ห้ามเปลี่ยน ห้ามสร้างเอง]
คะแนนรวม = \${overall}/100
\${baziScore ? \`คะแนนบาซี = \${baziScore}/100\` : ''}
\${zodiacScore ? \`คะแนนราศี = \${zodiacScore}/100\` : ''}
\${ichingScore ? \`คะแนนอี้จิง = \${ichingScore}/100\` : ''}
ไพ่ทาโรต์ = "\${tarot?.name || ''} \${tarotOrient}"
\${!ichingScore ? 'หมายเหตุ: คะแนนอี้จิง ให้ค้นหา "I Ching Score" หรือ "คะแนนอี้จิง" ในส่วน [I CHING]' : ''}

[ข้อบังคับในบทที่ 4]
- ต้องกลับมาอ้างคะแนนทั้ง 4 ดวงชะตาให้ครบถ้วน: บาซี / ราศี / อี้จิง / ไพ่ทาโรต์
- ห้ามตัดทิ้ง ห้ามสร้างคะแนนเอง ห้ามใช้คะแนนอื่นนอกจากนี้
- ห้ามนำคะแนนจาก "ราดาร์ 4 มิติ" (dims) มาใช้ในบทที่ 4 — นั่นคือคะแนนย่อยเฉพาะด้าน ไม่ใช่คะแนนระบบหลัก
- หากคะแนนอี้จิง = 60 แต่ไพ่ทาโรต์ = 82 ต้องอธิบายความขัดแย้งนี้อย่างมีเหตุผล ห้ามละเลย

\``;

content = content.replace(oldTh, newTh);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ 泰语 scoreLock 已升级');
