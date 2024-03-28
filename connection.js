const mysql = require('mysql');

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database : 'coilchat',
  port : '3305'
});

db.connect(function(err) {
  if (err) throw err;
  console.log('Database connected!');
});

module.exports = db 


