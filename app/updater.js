module.exports = { init, auto }

const electron = require('electron')
const config = require('./config')
const notice = require('./notice')
const window = require('./window')
const ipc = electron.ipcMain
const app = electron.app
const shell = electron.shell
const BrowserWindow = electron.BrowserWindow
const request = require('request')
const download = require('electron-dl').download

var autoCheckTimer

function init() {
    console.log('updater init')
    check({ silent:true, win:window.getWin() })
    ipcOnCheck()
}

function ipcOnCheck() {
    ipc.on('check-update', function() {
        check({ win:window.getWin() })
    })
}

function auto(options) {
    autoCheckTimer = setInterval(function() {
        check({ silent:true, win:options.win })
    }, config.UPDATER_CHECK_TIME)
}

function check(options) {
    request(config.UPDATER_CHECK_VERSION, function(err, res, data) {
        if(err) console.log('check update:', err.code)

        if(!res) {
            if(!options.silent) {
                notice.send(`Error check new version! Try again later`)
            }
            return
        }
        else {
            data = JSON.parse(data)

            if(data.version > config.APP_VERSION) {
                notice.send(`A new version ${data.version} is available!\nClick to download!`, () => {
                    app.dock.show()

                    download(options.win, data.file).then(dl => {
                        notice.send('Successfuly downloaded!')
                        shell.openItem(dl.getSavePath())
                        setTimeout(app.quit, 3000)
                    })
                })

                clearInterval(autoCheckTimer)
            }
            else {
                if(!options.silent) {
                    notice.send(`${config.APP_VERSION} is the latest version.`)
                }
            }
        }
    })
}
