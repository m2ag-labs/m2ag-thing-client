let poll_enable = false;
let auth_hash;
let poll_targets = [];

window.addEventListener("load", mainInit, false)

function mainInit() {

    let controls = document.getElementsByClassName('control_action')
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', mainActionHandler, false)
    }

    manageLocalStorage('load')
    if (auth_hash !== undefined) {
        fetch(`${api_url}/config`, fetchDataOptions('GET'))
            .then(response => response.json())
            .then(result => {
                create_device_tree(result)
                if ('features' in result.data) {
                    let GE = customElements.get('service-element')
                    for (let i = 0; i < result.data['features'].length; i++) {
                        const id = result.data['features'][i]
                        thing = new GE({context: id})
                        thing.id = id
                        document.getElementById('service-status-list').appendChild(thing)
                    }
                }
            })
            .catch(error => console.log('error', error))
        //add teh device tree handler here to avoid multiple addition
        treeInit()
        commInit()

        fetch(`${thing_url}/`, fetchThingOptions('GET'))
            .then(response => response.json())
            .then(result => uiInit(result))
            .catch(error => console.log('error', error))


    } else {
        manageModal('show')
    }

    //Set iframes, turn on controls, etc.
    //TODO: check if ui is enabled.
    //TODO: change to ui by jstree if one is available.
    //Add thing one always
    let GE = customElements.get('service-element')

    let thing = new GE({context: 'm2ag-thing'})
    thing.id = 'm2ag-thing';
    document.getElementById('service-status-list').appendChild(thing)

}

function uiInit(thing) {
    //ui-tab-list -- append to there
    let first = true
    let ui_html = ''
    for (let i = 0; i < thing.length; i++) {
        if (i === 0) {
            first = false
            //TODO: set to fist thing
            document.getElementById('ui_frame').src = `${window.location.origin}/ui/raspiui.html?index=${i}&socket=true`
            ui_html = createUiLi(thing[i].title, i, true)
        } else {
            ui_html += createUiLi(thing[i].title, i, false)
        }

    }
    document.getElementById('ui-tab-list').innerHTML = ui_html

    let controls = document.getElementsByClassName('ui-select')
    for (let i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', uiActionHandler, false)
    }

}

function createUiLi(tag, index, selected = false) {
    return `<li class="nav-item ui-select"  id="${tag}.${index}">
                <a aria-controls="${tag}" aria-selected="${selected.toString()}" class="nav-link ${selected ? 'active' : ''}"
                   data-toggle="pill"
                   href="#"
                   role="tab">${tag}</a>
            </li>`
    //put the index of the thing in the name field -- use to set src page
}

function uiActionHandler() {
    let idx = this.id.split('.')
    document.getElementById('ui_frame').src =
        `${window.location.origin}/ui/raspiui.html?index=${idx[idx.length - 1]}&socket=true`
}


/**
 *  Poll the services to get realtime status
 *  If not polled last reported time is displayed
 */
function pollStatus() {
    if (poll_targets.length === 0) {
        poll_targets = document.getElementsByTagName('service-element')
    }
    if (poll_targets.length > 0) {
        for (let i = 0; i < poll_targets.length; i++) {
            poll_targets[i].poll(true)
        }
        if (poll_enable) {
            setTimeout(pollStatus, 3000)
        } else {
            for (let i = 0; i < poll_targets.length; i++) {
                poll_targets[i].poll(false)
            }
        }
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
            } catch (e) {
                //It's ok, just continue if not set
            }
            break;
        case 'save':
            auth_hash = btoa(document.getElementById('connect_name').value + ":" + document.getElementById('connect_password').value);
            config = {
                "name": document.getElementById("connect_name").value,
                "pw": document.getElementById("connect_password").value,
                "hash": auth_hash
            };
            localStorage.setItem('client_config', JSON.stringify(config));
            fetch(`${api_url}/config`, fetchDataOptions('GET'))
                .then(response => response.json())
                .then(result => create_device_tree(result))
                .catch(error => console.log('error', error))

            window.location.reload()
            break;
        case 'clear':
            localStorage.setItem('client_config', JSON.stringify(config));
            document.getElementById("connect_name").value = "";
            document.getElementById("connect_password").value = "";
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
            if (document.getElementById('connect_name').value !== '' && document.getElementById('connect_password').value !== '') {
                manageLocalStorage('save')
                manageModal('hide')
            } else {
                alert("Please enter a username and password")
            }
            break;
        case 'clear_login':
            manageLocalStorage('clear')
            auth_hash = undefined
            manageModal('hide')
            break
        case 'save_password':
            const pw_1 = document.getElementById("password_1").value;
            const pw_2 = document.getElementById("password_2").value;
            if (pw_1 !== "" && pw_1 === pw_2) {
                let data = {user: document.getElementById("connect_name").value, password: pw_1};
                fetch(`${api_url}/password`, fetchDataOptions('PUT', JSON.stringify(data)))
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
        case 'poll_switch':
            if (document.getElementById('poll_switch').checked) {
                poll_enable = true;
                pollStatus();
            } else {
                poll_enable = false;
            }
            break;
        case 'pick_menu':
            thingerInit()
            $("#pick_modal").modal("show")
            break;
        default:
            console.log(this.id);
            break;
    }
}







