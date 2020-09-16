const $ = selector => document.querySelector(selector)
const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const config = remote.require('./config')
const notice = remote.require('./notice')
const launch = remote.require('./launch')
const nativeTheme = remote.nativeTheme

function init()
{
    document.title = config.APP_NAME

    $('.ipc-exit').innerText += ' ' + config.APP_NAME

    ipc.send('get-clocks')

    $('.app').classList.add(nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

    $('.ipc-startup').classList.add(launch.isAutoOpen() ? 'active' : '')
}

window.addEventListener('DOMContentLoaded', init)
