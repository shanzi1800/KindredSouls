const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo Router 用 app/ 目录作为入口
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 让 expo-router 处理路由
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
