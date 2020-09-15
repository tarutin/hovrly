module.exports = { init, getBounds, setHighlightMode, setTitle }

const path = require('path')
const electron = require('electron')
const platform = require('os').platform() 
const config = require('./config')

const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const nativeImage = electron.nativeImage
const system = electron.systemPreferences
const window = require('./window')

var tray = null

function init() {
    console.log('tray init')
    
    var icon = platform == 'win32' ? config.TRAY_ICON_WIN : (system.isDarkMode() ? config.TRAY_ICON_MAC_DARKMODE : config.TRAY_ICON_MAC)
    tray = new Tray(nativeImage.createFromPath(icon))

    tray.on('click', window.toggle)
    tray.on('double-click', window.toggle)

    tray.setToolTip(config.APP_NAME)
}

function setTitle(title) {
    tray.setTitle(title)
}

function setHighlightMode(mode) {
    return tray.setHighlightMode(mode)
}

function getBounds() {
    return tray.getBounds()
}