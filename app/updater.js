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

function init() {
    console.log('updater init')

    var win = window.getWin()

    autoUpdater.setFeedURL({
        url: `${config.UPDATER_CHECK_URL}/update/${process.platform}/${app.getVersion()}`
    });


    ipc.on('update-check', function() {
        if(isDev) {
            win.webContents.send('update-finish', 'dev-mode')
            return
        }

        autoUpdater.checkForUpdates()
    })

    autoUpdater.on('update-downloaded', (event, notes, name, date, url) => {
        if(process.platform == 'darwin' && !win.isVisible()) {
            app.dock.show()
            app.dock.bounce()
            app.dock.setBadge(' ')
        }

        if(!win.isVisible()) {
            notice.send(`Update ready to install`, () => {
                win.show()
            })
        }

        win.webContents.send('update-finish', 'downloaded')

        ipc.on('update-install', function() {
            autoUpdater.quitAndInstall()
            setTimeout(app.quit, 1000)
        })
    })

    autoUpdater.on('checking-for-update', () => {
        if(win.isVisible()) {
            win.webContents.send('update-finish', 'checking')
        }
    })

    autoUpdater.on('update-available', () => {
        win.webContents.send('update-finish', 'available')
    })

    autoUpdater.on('update-not-available', () => {
        if(win.isVisible()) {
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
        autoUpdater.checkForUpdates()
    }, config.UPDATER_CHECK_TIME)
}
