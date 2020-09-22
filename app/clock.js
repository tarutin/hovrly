module.exports = { init, formatTime, isCompactView, isTwentyFourHour, isCollapsed }

const path = require('path')
const electron = require('electron')
const app = electron.app
const settings = require('electron-settings')
const config = require('./config')
const tray = require('./tray')
const ipc = electron.ipcMain
const window = require('./window')
const notice = require('./notice')

var clock = null

function init() {
    console.log('clock init')

    // settings.unsetSync()
    // console.log( settings.getSync() )

    if(!settings.hasSync('clocks[0].timezone')) {
        resetClocks()
    }

    if(!settings.hasSync('twentyfourhour')) {
        settings.setSync('twentyfourhour', 'on')
    }

    if(!settings.hasSync('compact')) {
        settings.setSync('compact', 'off')
    }

    if(!settings.hasSync('collapse')) {
        settings.setSync('collapse', 'off')
    }

    ipc.on('compact', () => {
        settings.setSync('compact', isCompactView() == 'on' ? 'off' : 'on')
        update()
    })

    ipc.on('twentyfourhour', () => {
        settings.setSync('twentyfourhour', isTwentyFourHour() == 'off' ? 'on' : 'off')
        update()
    })

    ipc.on('collapse', () => {
        settings.setSync('collapse', isCollapsed() == 'off' ? 'on' : 'off')
        update()
    })

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

function isTwentyFourHour() {
    return settings.getSync('twentyfourhour')
}

function isCompactView() {
    return settings.getSync('compact')
}

function isCollapsed() {
    return settings.getSync('collapse')
}

function parseClockName(name) {
    if(isCompactView() == 'on') {
        let isDoubleName = (name.split(' ').length - 1) > 0 ? true : false

        if(isDoubleName) {
            name = name.match(/\b([A-Z])/g).join('')
        }
        else {
            name = name.substring(0, 3).toUpperCase()
        }
    }

    return name
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
            if(!clocks[i].timezone) continue
            let tzDate = new Date().toLocaleString('en-US', {timeZone: clocks[i].timezone})
            let utc_offset = new Date(tzDate).getTime()
            let format = formatTime(utc_offset)
            title.push(parseClockName(clocks[i].name) + ' ' + format.time)
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

function resetClocks() {
    settings.setSync('clocks', [
        { name: 'Moscow', full: 'Moscow, RU', timezone: 'Europe/Moscow', tray: 0 },
        { name: 'Berlin', full: 'Berlin, DE', timezone: 'Europe/Berlin', tray: 1 },
        { name: 'New York', full: 'New York, US', timezone: 'America/New_York', tray: 1 },
    ])
}

function formatTime(ts, local) {
    let date = new Date(ts)
    let hours = local ? date.getUTCHours() : date.getHours()
    let minutes = local ? date.getUTCMinutes() : date.getMinutes()
    let ampm = hours >= 12 ? 'PM' : 'AM'
    let morning = hours >= 4 && hours < 21 ? 'morning' : 'evening'

    minutes = minutes < 10 ? '0'+minutes : minutes

    if(isTwentyFourHour() == 'off') {
        hours = hours % 12
        hours = hours ? hours : 12

        return {
            time: `${hours}:${minutes} ${ampm}`,
            morning: morning
        }
    }
    else {
        if(hours < 10) hours = '0'+hours

        return {
            time: `${hours}:${minutes}`,
            morning: morning
        }
    }
}
