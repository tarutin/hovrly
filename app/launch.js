module.exports = { init }

const path = require('path')
const electron = require('electron')
const app = electron.app
const config = require('./config')
const twig = require('electron-twig')
const AutoLaunch = require('auto-launch')
const ipc = electron.ipcMain

var launch

function init() {
    console.log('launch init')

    let appPath = process.platform === 'darwin' ? app.getPath('exe').replace(/\.app\/Content.*/, '.app') : undefined
    launch = new AutoLaunch({ name:config.APP_NAME, path:appPath, isHidden:true })
    
    let isAutoOpen = app.getLoginItemSettings().openAtLogin ? 1 : 0
    twig.view.settings = {'appAutoLaunch': isAutoOpen}
    
    onToggle()
}

function onToggle() {
    ipc.on('startup', () => {
        launch.isEnabled().then(enabled => {
            if(!enabled) {
                twig.view.settings.appAutoLaunch = true
                launch.enable()
            }
            else {
                twig.view.settings.appAutoLaunch = false
                launch.disable()
            }
        })
    })
}