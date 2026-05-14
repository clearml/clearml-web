import * as fs from 'fs';

const targets = [
 'http://localhost:8008',     // 1
];

const PROXY_CONFIG = {};

targets.forEach((target, i) => {
  const path = `/service/${i + 1}/api`;
  PROXY_CONFIG[path] = {
    target: target,
    secure: true,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    logLevel: 'debug',
    pathRewrite: {
      [`^${path}`]: ''
    }
  };
});

export default PROXY_CONFIG;
