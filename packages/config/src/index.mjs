export const supportedLocales = ['en', 'es', 'ru', 'ja', 'de', 'fr', 'pt', 'ar', 'zh-CN'];
export const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AED', 'RUB'];
import {fileURLToPath} from 'node:url';
export const roles = ['platform_admin', 'tenant_admin', 'teacher', 'student', 'operator', 'viewer'];
export const config = {
  port: Number(process.env.PORT || 4100),
  origin: process.env.APP_ORIGIN || 'http://localhost:4100',
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret-change-me',
  dataFile: process.env.DATA_FILE || fileURLToPath(new URL('../../../.data/dev-db.json', import.meta.url)),
};
