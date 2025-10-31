module.exports = {
  apps: [
    {
      name: 'gelagle-stock-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto restart on crash
      autorestart: true,
      // Watch for file changes (disable in production or use with caution)
      watch: false,
      // Maximum memory before restart
      max_memory_restart: '1G',
      // Error log file
      error_file: './logs/pm2-error.log',
      // Output log file
      out_file: './logs/pm2-out.log',
      // Combined log file
      log_file: './logs/pm2-combined.log',
      // Log date format
      time: true,
      // Merge logs from all instances
      merge_logs: true,
      // Graceful shutdown timeout
      kill_timeout: 5000,
      // Wait for listen event
      wait_ready: true,
      // Listen timeout
      listen_timeout: 10000,
      // Restart delay
      restart_delay: 4000,
      // Maximum restarts in 10 seconds
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

