module.exports = { init, find }

const config = require('./config')
const mysql = require('mysql2')

var db
var connect = false

function init() {
    console.log('db init')

    db = mysql.createConnection(config.DB_CONNECT)

    db.connect(function(err) {
        if (err) {
            connect = false
            console.log('db not connected:', err.code)
        } else {
            connect = true
        }
    })

    db.on('error', function() {
        connect = false
    })

    setInterval(reconnect, 2000)
}

function find(q, callback) {
    if (!connect) return

    db.query(q, function(error, results, fields) {
        if (error) {
            console.log('db err', error.code)
            connect = false
            reconnect()
        }
        if (results) callback(results[0], fields)
    })
}

function disconnect() {
    connect = false
    db.end()
}

function reconnect() {
    if (!connect) {
        console.log('db', 'lost connect')
        db = mysql.createConnection(config.DB_CONNECT)
        db.connect(function(err) {
            if (!err) {
                connect = true
                console.log('db', 'reconnect')
            }
        })
    }
}
