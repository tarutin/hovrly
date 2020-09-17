module.exports = { init, auto }

const electron = require('electron')
const config = require('./config')
const notice = require('./notice')
const window = require('./window')
const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const autoUpdater = electron.autoUpdater // sign: https://github.com/electron/electron/issues/7476

var autoCheckTimer
var isDev = process.env.DEV ? (process.env.DEV.trim() == 'true') : false

function init() {
    console.log('updater init')

    autoUpdater.setFeedURL({
        url: `https://hazel.alexeytarutin.vercel.app/update/${process.platform}/${app.getVersion()}`
    });


    ipc.on('check-update', function() {
        if(isDev) {
            notice.send('Updates unavailable on development mode')
            return
        }

        notice.send('Checking updates...')
        autoUpdater.checkForUpdates()
    })


    autoUpdater.on('update-downloaded', (event, notes, name, date, url) => {
        if(process.platform == 'darwin') {
            app.dock.show()
            app.dock.bounce()
            app.dock.setBadge('•')
        }

        notice.send(`Click to install and restart a new version`, () => {
            autoUpdater.quitAndInstall()
            setTimeout(app.quit, 2000)
        })
    })

    autoUpdater.on('checking-for-update', () => {
    })

    autoUpdater.on('update-available', () => {
        console.log('update-available')
    })

    autoUpdater.on('update-not-available', () => {
        console.log('update-not-available')
    })

    autoUpdater.on('error', message => {
        console.log(message)
    })
}

function auto() {
    if(isDev) return

    autoCheckTimer = setInterval(function() {
        autoUpdater.checkForUpdates()
    }, config.UPDATER_CHECK_TIME)
}
