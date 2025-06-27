module.exports = {
  apps: [{
    name: 'island-bitcoin-server',
    script: './unified-server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      REDIS_URL: 'redis://localhost:6379',
      API_SECRET: process.env.API_SECRET || 'island-bitcoin-sync-key-2024'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};