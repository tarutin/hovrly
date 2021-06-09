const electron = require('electron')
const remote = electron.remote
const app = remote.app
const ipc = electron.ipcRenderer
const config = remote.require('./config')
const db = remote.require('./db')
const clock = remote.require('./clock')
const launch = remote.require('./launch')
const nativeTheme = remote.nativeTheme
const Sortable = require('sortablejs')
const $ = selector => document.querySelector(selector)
const $all = selector => document.querySelectorAll(selector)

function init()
{
    ipc.on('app-height-get', updateAppHeight)

    theme()
    slider()
    clocks()
    search()
    quit()
    update()
    startup()
    twentyforhour()
    compact()
    about()
    donate()
    collapse()
    sortable()

    ipc.send('ready')
}


function sortable()
{
    let sortable = Sortable.create($('.clock'), {
        draggable: 'button',
        onUpdate: () => {
            let sortTo = []
            $all('.clock button').forEach(item => {
                let name = item.getAttribute('data-name')
                sortTo.push(name)
            })

            ipc.send('clocks-sort', sortTo)
        },
    })
}

function collapse()
{
    setTimeout(function() {
        if(clock.isCollapsed() == 'on') {
            $('.app').classList.add('tiny')
            $('.clock').style.maxHeight = '565px'
        }
        else {
            $('.app').classList.remove('tiny')
            $('.clock').style.maxHeight = '310px'
        }
    }, 1)

    $('.collapse .toggle').addEventListener('click', e => {
        if($('.app').classList.contains('tiny')) {
            $('.app').classList.remove('tiny')
            $('.clock').style.maxHeight = '310px'
        }
        else {
            $('.app').classList.add('tiny')
            $('.clock').style.maxHeight = '565px'
        }

        updateAppHeight()
        ipc.send('collapse')
    })
}

function slider()
{
    current()

    $('.slider input').addEventListener('input', sliderRecalc)

    $('.slider input').addEventListener('mousedown', e => {
        $all('.clock button:not(.active)').forEach(item => {
            item.classList.add('focus')
        })
    })

    $('.slider input').addEventListener('mouseup', e => {
        current()

        $all('.clock button:not(.active)').forEach(item => {
            item.classList.remove('focus')
        })
    })

    function current()
    {
        $('.slider input').value = (new Date().getHours() * 60) + new Date().getMinutes()
        sliderRecalc()
    }
}

function update()
{
    $('.update').addEventListener('click', () => {
        if($('.update').classList.contains('install')) return

        $('.update').classList.add('loading')
        $('.update-message').innerText = 'Checking...'
        ipc.send('update-check')
    })

    ipc.on('update-finish', (e, result) => {
        if($('.update').classList.contains('install')) return

        if(result == 'dev-mode') {
            $('.update').classList.remove('loading')
            $('.update-message').innerHTML = `<span class='gray'>Not working on Development</span>`
            setTimeout(() => { $('.update-message').innerText = 'Check for Update' }, 3000)
        }

        if(result == 'downloaded') {
            $('.update').classList.add('install')
            $('.update').classList.remove('loading')
            $('.update-message').innerText = `Ready! Please Relaunch ${config.APP_NAME}` // 'Install Update & Restart'
            $('.app.tiny .collapse button').classList.add('install')

            $('.update.install').addEventListener('click', () => {
                $('.update').classList.add('loading')
                ipc.send('update-install')
            })
        }

        if(result == 'available') {
            $('.update-message').innerHTML = '<b>New version! Downloading...</b>'
        }

        if(result == 'not-available') {
            $('.update').classList.remove('loading')
            $('.update-message').innerHTML = `<span class='gray'>You have latest version</span>`
            setTimeout(() => { $('.update-message').innerText = 'Check for Update' }, 3000)
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
        if(clock.isTwentyFourHour() == 'on') {
            $('.twentyfourhour').classList.add('active')
            $('.slider .from').innerText = '00:00'
            $('.slider .to').innerText = '23:59'
        }
        else {
            $('.clock').classList.add('ampm')
            $('.slider .from').innerText = '12:00 AM'
            $('.slider .to').innerText = '11:59 PM'
        }
    }, 1)

    $('.twentyfourhour').addEventListener('click', e => {
        e.target.classList.toggle('active')

        if($('.clock').classList.contains('ampm')) {
            $('.clock').classList.remove('ampm')
            $('.slider .from').innerText = '00:00'
            $('.slider .to').innerText = '23:59'
        }
        else {
            $('.clock').classList.add('ampm')
            $('.slider .from').innerText = '12:00 AM'
            $('.slider .to').innerText = '11:59 PM'
        }

        ipc.send('twentyfourhour')
        sliderRecalc()
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

                let query = `SELECT name, UPPER(country) code, timezone FROM cities WHERE city LIKE '%${q}%' ORDER BY popularity DESC LIMIT 1`

                db.find(query, city => {
                    if(!city.timezone) return
                    $('.search label').innerText = !city ? 'Not found' : city.name + ', ' + city.code
                    newclock = city ? { name: city.name, full: city.name + ', ' + city.code, timezone: city.timezone, tray: 0 } : null
                })
            }
        }
    })
}

function clocks()
{
    setTimeout(function() {
        updateTime()
        runClock()
    }, 1)

    ipc.on('add-clock', (e, clock) => {
        if(!clock.timezone) return

        let button = document.createElement('button')

        button.classList.add(clock.tray ? 'active' : null)

        button.innerHTML = `
            <time class='clearfix' data-timezone='${clock.timezone}'></time>
            ${clock.full}
            <span class='delete'></span>
        `
        // button.setAttribute('data-id', $('.clock button').length+1)
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
        $('.clock').scrollTop = $('.clock').scrollHeight

        updateTime()
        updateAppHeight()
    })

    function runClock() {
        let now = new Date()
        let tick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

        setTimeout(function() {
            $('.slider input').value = (new Date().getHours() * 60) + new Date().getMinutes()
            sliderRecalc()
            updateTime()
            runClock()
        }, tick)
    }
}

function updateTime() {

    let val = $('.slider input').value
    let now = new Date(), then = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    let diff = Math.floor((now.getTime() - then.getTime()) / 1000)
    let offset = Math.floor((val * 60) - diff)

    $all('.clock button').forEach(item => {
        let time = item.querySelector('time')
        let tzDate = new Date().toLocaleString('en-US', {timeZone: time.getAttribute('data-timezone')})
        let utc_offset = (offset * 1000) + new Date(tzDate).getTime()
        let format = clock.formatTime(utc_offset)

        time.classList.remove('morning', 'evening')
        time.classList.add(format.morning)
        time.innerText = format.time
    })
}



function sliderRecalc()
{
    let el = $('.slider input')
    let format = clock.formatTime(el.value * 60 * 1000, true)

    $('.slider .now').innerText = format.time
    $('.slider .from').style.opacity = el.value < 200 ? 0 : 0.3
    $('.slider .to').style.opacity =  el.value > 1080 ? 0 : 0.3
    updateTime()

    let left = el.offsetWidth * (el.value - el.min) / (el.max - el.min)
    let ampm_offset = clock.isTwentyFourHour() == 'on' ? 23 : 38
    left = el.value < 1260 ? left + 25 : left - ampm_offset
    $('.slider .now').style.left = `${left}px`
}

function updateAppHeight()
{
    let appHeight = parseFloat(getComputedStyle($('.app'), null).height.replace('px', ''))
    ipc.send('app-height', appHeight)
}

window.addEventListener('DOMContentLoaded', init)
document.addEventListener('dragover', event => event.preventDefault())
document.addEventListener('drop', event => event.preventDefault())
