//TODO: add ability to turn off console
function getWebSocket(path, callbacks = {}) {

    let uri = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    // uri += document.getElementById('connect_name').value + ':';
    // uri += document.getElementById('connect_password').value + '@'
    uri += window.location.hostname + ':8888'

    let ws = new WebSocket(`${uri}${path}`);

    if ('on_open' in callbacks) {
        ws.onopen = function (evt) {
            callbacks['on_open'](evt);
        }
    } else {
        ws.onopen = function (evt) {
           // console.log('on open ' + this.url)
        }
    }

    if ('on_close' in callbacks) {
        ws.onclose = function (evt) {
            callbacks['on_close'](evt);
        }
    } else {
        ws.onclose = function (evt) {
            console.log('on close' + evt)
        }
    }

    if ('on_message' in callbacks) {
        ws.onmessage = function (evt) {
            callbacks['on_message'](evt);
        }
    } else {
        ws.onmessage = function (evt) {
            console.log('on message' + evt.data)
        }
    }

    if ('on_error' in callbacks) {
        ws.onerror = function (evt) {
            callbacks['on_error'](evt);
        }
    } else {
        ws.onerror = function (evt) {
            console.log('on error' + evt);
        }
    }

    return ws;

}

//TODO:catch websocket errors
function wssSend(message, ws) {
    if (ws.readyState === 1) {
        ws.send(JSON.stringify(message));
    } else {
        alert("socket error")
        //ws = new WebSocket(websocket.url);
    }
}


//Comm window section

let websocket;
let websocket_reconnects = 0;

const output = document.getElementById("status_area");
const input = document.getElementById("command_area");
const thing_index = document.getElementById("thing_index");


function commInit() {

    let controls = document.getElementsByClassName('comm_action');
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', commActionHandler, false);
    }

}


function writeToScreen(message) {
    output.innerText = "";
    output.innerText = message;

    /* var pre = document.createElement("p");
     pre.style.wordWrap = "break-word";
     pre.innerHTML = message;
     output.appendChild(pre);
     */
}

function commActionHandler() {

    switch (this.id) {
        case 'connect_wss':
            websocket = getWebSocket(thing_index.value, {'on_message': writeToScreen})
            break;
        case 'disconnect_wss':
            websocket.close();
            break;
        case 'publish_message':
            let message = input.value
            try {
                message = JSON.parse(message.replace(/\n/g, ''));
                wssSend(message, websocket);
            } catch (e) {
                alert('The string entered is not json');
                return;
            }
            break;
        case 'clear_response':
            output.innerText = "";
            break;
        default:
            console.log(this.id);
            break;
    }
}