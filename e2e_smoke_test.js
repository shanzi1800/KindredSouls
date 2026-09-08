// e2e_smoke_test.js — kindredsouls.online 线上 E2E 终验抽检 (ESM)
// 真实契约: POST /api/wealth-oracle/stream (JSON body) -> SSE `data: {"sanitized":"..."}` 事件 -> `data: [DONE]`
// 用法: node e2e_smoke_test.js [birthDate] [birthTime] [lang]
// 例:   node e2e_smoke_test.js 1988-07-12 07:00 vi

import https from 'node:https';

const BIRTH_DATE = process.argv[2] || '1992-03-17';
const BIRTH_TIME = process.argv[3] || '07:00';
const LANG = process.argv[4] || 'vi';
const LAT = 10.8231;   // HCMC
const LON = 106.6297;
const TZ = 'Asia/Ho_Chi_Minh';

const HOST = 'kindredsouls.online';
const PATH = '/api/wealth-oracle/stream';

const body = JSON.stringify({
  birthDate: BIRTH_DATE,
  birthTime: BIRTH_TIME,
  lat: LAT,
  lon: LON,
  tz: TZ,
  lang: LANG,
  reportType: 'monthly',
});

console.log(`\n🚀 kindredsouls.online 线上 E2E 终验抽检 (V383 vi 阈值 + Placidus 宫位)`);
console.log(`🔗 POST https://${HOST}${PATH}`);
console.log(`📋 birthDate=${BIRTH_DATE} birthTime=${BIRTH_TIME} lang=${LANG} (HCMC ${LAT},${LON} ${TZ})\n`);

