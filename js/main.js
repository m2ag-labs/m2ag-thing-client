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
        }







