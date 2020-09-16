module.exports = { init }

const path = require('path')
const electron = require('electron')
const app = electron.app
const settings = require('electron-settings')
const config = require('./config')
const tray = require('./tray')
const ipc = electron.ipcMain
const request = require('request')
const window = require('./window')
const notice = require('./notice')

var clock = null

function init() {
    console.log('clock init')

    // settings.unset()
    if (!settings.hasSync('clocks')) reset()

    // console.log(settings.getSync('clocks'))

    ipc.on('get-clocks', () => {
        let clocks = settings.getSync('clocks')
        let win = window.getWin()
        for (let i in clocks) {
            win.webContents.send('add-clock', clocks[i])
        }

        update()
        runClock()
    })

    ipc.on('clock-add', (e, city) => {
        if (!city) return

        let clocks = settings.getSync('clocks')
        let issetClock = false

        clocks.forEach(clock => {
            if (clock.name.replace(/[^a-z0-9]/gi, '') == city.name.replace(/[^a-z0-9]/gi, '')) {
                issetClock = true
            }
        })

        if (!issetClock) {
            clocks.push(city)
            settings.setSync('clocks', clocks)
            let win = window.getWin()
            win.webContents.send('add-clock', city)
        }
    })

    ipc.on('clock-remove', (e, cityName) => {
        let clocks = settings.getSync('clocks')
        clocks.forEach((clock, index) => {
            if (clock.name.replace(/[^a-z0-9]/gi, '') == cityName.replace(/[^a-z0-9]/gi, '')) {
                clocks.splice(index, 1)
            }
        })

        settings.setSync('clocks', clocks)
        update()
    })

    ipc.on('clock-toggle', (e, cityName) => {
        let clocks = settings.getSync('clocks')
        clocks.forEach((clock, index) => {
            if (clock.name.replace(/[^a-z0-9]/gi, '') == cityName.replace(/[^a-z0-9]/gi, '')) {
                clocks[index].tray = clock.tray ? false : true
            }
        })

        settings.setSync('clocks', clocks)
        update()
    })
}

function runClock() {
    var now = new Date()
    var tick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    setTimeout(function() {
        update()
        runClock()
    }, tick)
}

function update() {
    var clocks = settings.getSync('clocks')
    var utc = Math.floor(new Date().getTime())
    var title = []
    for (let i in clocks) {
        if (clocks[i].tray) {
            let utc_offset = utc + clocks[i].offset * 3600000
            title.push(clocks[i].name + ' ' + formatTime(utc_offset))
        }
    }
    title = title.length ? ' ' + title.join('   ') + ' ' : title.join('   ')
    tray.setTitle(title)
}

// function getCity(name, callback) {
//     let url = 'https://timezoneapi.io/api/address/?' + encodeURIComponent(name).replace(/%20/g, '+')
//
//     request(url, function(err, res, dat) {
//         if (err) console.log('clock get city data:', err.code)
//
//         if (dat) {
//             let data = JSON.parse(dat)
//             let utc = Math.floor(new Date().getTime())
//
//             if (data.data.addresses_found > 0) {
//                 let item = data.data.addresses[0]
//                 callback({
//                     name: item.city ? item.city : item.country,
//                     full: item.city ? item.city + ', ' + item.country_code : item.country,
//                     offset: item.datetime.offset_hours,
//                     data: item,
//                 })
//             }
//         }
//     })
// }

function reset() {
    settings.setSync('clocks', [
        { name: 'Moscow', full: 'Moscow, RU', offset: 3, tray: 0 },
        { name: 'Berlin', full: 'Berlin, DE', offset: 1, tray: 1 },
        { name: 'Phuket', full: 'Phuket', offset: 7, tray: 1 },
    ])
}

function formatTime(ts) {
    var date = new Date(ts)
    var hours = date.getUTCHours()
    var minutes = '0' + date.getUTCMinutes()
    var seconds = '0' + date.getUTCSeconds()

    return hours + ':' + minutes.substr(-2) // + ':' + seconds.substr(-2)
}
