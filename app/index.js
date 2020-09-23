console.time('init')

const config = require('./config')
const path = require('path')
const electron = require('electron')
const app = electron.app
const ipc = electron.ipcMain
const shell = electron.shell
const tray = require('./tray')
const menu = require('./menu')
const window = require('./window')
const launch = require('./launch')
const clock = require('./clock')
const notice = require('./notice')
const updater = require('./updater')
const system = electron.systemPreferences
const db = require('./db')

var isDev = process.env.DEV ? (process.env.DEV.trim() == 'true') : false
process.on('uncaughtException', error)
app.console = new console.Console(process.stdout, process.stderr)

app.whenReady().then(() => {
    console.log('index init')

    window.init()
    menu.init()
    tray.init()
    launch.init()
    clock.init()
    updater.init()
    notice.init()
    db.init()

    ipc.on('ready', () => {
        if(process.platform == 'darwin') {
            app.dock.hide()
        }

        setTimeout(function() {
            updater.auto()
        }, config.DELAYED_INIT)

        console.timeEnd('init')
    })

    ipc.on('exit', app.quit)

    ipc.on('about', () => {
        window.hide()
        shell.openExternal(config.LINK_ABOUT)
    })

    ipc.on('donate', () => {
        window.hide()
        shell.openExternal(config.LINK_DONATE)
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', window.show)

app.on('before-quit', () => {
    app.quitting = true
})

function error(error) {
    console.error(error)
    if(!isDev) return

    if(typeof error == 'object') notice.send('Error: ' + error.message)
    else notice.send('Error: ' + error)
}
