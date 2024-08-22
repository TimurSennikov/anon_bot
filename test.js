const db = require("better-sqlite3")("server.db");

console.log(db.prepare("SELECT * FROM users").all());