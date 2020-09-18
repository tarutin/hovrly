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

    var win = window.getWin()

    autoUpdater.setFeedURL({
        url: `https://hazel.alexeytarutin.vercel.app/update/${process.platform}/${app.getVersion()}`
    });


    ipc.on('update-check', function() {
        if(isDev) {
            win.webContents.send('update-finish', 'dev-mode')
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

        if(!win.isVisible()) notice.send(`Update ready to install`)
        win.webContents.send('update-finish', 'downloaded')

        ipc.on('update-install', function() {
            autoUpdater.quitAndInstall()
            setTimeout(app.quit, 2000)
        })
    })

    autoUpdater.on('checking-for-update', () => {
        win.webContents.send('update-finish', 'checking')
    })

    autoUpdater.on('update-available', () => {
        win.webContents.send('update-finish', 'available')
    })

    autoUpdater.on('update-not-available', () => {
        if(!silent) {
            win.webContents.send('update-finish', 'not-available')
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
