let emoji = {
    bomb: '💣',
    flag: '🚩',
    smile: {
        idle: '🙂',
        scared: '😯',
        relieved: '😅',
        thinking: '🤔',
        lost: '😵',
        win: '🤩'
    }
}
let started, gameover, timeout, timer, start_time

// reset game
function reset() {
    // reset game variables
    started = gameover = timeout = false

    // reset texts
    bombscounter.innerText = 'Click a cell to start'
    emoji_label.innerText = emoji.smile.idle

    // clear board
    container.classList.remove('gameover', 'won', 'lost')
    grid_element.querySelectorAll('*').forEach(e => e.remove())

    // create fields
    for (let y = 0; y < height_slider.value; y++) {
        let row = document.createElement('row')
        for (let x = 0; x < width_slider.value; x++) {
            let cell = document.createElement('cell')
            cell.setAttribute('x', x)
            cell.setAttribute('y', y)
            cell.setAttribute('clicked', false)
            cell.setAttribute('value', 0) // amount of bombs around
            cell.setAttribute('bomb', Math.random() < chance_slider.value / 100) // set bombs
            cell.setAttribute('flag', false) // keep track of flags

            // left click
            cell.addEventListener('click', e => {
                if (!gameover && cell.getAttribute('clicked') == 'false' && cell.getAttribute('flag') == 'false') open_cell(cell)
            })
            // right click
            cell.addEventListener('contextmenu', e => {
                // set Flag
                e.preventDefault()
                if (!gameover && cell.getAttribute('clicked') == 'false') toggle_flag(cell)
            })
            // scared emoji if unclicked mouseenter
            cell.addEventListener('mouseenter', e => {
                if (!gameover && !timeout && cell.getAttribute('clicked') == 'false') emoji_label.innerText = emoji.smile.scared
            })
            // idle emoji on mouseleave
            cell.addEventListener('mouseleave', e => {
                if (!gameover && !timeout) emoji_label.innerText = emoji.smile.idle
            })

            // append cell
            row.append(cell)
        }
        grid_element.append(row)
    }

    if (timer) clearInterval(timer)
    timer_label.innerText = '00:00:00'
}

// end the game
function end() {
    if (timer) clearInterval(timer)
    gameover = true
    container.classList.add('gameover')

    // open all cells non-recursively
    document.querySelectorAll(`cell[clicked='false']`).forEach((c, i) => {
        c.style.animationDelay = i / 50 + 's'
        c.setAttribute('clicked', true)
        if (c.getAttribute('bomb') == 'true') {
            if (c.getAttribute('flag') == 'false') c.innerText = emoji.bomb
        } else {
            c.innerText = bomb_neighbours_amount(c) || ''
        }
    })
}

// win game
function win() {
    container.classList.add('win')
    emoji_label.innerText = emoji.smile.win
    bombscounter.innerText = 'you won!'
    end()
}

// lose game
function lose() {
    container.classList.add('lost')
    emoji_label.innerText = emoji.smile.lost
    let bombfields = document.querySelectorAll(`cell[bomb='true']`)
    bombscounter.innerText = `you lost! ${document.querySelectorAll(`cell[flag='true'][bomb='true']`).length}/${bombfields.length} correct flags`
    end()
}

