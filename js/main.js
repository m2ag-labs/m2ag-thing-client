const version_info = 'beta 1, 2021'
let auth_hash;
let jwt_token;
let server_ui


function mainInit() {
    document.title = window.location.hostname
    let controls = document.getElementsByClassName('control_action')
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', mainActionHandler, false)
    }
    manageLocalStorage('load') //sets dataOptions dataHeader too
    if (auth_hash !== undefined) {
        fetch(`${api_url}/config`, getDataOptions)
            .then(response => response.json())
            .then(result => {
                create_device_tree(result) // jshint ignore:line
                server_ui = result.data.server.ui
            }).catch(error => console.log('error', error))
        treeInit() // jshint ignore:line
        //get a valid jwt token from the sever, set in options, call fetch
        fetch(`${api_url}/auth`, getDataOptions)
            .then(response => response.json())
            .then(result => {
                jwt_token = result.data['token']
                thingHeaders.append("Authorization", "Bearer " + jwt_token);
            })
            .catch(error => console.log('error', error))
    } else {
        connectModal('show')
    }
}

function uiLoad() {
    fetch(`${thing_url}/`, getThingOptions)
        .then(response => response.json())
        .then(result => uiInit(result, server_ui))
        .catch(error => console.log('error', error))
}



function connectModal(mode) {
    const modal = new bootstrap.Modal(document.getElementById('connect_modal'))
    if (mode) {
        if (auth_hash === undefined) {
            document.getElementById("clear_login").disabled = true;
            document.getElementById("save_login").disabled = false;
        } else {
            document.getElementById("clear_login").disabled = false;
            document.getElementById("save_login").disabled = true;
        }
        modal.show()
    } else {
        modal.hide()
    }
}

function pickModal(mode) {
    const modal = new bootstrap.Modal(document.getElementById('pick_modal'))
    if (mode) {
        if (auth_hash === undefined) {
            connectModal(true)
        } else {
            thingerInit() // jshint ignore:line
            modal.show()
        }
    } else {
        modal.hide()
    }
}

function jwtModal(mode) {
    const modal = new bootstrap.Modal(document.getElementById('jwt_modal'))
    if(mode) {
        if (auth_hash !== undefined) {
            fetch(`${api_url}/auth`, getDataOptions)
                .then(response => response.json())
                .then(result => {
                    document.getElementById('thing_url').innerText = thing_url
                    document.getElementById('jwt_token').innerText = result.data.token
                })
                .catch(error => console.log('error', error))
            modal.show()
        } else {
            connectModal(true)
        }
    } else {
        modal.hide()
    }
 }

function manageLocalStorage(mode = 'load') {
    let config = {};
    switch (mode) {
        case 'load':
            config = localStorage.getItem('client_config');
            try {
                config = JSON.parse(config);
                document.getElementById("connect_name").value = config.name || "";
                document.getElementById("connect_password").value = config.pw || "";
                auth_hash = config.hash;
                //set options header for
                dataHeaders.append("Authorization", 'Basic ' + config.hash);
            } catch (e) {
                //It's ok, just continue if not set
            }
            break;
        case 'save':
            auth_hash = btoa(document.getElementById('connect_name').value + ":" + document.getElementById('connect_password').value);
            dataHeaders.set("Authorization", 'Basic ' + auth_hash)
            config = {
                //"name": document.getElementById("connect_name").value,
                //"pw": document.getElementById("connect_password").value,
                "hash": auth_hash
            };
            localStorage.setItem('client_config', JSON.stringify(config));
            /*fetch(`${api_url}/config`, getDataOptions)
                .then(response => response.json())
                .then(result => create_device_tree(result))
                .catch(error => console.log('error', error))*/
            break;
        case 'clear':
            localStorage.setItem('client_config', JSON.stringify(config));
            document.getElementById("connect_name").value = "";
            document.getElementById("connect_password").value = "";
            dataHeaders.delete("Authorization")
            break;
        default:
            console.log("unknown local storage operation");
            break;
    }

}

function setPassword() {
    auth_hash = btoa(document.getElementById('connect_name').value + ":" + document.getElementById('password_1').value);
    document.getElementById('connect_password').value = document.getElementById('password_1').value;
    manageLocalStorage('save');
}

function mainActionHandler() {

    switch (this.id) {
        case 'save_login':
        case 'connect_password':
            if (auth_hash === undefined) {
                if (document.getElementById('connect_name').value !== '' && document.getElementById('connect_password').value !== '') {
                    manageLocalStorage('save')
                    location.reload()
                } else {
                    alert("Please enter a username and password")
                }
            }
            break;
        case 'clear_login':
            manageLocalStorage('clear')
            location.reload()
            break
        case 'save_password':
            const pw_1 = document.getElementById("password_1").value;
            const pw_2 = document.getElementById("password_2").value;
            if (pw_1 !== "" && pw_1 === pw_2) {
                let data = {user: document.getElementById("connect_name").value, password: pw_1};
                putDataOptions.data = JSON.stringify(data)
                fetch(`${api_url}/password`, putDataOptions)
                    .then(response => response.json())
                    .then(() => setPassword())
                    .catch(error => console.log('error', error))

            } else {
                alert("The password field can not be empty. Both fields must match"); // jshint ignore:line
            }
            break;
        case 'about_link':
            alert(`m2ag.labs thing builder ${version_info} `); // jshint ignore:line
            break;
        case 'thing_ui_menu':
            if (auth_hash !== undefined) {
                const src = document.getElementById('ui_frame').src
                if (src.includes('index.html')) {
                    document.getElementById('thing_ui_url').innerText = "select a thing and try again"
                } else {
                    let uri = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
                    uri += window.location.hostname + ':8888'
                    const split = src.substr(src.indexOf('index=')).split('&')
                    let path = '/'
                    let auth = '?'
                    path += split[0].split('=')[1]
                    auth += split[split.length - 1]
                    document.getElementById('thing_ui_url').innerText = src
                    document.getElementById('thing_ws_url').innerText = `${uri}${path}${auth}`

                }
                $("#thing_ui_modal").modal("show")
            } else {
                connectModal('show')
            }
            break;
        case 'things_tab':
            uiLoad()
            break
        default:
            console.log(this.id);
            break;
    }
}

window.addEventListener("load", mainInit, false)





