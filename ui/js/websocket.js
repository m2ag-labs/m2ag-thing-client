/*
 * Copyright (c) 2021. https://m2aglabs.com
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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



