module.exports = { init, getBounds, setHighlightMode, setTitle, update }

const path = require('path')
const electron = require('electron')
const platform = require('os').platform()
const config = require('./config')
const settings = require('electron-settings')

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

    update()

    tray.on('click', window.toggle)
    tray.on('double-click', window.toggle)

    tray.setToolTip(config.APP_NAME)
}

function update()
{
    tray.setImage(getIcon())
    
    nativeTheme.on('updated', () => {
        tray.setImage(getIcon())
    })
}

function getIcon()
{
    let clocks = settings.getSync('clocks')
    let isVisibleClock = false
    
    for (let i in clocks) {
        if (clocks[i].tray) {
            isVisibleClock = true
            break
        }
    }
    
    if(isVisibleClock) {
        return config.TRAY_ICON_ZERO
    }
    else {
        return platform == 'win32'
            ? config.TRAY_ICON_WIN
            : (nativeTheme.shouldUseDarkColors
                ? config.TRAY_ICON_MAC_DARKMODE
                : config.TRAY_ICON_MAC)
    }
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
