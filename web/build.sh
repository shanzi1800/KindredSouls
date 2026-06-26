#!/bin/bash
set -e
# Vercel CWD 已经是 web/，直接执行
npm install
npm run build:web