const req = https.request(
  {
    host: HOST,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Accept-Encoding': 'identity',
    },
    timeout: 200000,
  },
  (res) => {
    if (res.statusCode !== 200) {
      console.error(`❌ [FAIL] HTTP 状态码异常: ${res.statusCode}`);
      process.exit(1);
    }

    let raw = '';
    let textReport = '';       // 用户真实读到的报告 = 逐段 text 事件拼接
    let sanitizedReport = '';   // sanitized 事件 (vi Gemini 路径仅为主题头替换, 不可作为终稿)

    res.setEncoding('utf-8');
    res.on('data', (chunk) => {
      raw += chunk;
      // 逐行解析 SSE: `data: {...}` 或 `data: [DONE]`
      const lines = raw.split('\n');
      raw = lines.pop() || ''; // 保留最后未完成的半行
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const payload = t.slice(5).trim();
        if (payload === '[DONE]') continue;
        if (!payload) continue;
        try {
          const obj = JSON.parse(payload);
          if (typeof obj.text === 'string') textReport += obj.text;       // 真实正文流
          if (typeof obj.sanitized === 'string') sanitizedReport = obj.sanitized; // 参考用
        } catch (_) { /* 心跳注释行或非 JSON, 忽略 */ }
      }
    });

    res.on('end', () => {
      // 精确镜像前端 WealthReportPage.tsx 最终呈现逻辑:
      //   final = sanitized.length >= text.length ? sanitized : text
      //   (sanitized 是全量清洗版整体替换; 但若比已显示 text 短则保留 text)
      const text = textReport;
      const finalDisplayed = (sanitizedReport.length >= text.length) ? sanitizedReport : text;
      console.log(`📦 响应接收完成 | text流 ${text.length} chars | sanitized ${sanitizedReport.length} chars`);
      console.log(`   → 前端最终呈现 = ${finalDisplayed === sanitizedReport ? 'sanitized(全量清洗版)' : 'text流(清洗版较短,保留原始流)'} (${finalDisplayed.length} chars)\n`);

      if (!finalDisplayed || finalDisplayed.length < 500) {
        console.error('❌ [FAIL] 报告正文过短或为空, 可能部署异常');
        process.exit(1);
      }

      // ══════════════════════════════════════════════════════
      // 5 项关键断言 (Critical Assertions)
      // ══════════════════════════════════════════════════════
      const assertions = [
        {
          name: '1. UTF-8 编码完整 (零 U+FFFD 乱码)',
          pass: !finalDisplayed.includes('�'), // U+FFFD
          failMsg: '检测到 UTF-8 截断乱码符号 (U+FFFD)',
        },
        {
          name: '2. 越南语词内空格隔离 (无 Vậ n 破损)',
          // 变音符号被误剥离硬塞空格: 如 Vậ n / Mệ nh / Thá ng / Dươ ng / Nă ng
          // ⚠️ V394-fix: 原宽泛正则 [A-ZÀ-ỹ][a-à-ỹ]\s+[a-zÀ-ỹ] 误报正常语料
          //   (Có thể / Bị cuốn / Sự kết 等双字母大写词+空格+小写词),改用从不合法的精确拆词模式
          // 🛠️ V394-fix6: 剔除 thể hiện——越南语合法双音节词(thể+hiện本就该有空格),1981-09-08误报实证
          pass: !/Vậ\s+n|Mệ\s+nh|Thá\s+ng|Dươ\s+ng|Nă\s+ng|lượ\s+ng|chiế\s+u|hộ\s+i|chuyệ\s+n|cuộ\s+c/i.test(finalDisplayed),
          failMsg: '存在变音符号被误剥离并硬塞空格现象',
        },
        {
          name: '3. 本命月亮锚点引用 (Natal Anchor)',
          // V379 指令强制 LLM 引用本命月亮 + 宫位; 越南语 "Mặt Trăng bản mệnh" 或 "Mặt Trăng ... Nhà N"
          pass: /Mặt Trăng.*(bản mệnh|Nhà\s*\d|natal)/i.test(finalDisplayed),
          failMsg: '未成功引用本命月亮锚点 (Mặt Trăng bản mệnh / Nhà N)',
        },
        {
          name: '4. 动态风控阈值生效 (₫500,000)',
          // 部署修复保证陷阱段含 ₫500,000 (替换分支无 VND 后缀; 兜底权威行带 VND)
          pass: /(₫500[\.,]000|500[\.,]000\s*VND)/i.test(finalDisplayed),
          failMsg: '消费陷阱段落未找到 ₫500,000 动态风控标识',
        },
        {
          name: '5. 文本吞字校验 (首辅音残留检查)',
          // NFC 双入口曾吞掉 m/k/t 等首辅音: mayắn(may mắn) / khôngý(không ý) / trongương(trong tương)
          pass: !/mayắn|khôngý|trongương|giá trịinh thần/i.test(finalDisplayed),
          failMsg: '发现缺失辅音 (如 mayắn 代替 may mắn)',
        },
      ];

      let passed = 0;
      console.log('================ 终验报告 ================');
      assertions.forEach((a) => {
        if (a.pass) { console.log(`✅ PASS - ${a.name}`); passed++; }
        else {
          console.error(`❌ FAIL - ${a.name} --> ${a.failMsg}`);
          // V394-debug: 输出实际匹配样本上下文(定位真实吞字位置)
          try {
            const _pat = a.name.includes('吞字')
              ? /mayắn|khôngý|trongương|giá trịinh thần/gi
              : a.name.includes('词内空格') ? /Vậ\s+n|Mệ\s+nh|Thá\s+ng|Dươ\s+ng|Nă\s+ng|lượ\s+ng|chiế\s+u|hộ\s+i|chuyệ\s+n|cuộ\s+c/gi : null;
            if (_pat) {
              const _ms = [...finalDisplayed.matchAll(_pat)];
              console.log('  [debug] 命中' + _ms.length + '处:');
              for (const m of _ms.slice(0, 6)) {
                console.log('    ...' + finalDisplayed.slice(Math.max(0, m.index - 50), m.index + 50).replace(/\n/g, '⏎') + '...');
              }
            }
          } catch (e) {}
        }
      });
      console.log('==========================================');

      const ok = passed === assertions.length;
      console.log(ok
        ? `\n🎉 恭喜！全套 ${passed}/${assertions.length} 项线上 E2E 终验断言全部 PASS，部署完满成功！\n`
        : `\n⚠️ 抽检未通过 (${passed}/${assertions.length})，请检查部署 Bundle。\n`);
      process.exit(ok ? 0 : 1);
    });
  }
);

req.on('error', (err) => {
  console.error(`❌ [FAIL] 网络请求失败: ${err.message}`);
  process.exit(1);
});
req.write(body);
req.end();
