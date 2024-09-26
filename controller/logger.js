const {createLogger, transports, format} = require ('winston');
const { combine, timestamp, label, printf } = format;
const pool = require('../routes/pool');

const colorizer = format.colorize();

const customLogger = createLogger({
    transports : [
        new transports.File({
            filename : "Log_file.log",
            level : 'info',
            format : format.combine (format.timestamp (), format.json())
        }),

        new transports.Console()

        
    ],

    format: format.combine(
        format.json(),
        format.metadata(),
        format.timestamp({ format: 'YY-MM-DD HH:MM:SS' }),
        format.label ({label : "[ LOGS ]"}),
        
        format.printf( (msg)=>{
            // console.log (`| ${msg.label } | ${msg.timestamp } | - [ ${msg.level} ]:  ${msg.message.toUpperCase()} `);
            
            let d = new Date();

            d = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear();

            pool.query ("INSERT INTO `logs` (level, log,date) VALUES (?,?,?)", [msg.level , msg.message, d],(err,obj)=>{});
            
            return colorizer.colorize(msg.level, `| ${msg.label } | ${msg.timestamp } | - [ ${msg.level} ]:  ${msg.message} `)
        })
    ),
    statusLevel : true
})


module.exports = {customLogger};

