module.exports = { init, isAutoOpen }

const path = require('path')
const electron = require('electron')
const app = electron.app
const config = require('./config')
const AutoLaunch = require('auto-launch')
const ipc = electron.ipcMain

var launch

function init() {
    console.log('launch init')

    let appPath = process.platform === 'darwin' ? app.getPath('exe').replace(/\.app\/Content.*/, '.app') : undefined
    launch = new AutoLaunch({ name:config.APP_NAME, path:appPath, isHidden:true })

    ipc.on('startup', () => {
        launch.isEnabled().then(enabled => {
            if(!enabled) launch.enable()
            else launch.disable()
        })
    })
}

function isAutoOpen()
{
    return !!app.getLoginItemSettings().openAtLogin
}