// uncover a cell and it's neighbours recursively
function open_cell(cell) {
    if (!started) {
        started = true
        cell.setAttribute('bomb', false)
        get_neighbours(cell).forEach(c => c.setAttribute('bomb', false))

        let bombsleft = document.querySelectorAll(`cell[bomb='true']`).length - document.querySelectorAll(`cell[flag='true']`).length
        bombscounter.innerText = bombsleft + ' bomb' + (bombsleft == 1 ? '' : 's') + ' left'
        start_time = new Date().getTime()
        timer = setInterval(() => {
            let t = new Date().getTime() - start_time
            let h = Math.floor(t / 3600000)
            h = h.toString().length == 1 ? '0' + h : h
            t -= h * 3600000
            let m = Math.floor(t / 60000)
            m = m.toString().length == 1 ? '0' + m : m
            t -= m * 60000
            let s = Math.floor(t / 1000)
            s = s.toString().length == 1 ? '0' + s : s
            t -= s * 1000

            timer_label.innerText = `${h}:${m}:${s}`
        }, 100)
    }
    // uncover cell
    cell.setAttribute('clicked', true)
    if (cell.getAttribute('bomb') == 'true') {
        cell.innerText = emoji.bomb
        lose()
    } else {
        if (!timeout) {
            emoji_label.innerText = emoji.smile.relieved
            timeout = true
            setTimeout(e => {
                emoji_label.innerText = emoji.smile.idle
                timeout = false
            }, 500)
        }

        // set bomb amount
        let value = bomb_neighbours_amount(cell)
        cell.innerText = value || ''

        // if 0 bomb neighbours, open all unclicked neighbours
        if (value == 0) get_neighbours(cell).filter(c => c.getAttribute('clicked') == 'false').forEach(c => open_cell(c))
    }

    // win if all non-bomb fields open
    if (document.querySelectorAll('cell').length - document.querySelectorAll(`cell[bomb='true']`).length == document.querySelectorAll(`cell[clicked='true']`).length) win()
}

// set or unset a flag
function toggle_flag(cell) {
    let flags_left = document.querySelectorAll(`cell[bomb='true']`).length - document.querySelectorAll(`cell[flag='true']`).length
    if (flags_left > 0) {
        if (!timeout) {
            emoji_label.innerText = emoji.smile.thinking
            timeout = true
            setTimeout(e => {
                emoji_label.innerText = emoji.smile.idle
                timeout = false
            }, 500)
        }
        cell.setAttribute('flag', cell.getAttribute('flag') != 'true')
        cell.innerText = cell.innerText ? '' : emoji.flag
        bombscounter.innerText = flags_left + ' flag' + (flags_left == 1 ? '' : 's') + ' left'
    } else if (document.querySelectorAll(`cell[bomb='false'][flag='true']`).length > 0) {
        lose()
    } else {
        win()
    }
}

// calculate amount of adjacent bombs for a cell
function bomb_neighbours_amount(cell) {
    let bomb_neighbours = get_neighbours(cell).filter(c => c.getAttribute('bomb') == 'true')
    return bomb_neighbours.length
}

// get adjacent cells of given coordinates
function get_neighbours(cell) {
    let x = parseInt(cell.getAttribute('x')), y = parseInt(cell.getAttribute('y')), query = []
    for (let _y of [-1, 0, 1]) for (let _x of [-1, 0, 1]) if (!(_x == 0 && _y == 0)) query.push(`cell[x='${x + _x}'][y='${y + _y}']`)
    return Array.from(document.querySelectorAll(query.join(', ')))
}

// reset shortcut
window.addEventListener('keyup', e => {
    if (e.key.toLowerCase() == 'r') reset()
})

// container for rows and cells
let grid_element = document.querySelector('grid')

// container of all elements
let container = document.querySelector('game')

// reset btn
document.querySelector('#reset_btn').addEventListener('click', reset)

// bombs left count
let bombscounter = document.querySelector('#bombs_label')

// timer
let timer_label = document.querySelector('#timer_label')

// size sliders
let size_label = document.querySelector('#size_label')
let width_slider = document.querySelector('#width_slider')
let height_slider = document.querySelector('#height_slider')
function set_size_label() {
    size_label.innerText = `size: ${width_slider.value}x${height_slider.value}`
}
width_slider.addEventListener('input', set_size_label)
height_slider.addEventListener('input', set_size_label)

// chance slider
let chance_label = document.querySelector('#chance_label')
let chance_slider = document.querySelector('#chance_slider')
chance_slider.addEventListener('input', () => chance_label.innerText = `bomb chance: ${chance_slider.value}%`)

// emoji display
let emoji_label = document.querySelector('#emoji_label')

// start
reset()