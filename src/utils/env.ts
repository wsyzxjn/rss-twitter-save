const requiredEnv = [
  "RSS_BASE_URL",
  "LIST_ID",
  "WEBDAV_URL",
  "WEBDAV_USERNAME",
  "WEBDAV_PASSWORD",
] as const;

for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`${env} is not set`);
    process.exit(1);
  }
}

export function getEnv(key: (typeof requiredEnv)[number]) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set`);
  }
  return process.env[key];
}
