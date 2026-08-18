# KindredSouls 技术架构说明书（参考版）

> 来源：玄极产品需求说明书，2026-05-27
> 本文档为产品技术规划蓝本，部分内容（如 React Native 规划）与当前 Web MVP 版本有差异。

## 产品命名
- **App 名**：Kindred Souls
- **域名**：kindredsouls.com.au
- **公司主体**：IVY INDUSTRIAL PTY LTD（ABN 40 621 015 530）

## 核心功能
1. 首页（产品介绍 + CTA）
2. 匹配详情（关系合盘）
3. 关系合盘（输入双方信息）
4. 算卦屋（易经占卜）
5. 个人中心

## 技术架构
- 前端：React Native（当前 Web MVP）
- 后端：Node.js + Express
- 数据库：PostgreSQL（Supabase）
- 缓存：Redis（Upstash）
- AI：DeepSeek API
- 支付：Stripe
- 认证：Apple Sign In

## 三引擎分值权重
- 八字：40%
- 星座：40%
- 易经：20%

## App Store 上架要点
- 隐私政策页面（必须有）
- Apple Sign In（硬门槛）
- Stripe IAP（不能用网页版）
- 标注"For entertainment purposes only"
- 年龄分级：12+

## 运营成本
约 $45-63/月（不含推广）
