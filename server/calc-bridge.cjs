#!/usr/bin/env node
/**
 * Node.js CLI bridge: 三引擎合盘计算
 * Python 通过子进程调用: node calc-bridge.js "1990-01-15" "1985-06-20"
 * 输出 JSON 到 stdout
 */
const { calculateCompatibility } = require('./algos-bundle.cjs');

const [,, date1, date2] = process.argv;

if (!date1 || !date2) {
  process.stderr.write('Usage: node calc-bridge.js <date1> <date2>\n');
  process.exit(1);
}

const result = calculateCompatibility(date1, date2);

if (result.error) {
  process.stderr.write(JSON.stringify(result) + '\n');
  process.exit(1);
}

process.stdout.write(JSON.stringify(result));
