const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
    this.logDir = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  }

  writeToFile(level, formattedMessage) {
    if (!this.enableFileLogging) return;
    
    const filename = `edumeet-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFileSync(filepath, formattedMessage + '\n');
  }

  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.logLevel]) return;
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m', // red
      warn: '\x1b[33m',  // yellow
      info: '\x1b[36m',  // cyan
      debug: '\x1b[90m'  // gray
    };
    
    const reset = '\x1b[0m';
    console.log(`${colors[level] || ''}${formattedMessage}${reset}`);
    
    // File output
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Middleware for Express logging
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl, ip } = req;
        const { statusCode } = res;
        
        const level = statusCode >= 400 ? 'error' : 'info';
        this.log(level, `${method} ${originalUrl}`, {
          statusCode,
          duration: `${duration}ms`,
          ip: ip || 'unknown'
        });
      });
      
      next();
    };
  }
}

module.exports = new Logger();