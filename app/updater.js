module.exports = { init, auto }

const electron = require('electron')
const config = require('./config')
const notice = require('./notice')
const window = require('./window')
const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const autoUpdater = electron.autoUpdater // sign: https://github.com/electron/electron/issues/7476

var isDev = process.env.DEV ? (process.env.DEV.trim() == 'true') : false
var silent = true

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

        silent = false
        autoUpdater.checkForUpdates()
    })


    autoUpdater.on('update-downloaded', (event, notes, name, date, url) => {
        if(process.platform == 'darwin') {
            app.dock.show()
            app.dock.bounce()
            app.dock.setBadge('•')
        }

        // TODO:
        // no callback. only send notification and change button
        notice.send(`Click to install and restart a new version`, () => {
            autoUpdater.quitAndInstall()
            setTimeout(app.quit, 2000)
        })
    })

    autoUpdater.on('checking-for-update', () => {
    })

    autoUpdater.on('update-available', () => {
        if(!silent) {
            notice.send('New version available. Downloading...')
        }
    })

    autoUpdater.on('update-not-available', () => {
        if(!silent) {
            notice.send(`${config.APP_VERSION} is the latest version`)
        }
    })

    autoUpdater.on('error', message => {
        if(isDev) {
            console.log(message)
        }
    })
}

function auto() {
    if(isDev) return

    setInterval(() => {
        silent = true
        autoUpdater.checkForUpdates()
    }, config.UPDATER_CHECK_TIME)
}
