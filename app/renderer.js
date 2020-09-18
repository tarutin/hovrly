const electron = require('electron')
const remote = electron.remote
const ipc = electron.ipcRenderer
const config = remote.require('./config')
const db = remote.require('./db')
const clock = remote.require('./clock')
const launch = remote.require('./launch')
const nativeTheme = remote.nativeTheme
const $ = selector => document.querySelector(selector)
const $all = selector => document.querySelectorAll(selector)

function init()
{
    ipc.on('app-height-get', updateAppHeight)

    theme()
    clocks()
    search()
    quit()
    update()
    startup()
    twentyforhour()
    compact()
    about()
    donate()

    ipc.send('ready')
}


function update()
{
    var chekingTimeout;

    $('.update').addEventListener('click', () => {
        clearTimeout(chekingTimeout)
        if($('.update').classList.contains('install')) return

        $('.update').classList.add('loading')
        $('.update-message').innerText = 'Checking...'
        ipc.send('update-check')
    })

    ipc.on('update-finish', (e, result) => {
        if(result == 'dev-mode') {
            $('.update').classList.remove('loading')
            $('.update-message').innerText = 'Not working on Development';
        }
        else if(result == 'downloaded') {
            $('.update').classList.add('install')
            $('.update').classList.remove('loading')
            $('.update-message').innerText = 'Install Update & Restart';

            $('.update.install').addEventListener('click', () => {
                $('.update').classList.add('loading')
                ipc.send('update-install')
            })
        }
        else if(result == 'available') {
            $('.update-message').innerHTML = '<b>New version! Downloading...</b>';
        }
        else if(result == 'not-available') {
            $('.update').classList.remove('loading')
            $('.update-message').innerText = 'You have latest version';
        }

        if(result != 'available' && result != 'downloaded') {
            chekingTimeout = setTimeout(() => {
                $('.update-message').innerText = 'Check for Update'
            }, 5000)
        }
    })
}

function theme()
{
    setTimeout(() => {
        $('.app').classList.add(nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    }, 1)

    nativeTheme.on('updated', () => {
        $('.app').classList.remove('dark', 'light')
        $('.app').classList.add(nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    })
}

function twentyforhour()
{
    setTimeout(function() {
        $('.twentyfourhour').classList.add(clock.isTwentyFourHour() == 'on' ? 'active' : '')
    }, 1)

    $('.twentyfourhour').addEventListener('click', e => {
        e.target.classList.toggle('active')
        ipc.send('twentyfourhour')
        updateTime()
    })
}

function compact()
{
    setTimeout(function() {
        $('.compact').classList.add(clock.isCompactView() == 'on' ? 'active' : '')
    }, 1)

    $('.compact').addEventListener('click', e => {
        e.target.classList.toggle('active')
        ipc.send('compact')
    })
}

function donate()
{
    $('.support').addEventListener('click', e => {
        ipc.send('donate')
    })
}

function about()
{
    $('.about').addEventListener('click', e => {
        ipc.send('about')
    })
}

function startup()
{
    setTimeout(function() {
        $('.startup').classList.add(launch.isAutoOpen() ? 'active' : '')
    }, 1)

    $('.startup').addEventListener('click', e => {
        e.target.classList.toggle('active')
        ipc.send('startup')
    })
}

function quit()
{
    $('.exit').addEventListener('click', () => {
        ipc.send('exit')
    })
}

function search()
{
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
                    newclock = city ? { name: city.name, full: city.name + ', ' + city.code, offset: Number(city.offset), tray: 0 } : null
                })
            }
        }
    })
}

function clocks()
{
    updateTime()
    runClock()

    ipc.on('add-clock', (e, clock) => {

        let button = document.createElement('button')

        button.classList.add(clock.tray ? 'active' : null)

        button.innerHTML = `
            <time data-offset='${clock.offset}'></time>
            ${clock.full}
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

    function runClock() {
        let now = new Date()
        let tick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

        setTimeout(function() {
            updateTime()
            runClock()
        }, tick)
    }
}

function updateTime() {
    let utc = Math.floor(new Date().getTime())

    $all('.clock button').forEach(item => {
        let time = item.querySelector('time')
        let utc_offset = utc + time.getAttribute('data-offset') * 3600000
        time.innerText = clock.formatTime(utc_offset)
    })
}

function updateAppHeight()
{
    let appHeight = parseFloat(getComputedStyle($('.app'), null).height.replace('px', ''))
    ipc.send('app-height', appHeight)
}

window.addEventListener('DOMContentLoaded', init)
document.addEventListener('dragover', event => event.preventDefault())
document.addEventListener('drop', event => event.preventDefault())
