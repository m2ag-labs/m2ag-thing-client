let modules = {}


function thingerInit() {

    tableInit()

    setHandlers('thinger-button-add', thingerButtonAdd)
    setHandlers('thinger-button-remove', thingerButtonRemove)

}

function tableInit(reload = true) {
    if (reload) {

        getModules('components/components.json').then(data => {
            modules.components = data
            buildTarget(data, 'components-available')
            setHandlers('thinger-control', thingerActions)
        })

        getModules('things/things.json').then(data => {
            modules.things = data
            buildTarget(data, 'things-available')
            setHandlers('thinger-control', thingerActions)
        })
    }
    fetch(`${api_url}/config`, fetchDataOptions('GET'))
        .then(response => response.json())
        .then(result => {
            modules.icomponents = result.data.hardware
            buildTarget(result.data.hardware, 'components-installed')
            modules.ithings = result.data.things
            buildTarget(result.data.things, 'things-installed')
            setHandlers('thinger-control', thingerActions)
        })
        .catch(error => console.log('error', error))

    buttonsOff()
}

function buttonsOff(mode = 'off') {
    let _add = 'none', _remove = 'none'
    if (mode === 'add') {
        _add = 'inline'
    } else if (mode === 'remove') {
        _remove = 'inline'
    }
    let i, ele = document.getElementsByClassName('thinger-button-remove')
    for (i = 0; i < ele.length; i++) {
        ele[i].style.display = _remove
    }
    ele = document.getElementsByClassName('thinger-button-add')
    for (i = 0; i < ele.length; i++) {
        ele[i].style.display = _add
    }
}

function setHandlers(_class, _handler) {
    const controls = document.getElementsByClassName(_class)
    for (const control in controls) {
        if (controls.hasOwnProperty(control))
            controls[control].addEventListener('click', _handler)
    }
}

function thingerActions(event) {
    const off = document.getElementsByClassName('thinger-control')
    for (const i in off) {
        if (off.hasOwnProperty(i))
            off[i].classList.remove('list-group-item-primary')
    }
    document.getElementById(this.id).classList.add('list-group-item-primary')
    if (this.id.slice(this.id.length - '-available'.length) === '-available')
        buttonsOff('add')
    else
        buttonsOff('remove')

}

function thingerButtonRemove(event) {
    let path = ''
    const mod = document.getElementsByClassName('thinger-control list-group-item-primary')
    if (this.id === 'remove-components') {
        const stub = mod[0].id.slice(0, mod[0].id.length - '-components-installed'.length)
        fetch(`${api_url}/components/${stub}`, fetchDataOptions('DELETE', JSON.stringify({})))
            .then(response => response.json())
            .then(result => tableInit(false))
            .catch(error => console.log('error', error))
    } else {
        const stub = mod[0].id.slice(0, mod[0].id.length - '-things-installed'.length)
        fetch(`${api_url}/things/${stub}`, fetchDataOptions('DELETE', JSON.stringify({})))
            .then(response => response.json())
            .then(result => tableInit(false))
            .catch(error => console.log('error', error))
    }
}

function thingerButtonAdd() {
    let path = ''
    const mod = document.getElementsByClassName('thinger-control list-group-item-primary')

    if (this.id === 'add-components') {

        const stub = mod[0].id.slice(0, mod[0].id.length - '-components-available'.length)
        path = `components/${stub}/${stub}.`
        //Does this need a driver?
        if ('driver' in modules.components[stub]) {
            for (let i = 0; i < modules.components[stub].driver.length; i++) {
                document.getElementById('advice-text').innerText = `installing ${modules.components[stub].driver[i]}`
                $('#advice-toast').toast({delay: 5000}).toast('show')
                fetch(`${api_url}/pip/${modules.components[stub].driver[i]}`, fetchDataOptions('PUT', JSON.stringify({})))
                    .then(response => response.json())
                    .then(result => $('#advice-toast').toast('hide'))
                    .catch(error => console.log('error', error))
            }
        }
        getModules(path + 'json').then(data => {
            fetch(`${api_url}/config/components/${stub}`, fetchDataOptions('PUT', JSON.stringify(data)))
                .then(response => response.json())
                .then(result => tableInit(false))
                .catch(error => console.log('error', error))
        })
        getModules(path + 'py', 'text').then(data => {
            fetch(`${api_url}/components/${stub}`, fetchDataOptions('PUT', JSON.stringify(data)))
                .then(response => response.json())
                .catch(error => console.log('error', error))
        })
    } else {
        const stub = mod[0].id.slice(0, mod[0].id.length - '-things-available'.length)
        path = `things/${stub}/${stub}.`
        getModules(path + 'json').then(data => {
            fetch(`${api_url}/config/things/${stub}`, fetchDataOptions('PUT', JSON.stringify(data)))
                .then(response => response.json())
                .then(result => tableInit(false))
                .catch(error => console.log('error', error))

        })
        //TODO: fix this for things that use generic
        //Generates not found error
        getModules(path + 'py', 'text').then(data => {

            fetch(`${api_url}/things/${stub}`, fetchDataOptions('PUT', JSON.stringify(data)))
                .then(response => response.json())
                .catch(error => console.log('error', error))


        }).catch(error => {
            // console.log(error)
            //Nothing to do here -- most things won't have a py helper.
        })
    }

}

function buildTarget(data, target) {
    let list = ""
    for (const ele in data) {
        if (data.hasOwnProperty(ele)) {
            list += getLi(ele, target)
        }

    }
    document.getElementById(target).innerHTML = list
}

function getLi(data, type) {
    return `<li class="list-group-item text-center thinger-control" id="${data}-${type}">
                        <h6>${data}</h6>
                </li>`
}

