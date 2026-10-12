/// <reference types="vite/client" />

/**
 * E42+ 45-D2：构建期注入的「城市库内容版本号」（vite.config.ts 的 define）。
 *
 * 用途：`/data/cities.json` 走 `immutable` 强缓存（max-age=31536000），
 * 必须让 URL 携带**内容指纹**，否则升级城市库后老用户被一年缓存永久钉死。
 * 前端取 `?v=__CITIES_VERSION__` ⇒ 内容变则 URL 变 ⇒ 自动穿透旧缓存。
 *
 * ⚠️ 非 Vite 环境（纯 `tsc -b` 之外的裸执行/测试）拿不到注入值 ⇒ 代码侧必须做
 *    `typeof __CITIES_VERSION__` 兜底，绝不裸用。
 */
declare const __CITIES_VERSION__: string;
