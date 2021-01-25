let auth_hash;
let jwt_token;

function mainInit() {

    let controls = document.getElementsByClassName('control_action')
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', mainActionHandler, false)
    }
    let server_ui
    manageLocalStorage('load') //sets dataOptions dataHeader too
    if (auth_hash !== undefined) {
        fetch(`${api_url}/config`, getDataOptions)
            .then(response => response.json())
            .then(result => {
                create_device_tree(result)
                server_ui = result.data.server.ui
            })
            .catch(error => console.log('error', error))
        treeInit()
        //get a valid jwt token from the sever, set in options, call fetch
        fetch(`${api_url}/auth`, getDataOptions)
            .then(response => response.json())
            .then(result => {
                jwt_token = result.data['token']
                thingHeaders.append("Authorization", "Bearer " + jwt_token);
                fetch(`${thing_url}/`, getThingOptions)
                    .then(response => response.json())
                    .then(result => uiInit(result, server_ui))
                    .catch(error => console.log('error', error))
            })
            .catch(error => console.log('error', error))
    } else {
        manageModal('show')
    }
}

function uiInit(thing, server_ui = undefined) {
    let ui_html = ''
    //ui-tab-list -- append to there
    //When server ui is defined, make it the default
    //Key is ui name, array is modules things need to be passed to ui.

    for (let i = 0; i < thing.length; i++) {
        if (i === 0 && server_ui === undefined) {
            //TODO: set to fist thing
            // document.getElementById('ui_frame').src = `${window.location.origin}/ui/raspiui.html?index=${i}&socket=true&jwt=${jwt_token}`
            ui_html = createUiLi(thing[i].title, i, false)
        } else {
            ui_html += createUiLi(thing[i].title, i, false)
        }

    }
    //Custom marker flags ui
    if (server_ui !== undefined && server_ui !== 'none') {
        const ui_file = Object.keys(server_ui)[0]
        const index = server_ui[ui_file][0]
        // document.getElementById('ui_frame').src = `${window.location.origin}/ui/${ui_file}.html?index=${index}&socket=true&jwt=${jwt_token}`
        ui_html += createUiLi(`custom.${ui_file}`, index, false)
    }
    document.getElementById('ui-tab-list').innerHTML = ui_html

    let controls = document.getElementsByClassName('ui-select')
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', uiActionHandler, false)
    }

}

function createUiLi(tag, index, selected = false) {
    return `<li class="nav-item ui-select"  id="${tag}.${index}">
                <a aria-controls="${tag}" aria-selected="${selected.toString()}" class="nav-link"
                   data-toggle="pill"
                   href="#"
                   role="tab">${tag}</a>
            </li>`
    //put the index of the thing in the name field -- use to set src page
}

function uiActionHandler() {
    let idx = this.id.split('.')
    if (idx[0] !== 'custom') {
        document.getElementById('ui_frame').src =
            `${window.location.origin}/ui/raspiui.html?index=${idx[idx.length - 1]}&socket=true&jwt=${jwt_token}`
    } else {
        document.getElementById('ui_frame').src =
            `${window.location.origin}/ui/${idx[1]}.html?index=${idx[idx.length - 1]}&socket=true&jwt=${jwt_token}`
    }
}

function manageModal(mode, dialog = "connect_menu") {
    if (dialog === "connect_menu") {
        if (auth_hash === undefined) {
            document.getElementById("clear_login").disabled = true;
            document.getElementById("save_login").disabled = false;
        } else {
            document.getElementById("clear_login").disabled = false;
            document.getElementById("save_login").disabled = true;
        }
        if (mode === 'show') {
            $('#connect_modal').modal('show');
        } else {
            $('#connect_modal').modal('hide');
        }
    }

    if (dialog === 'comm_menu') {
        if (mode === 'show') {
            $('#comm_modal').modal('show');
        } else {
            $('#comm_modal').modal('hide');
        }
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
        case 'connect_menu':
        case 'comm_menu':
            manageModal('show', this.id);
            break;
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
                putDataOptions['data'] = JSON.stringify(data)
                fetch(`${api_url}/password`, putDataOptions)
                    .then(response => response.json())
                    .then(() => setPassword())
                    .catch(error => console.log('error', error))

            } else {
                alert("The password field can not be empty. Both fields must match"); // jshint ignore:line
            }
            break;
        case 'about_link':
            alert("m2ag.labs thing client version 1.0. Usage info available at m2aglabs.com"); // jshint ignore:line
            break;
        case 'pick_menu':
            if (auth_hash !== undefined) {
                thingerInit()
                $("#pick_modal").modal("show")
            } else {
                manageModal('show')
            }
            break;
        case 'token_menu':
            if (auth_hash !== undefined) {
                fetch(`${api_url}/auth`, getDataOptions)
                    .then(response => response.json())
                    .then(result => {
                        document.getElementById('thing_url').innerText = thing_url
                        document.getElementById('jwt_token').innerText = result['data']['token']
                    })
                    .catch(error => console.log('error', error))
                $("#jwt_modal").modal("show")
            } else {
                manageModal('show')
            }
            break;
        default:
            console.log(this.id);
            break;
    }
}

window.addEventListener("load", mainInit, false)





