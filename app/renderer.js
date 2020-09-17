const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const db = remote.require('./db')
const $ = selector => document.querySelector(selector)
const $all = selector => document.querySelectorAll(selector)

function init()
{
    ipc.on('app-height-get', updateAppHeight)

    updateTime()
    runClock()

    $('.ipc-exit').addEventListener('click', () => {
        ipc.send('exit')
    })

    $('.ipc-update').addEventListener('click', () => {
        ipc.send('check-update')
    })

    $('.ipc-startup').addEventListener('click', e => {
        e.target.classList.toggle('active')
        ipc.send('startup')
    })

    ipc.on('add-clock', (e, clock) => {

        let button = document.createElement('button')

        button.classList.add(clock.tray ? 'active' : null)

        button.innerHTML = `
            ${clock.full}
            <time data-offset='${clock.offset}'></time>
            <span class='delete'><i class='fa fa-fw fa-times-circle fa-fw'></i></span>
        `
        button.setAttribute('data-name', clock.name)

        button.addEventListener('click', e => {
            e.stopPropagation()
            e.target.closest('button').classList.toggle('active')
            ipc.send('clock-toggle', e.target.closest('button').getAttribute('data-name'))
        })

        button.querySelector('.delete').addEventListener('click', e => {
            e.stopPropagation()
            ipc.send('clock-remove', button.getAttribute('data-name'))
            button.parentNode.removeChild(button)
            updateAppHeight()
        })

        $('.clock').appendChild(button)
        updateTime()
        updateAppHeight()
    })

    var newclock = null
    $('.search input').addEventListener('keyup', e => {
        let keycode = e.keyCode ? e.keyCode : e.which
        let q = $('.search input').value.trim()
        let label = $('.search label').innerText

        if (keycode == 13)
        {
            if(newclock) {
                ipc.send('clock-add', newclock)
                newclock = null
            }

            $('.search label').innerText = ''
            $('.search input').value = ''
        }
        else
        {
            if (q == '') {

                newclock = null
                $('.search label').innerText = ''
            }
            else {

                let query = `SELECT name, UPPER(country) code, offset FROM cities WHERE city LIKE '%${q}%' ORDER BY popularity DESC LIMIT 1`

                db.find(query, city => {
                    $('.search label').innerText = !city ? 'Not found' : city.name + ', ' + city.code
                    newclock = city ? { name: city.name, full: city.name + ', ' + city.code, offset: city.offset, tray: 0 } : null
                })
            }
        }
    })

    ipc.send('ready')
}

function updateAppHeight()
{
    let appHeight = parseFloat(getComputedStyle($('.app'), null).height.replace('px', ''))
    ipc.send('app-height', appHeight)
}

function updateTime() {
    let utc = Math.floor(new Date().getTime())

    $all('.clock button').forEach(item => {
        let time = item.querySelector('time')
        let utc_offset = utc + time.getAttribute('data-offset') * 3600000
        time.innerText = formatTime(utc_offset)
    })
}

function runClock() {
    let now = new Date()
    let tick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    setTimeout(function() {
        updateTime()
        runClock()
    }, tick)
}

function formatTime(ts) {
    let date = new Date(ts)
    let hours = date.getUTCHours()
    let minutes = '0' + date.getUTCMinutes()
    let seconds = '0' + date.getUTCSeconds()

    return hours + ':' + minutes.substr(-2) // + ':' + seconds.substr(-2)
}

window.addEventListener('DOMContentLoaded', init)
document.addEventListener('dragover', event => event.preventDefault())
document.addEventListener('drop', event => event.preventDefault())
