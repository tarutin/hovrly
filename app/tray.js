module.exports = { init, getBounds, setHighlightMode, setTitle }

const path = require('path')
const electron = require('electron')
const platform = require('os').platform()
const config = require('./config')

const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const nativeImage = electron.nativeImage
const nativeTheme = electron.nativeTheme
const window = require('./window')

var tray = null

function init() {
    console.log('tray init')

    tray = new Tray(nativeImage.createFromPath(getIcon()))

    nativeTheme.on('updated', () => {
        tray.setImage(getIcon())
    })

    tray.on('click', window.toggle)
    tray.on('double-click', window.toggle)

    tray.setToolTip(config.APP_NAME)
}

function getIcon()
{
    return platform == 'win32'
        ? config.TRAY_ICON_WIN
        : (nativeTheme.shouldUseDarkColors
            ? config.TRAY_ICON_MAC_DARKMODE
            : config.TRAY_ICON_MAC)
}

function setTitle(title) {
    const WHITE = '\033[37;1m'
    tray.setTitle(WHITE + title)
}

function setHighlightMode(mode) {
    return tray.setHighlightMode(mode)
}

function getBounds() {
    return tray.getBounds()
}
