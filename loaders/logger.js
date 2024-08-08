'use strict';

const winston = require('winston'),
      config = require('../config');
      require('winston-mongodb');

var options = {
	file: {
		level: 'info',
		filename:"server-trace.log",
		handleExceptions: true,
		json: false,
		maxsize: 52428809879867868755, 
		maxFiles: 5,
	},
	mongodb:{
		level:'info',
		db:process.env.MONGODB_URI,
		// collection:'db-traces',
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json(),
		)
	},
	console: {
		level: config.logs.level,
		handleExceptions: true,
		json: false,
		colorize: true,
	},
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json(),
	)
};



const transports = [];

if (process.env.NODE_ENV !== 'development') {
	transports.push(
		// new winston.transports.Console() previous work..
		new winston.transports.File(options.file),
		new winston.transports.Console(options.console),
		new winston.transports.MongoDB(options.mongodb),
		{
		format: format.combine(format.timestamp(),format.json())
		}
	)
} else {
	transports.push(
		new winston.transports.File(options.file),
		new winston.transports.MongoDB(options.mongodb),
		new winston.transports.Console({
		format: winston.format.combine(
			winston.format.cli(),
			winston.format.splat(),
		)
		}),
	)
}

const LoggerInstance = winston.createLogger({
	level: config.logs.level,
	levels: winston.config.npm.levels,
	format: winston.format.combine(
		winston.format.timestamp({
		format: 'YYYY-MM-DD HH:mm:ss'
		}),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json()
	),
	transports,
	exitOnError: false, 
});


LoggerInstance.stream = {
	write: function(message, encoding) {
		// use the 'info' log level so the output will be picked up by both transports (file and console)
		LoggerInstance.info(message);
		// LoggerInstance.info(headerinfo);
	},
};



module.exports = LoggerInstance;