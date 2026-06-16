const fs = require('fs');

const fixes = {
  1: 'Nguyên hanh lợi chính, kiên trì hưởng phước.',
  2: 'Nguyên hanh, lợi về sự thuận theo đức hành.',
  3: 'Nguyên hanh lợi chính, chưa thời hành động.',
  4: 'Hanh thông, kẻ ngu muội tự tìm đến ta.',
  5: 'Có phước, quang minh hanh thông, kiên trì cát tường.',
  6: 'Có phước bị ngăn trở, trung gian cát tường.',
  7: 'Kiên trì theo đức lớn, cát tường không lỗi.',
  8: 'Nguyên thử nguyên vĩnh kiên, không lỗi.',
  9: 'Hanh thông, mây đặc chưa hạ mưa.',
  10: 'Đạp đuôi hổ, hổ không cắn, hanh thông.',
  11: 'Tiểu tự đại lai, cát tường hanh thông.',
  12: 'Bĩ với người phi nhân, bất lợi cho quân tử kiên trì.',
  13: 'Đồng nhân tại dã, hanh thông.',
  14: 'Nguyên hanh, đại hữu vạn vật.',
  15: 'Hanh thông, quân tử có thủy chung.',
  16: 'Lợi kiến hầu, hành sư.',
  17: 'Nguyên hanh lợi chính kiên trì, không lỗi.',
  18: 'Nguyên hanh, lợi vượt sông lớn.',
  19: 'Nguyên hanh lợi chính kiên trì.',
  20: 'Hoàn nhiên chí như, hữu phước uy nghi.',
  21: 'Hanh thông, lợi cho việc xét xử.',
  22: 'Hanh thông, lợi nhỏ có thể tiến.',
  23: 'Bất lợi có thể tiến.',
  24: 'Hanh thông, xuất nhập vô tật.',
  25: 'Nguyên hanh lợi chính kiên trì.',
  26: 'Kiên trì lợi, bất gia thực cát.',
  27: 'Kiên trì cát tường, quan dĩ tự cầu khẩu thực.',
  28: 'Đống kiều, lợi hữu duy tiến hanh.',
  29: 'Tập khảm hữu phước duy tâm hanh.',
  30: 'Kiên trì hanh thông.',
  31: 'Nguyên hanh lợi chính, thất nữ cát.',
  32: 'Hanh thông vô lỗi, kiên trì lợi.',
  33: 'Hanh thông, tiểu lợi kiên trì.',
  34: 'Lợi kiên trì.',
  35: 'Hưng hầu chi dụng tích mã phồn thứ.',
  36: 'Lợi gian nan kiên trì.',
  37: 'Nguyên cát hanh thông.',
  38: 'Tiểu sự cát.',
  39: 'Lợi đông nam, bất lợi đông bắc.',
  40: 'Lợi đông nam.',
  41: 'Hữu phước nguyên cát vô lỗi.',
  42: 'Lợi hữu duy tiến, lợi tham sông lớn.',
  43: 'Dương vu vương đình, hiệu lệ liễu.',
  44: 'Nữ tráng vật dụng thất nữ.',
  45: 'Vương giả hữu miếu, hanh.',
  46: 'Nguyên hanh, dụng kiến đại nhân.',
  47: 'Hanh kiên trì, đại nhân cát vô lỗi.',
  48: 'Cải ấp bất cải tỉnh.',
  49: 'Tị nhật nãi phước, nguyên hanh lợi kiên trì.',
  50: 'Nguyên cát hanh thông.',
  51: 'Hanh, khủng triều phước.',
  52: 'Cấn kỳ bối, bất hoạt kỳ thân.',
  53: 'Nữ quy cát kiên trì.',
  54: 'Chinh hung vô duy lợi.',
  55: 'Hanh, vương vật ưu, nghi trung nhật.',
  56: 'Tiểu hanh, lữ kiên trì cát.',
  57: 'Tiểu hanh lợi hữu duy tiến.',
  58: 'Nguyên hanh kiên trì.',
  59: 'Vương giả hữu miếu, lợi tham sông lớn.',
  60: 'Hanh, khổ tiết bất khả kiên.',
  61: 'Đồn ngư ngọc lợi tham sông lớn.',
  62: 'Nguyên hanh lợi kiên trì, khả tiểu sự, bất khả đại sự.',
  63: 'Hanh tiểu, kiên trì lợi.',
  64: 'Hanh tiểu hồ ly ngật tế, nhu kỳ vĩ.'
};

let content = fs.readFileSync('src/lib/algos/iching.ts', 'utf8');

// Parse the file to find each hexagram block and its judgmentVi line
const lines = content.split('\n');
const hexBlocks = [];
let currentHex = null;
let inBlock = false;
let braceCount = 0;
let blockStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const hexMatch = line.match(/^\s*(\d+):\s*\{/);
  if (hexMatch) {
    currentHex = parseInt(hexMatch[1]);
    inBlock = true;
    blockStart = i;
    braceCount = 0;
  }
  if (inBlock) {
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    if (braceCount === 0 && blockStart !== -1) {
      hexBlocks.push({ hex: currentHex, start: blockStart, end: i });
      inBlock = false;
    }
  }
}

// Replace judgmentVi in each hex block
let changes = 0;
for (const block of hexBlocks) {
  const hex = block.hex;
  if (!fixes[hex]) continue;

  for (let i = block.start; i <= block.end; i++) {
    if (lines[i].includes('judgmentVi:')) {
      lines[i] = lines[i].replace(/judgmentVi:\s*"[^"]*"/, 'judgmentVi: "' + fixes[hex] + '"');
      changes++;
      break;
    }
  }
}

fs.writeFileSync('src/lib/algos/iching.ts', lines.join('\n'));
console.log('Done. Made', changes, 'replacements across', hexBlocks.length, 'hexagrams.');

// Verify a few
const checkLines = lines.join('\n');
const checks = [
  { hex: 1, expect: fixes[1] },
  { hex: 21, expect: fixes[21] },
  { hex: 28, expect: fixes[28] },
  { hex: 52, expect: fixes[52] },
  { hex: 61, expect: fixes[61] },
  { hex: 64, expect: fixes[64] },
];
for (const c of checks) {
  const found = checkLines.includes('judgmentVi: "' + c.expect + '"');
  console.log('Hex', c.hex + ':', found ? 'OK' : 'FAIL (got: "' + c.expect + '")');
}
