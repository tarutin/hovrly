module.exports = { init }

const electron = require('electron')
const config = require('./config')
const app = electron.app
const Menu = electron.Menu

function init() {
    console.log('menu init')
    
    let template = 
    [
        {
            label: config.APP_NAME,
            submenu: [
                { role: 'about', label: `About ${config.APP_NAME}` },
                { type: 'separator' },
                { role: 'hide', label: `Hide`, },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit', label: `Quit ${config.APP_NAME}`, },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'selectall'}
            ]
        },
        {
            label: 'Window',
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
            ],
        },
    ]
    
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}