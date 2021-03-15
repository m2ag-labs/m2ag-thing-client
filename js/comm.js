//TODO: add ability to turn off console
function getWebSocket(path, callbacks = {}, auth = null) {

    let uri = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    uri += window.location.hostname + ':8888'
    let ws
    if(auth === null) {
        ws = new WebSocket(`${uri}${path}`)
    } else {
        ws = new WebSocket(`${uri}${path}?jwt=${auth}`)
    }

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



