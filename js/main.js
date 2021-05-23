

const connectModal = (mode) => {
    const modal = new bootstrap.Modal(document.getElementById('connect_modal'))
    if (mode) {
        if (config.hash === undefined) {
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

const pickModal = (mode) => {
    const modal = new bootstrap.Modal(document.getElementById('pick_modal'))
    if (mode) {
        if (config.hash === undefined) {
            connectModal(true)
        } else {
            thingerInit() // jshint ignore:line
            modal.show()
        }
    } else {
        modal.hide()
    }
}

const jwtModal = (mode) => {
    const modal = new bootstrap.Modal(document.getElementById('jwt_modal'))
    if(mode) {
        if (config.hash !== undefined) {
            fetch(`${api_url}/auth`, getOptions)
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


const mainActionHandler = (id) => {

    switch (id) {
        case 'save_password':
            const pw_1 = document.getElementById("password_1").value;
            const pw_2 = document.getElementById("password_2").value;
            if (pw_1 !== "" && pw_1 === pw_2) {
                let data = {user: document.getElementById("connect_name").value, password: pw_1};
                putOptions.data = JSON.stringify(data)
                fetch(`${api_url}/password`, putOptions)
                    .then(response => response.json())
                    .then(() => setPassword())
                    .catch(error => console.log('error', error))

            } else {
                alert("The password field can not be empty. Both fields must match"); // jshint ignore:line
            }
            break;

        case 'thing_ui_menu':
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
            break;
        default:
            console.log(this.id);
            break;
    }
}







