module.exports = { init, toggle, show, hide, getWin }

const electron = require('electron')
const config = require('./config')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const twig = require('electron-twig')
const tray = require('./tray')
const Positioner = require('electron-positioner')
const system = electron.systemPreferences

var win = null
var positioner

function init() {
    console.log('window init')

    win = new BrowserWindow({
        width: config.WIN_WIDTH,
        height: 400,
        maxHeight: 500,
        frame: false,
        transparent: true,
        titleBarStyle: 'default',
        show: false,
        fullscreenable: false,
        resizable: false,
        movable: false,
        icon: config.DOCK_ICON,
        skipTaskbar: true,
    })

    positioner = new Positioner(win)

    twig.view = {
        'config': config,
        'system': {
            'isDark': system.isDarkMode(),
        }
    }

    win.loadURL(`file://${__dirname}/templates/index.twig`)
    win.setVisibleOnAllWorkspaces(true)

    // win.once('ready-to-show', show)

    ipc.on('app-height', (event, height) => {
        win.setSize(config.WIN_WIDTH, height)
    })

    win.on('blur', hide)

    win.on('show', () => {
        tray.setHighlightMode('always')
    })

    win.on('hide', () => {
        tray.setHighlightMode('never')
    })

    win.on('close', (event) => {
        if (app.quitting) {
            win = null
        } else {
            event.preventDefault()
            hide()
        }
    })
}

function getWin() {
    return win
}

function show() {
    let position = positioner.calculate('trayLeft', tray.getBounds())
    win.setPosition(position.x, position.y, false)
    win.show()
}

function hide() {
    win.hide()
}

function toggle() {
    win.isVisible() ? hide() : show()
}
