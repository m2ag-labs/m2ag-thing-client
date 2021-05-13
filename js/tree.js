const device_tree_area = $('#device_tree_area');
const all_pills = document.getElementsByClassName('all_pills')
let current_node = ''
let current_view = 'none'
let editors = {}


const editorsInit = () => {
    editors.service = ace.edit("service_editor")  // jshint ignore:line
    editors.thing = ace.edit("thing_editor") // jshint ignore:line
    editors.helper = ace.edit("helper_editor") // jshint ignore:line
    for (const i in editors) {
        if (editors.hasOwnProperty(i)) {
            editors[i].setTheme("ace/theme/chrome")
            editors[i].setOptions({fontSize: "12pt"});
        }
    }

}

const editorsClear = () => {
    for (const i in editors) {
        if (editors.hasOwnProperty(i)) {
            editors[i].session.setValue('no data')
            editors[i].session.setMode("ace/mode/text")
        }
    }
}
const service_tab = new bootstrap.Tab(document.querySelector('#service-tab'))
const tabsOff = (view) => {
    if(view !== current_view) {
        current_view = view
        service_tab.show()
        document.getElementById('service-button-bar').style.display = 'none'
    }
     for (const i of all_pills) {
            i.style.display = 'none'
     }
}

/**
 * On move is only tracked for things.
 * Must restart thing server when a change is made
 * @param data
 */
const handleMoveNode = (data) => {
    let update = {"enabled": []}
    for (let i of data.instance.get_json()[0].children) {
        if (i.text === 'enabled') {
            for (let j of i.children) {
                update.enabled.push(j.text)
            }
            break
        }
    }

    putDataOptions.body = JSON.stringify(update) // jshint ignore:line
    fetch(`${api_url}/config/enabled`, putDataOptions)// jshint ignore:line
        .then(response => response.json())
        .then(result => {
            create_device_tree(result)
        })
        .catch(error => console.log('error', error))

}


const setDetail = (node) => {
    editorsClear()
    if ('index' in node.original) {
        tabsOff(node.original.index)
        switch (node.original.index) {
            case 'm2ag-thing-tag':
                editors.service.session.setMode("ace/mode/json")
                document.getElementsByClassName('thing_pill').item(0).style.display = 'block'
                editors.thing.session.setMode("ace/mode/json")
                editors.helper.session.setMode("ace/mode/python")
                editors.service.session.setValue(JSON.stringify(current_node.service, null, 2))
                editors.service.setReadOnly(true);
                editors.thing.session.setValue(JSON.stringify(current_node.thing, null, 2))
                editors.thing.setReadOnly(true);
                if ('ui' in node.original) {
                    document.getElementsByClassName('ui_pill').item(0).style.display = 'block'
                    document.getElementById('ui_frame').src =
                        `${window.location.origin}/ui/raspiui.html?index=${node.original.ui}&socket=true&jwt=${jwt_token}` // jshint ignore:line
                }
                if ('helper' in current_node && current_node.helper !== 'none') {
                    document.getElementsByClassName('helper_pill').item(0).style.display = 'block'
                    editors.helper.session.setValue(current_node.helper)
                    editors.helper.setReadOnly(true);
                }
                break
            case 'm2ag-server-tag':
                editors.service.session.setMode("ace/mode/json")
                editors.service.session.setValue(JSON.stringify(current_node, null, 2))
                document.getElementsByClassName('service_pill').item(0).style.display = 'block'
                editors.service.setReadOnly(true)
                //TODO: - test this - can I get to node red ui from here?
                if ('ui' in node.original) {
                    document.getElementById('ui_frame').src = node.original.ui
                }
                break
            case 'm2ag-service-tag':
                editors.service.session.setMode("ace/mode/text")
                editors.service.session.setValue(current_node)
                setServiceButtons()
                document.getElementById('service-button-bar').style.display = 'block'
                document.getElementById('service-button-label').innerText = node.original.text
                editors.service.setReadOnly(true)
                break
            default:
                break
        }
    }

}

const setServiceButtons = () =>{
    const isRunning = current_node.split("\n")[2].trim().indexOf(`(running)`) > -1
    const isEnabled = current_node.split("\n")[1].trim().indexOf(`service; enabled;`) > -1
    if(isRunning){
        document.getElementById("service-start-button").innerText = 'stop'
        document.getElementById("service-start-button").classList.remove('btn-success')
        document.getElementById("service-start-button").classList.add('btn-danger')
    } else {
        document.getElementById("service-start-button").innerText = 'start'
        document.getElementById("service-start-button").classList.remove('btn-danger')
        document.getElementById("service-start-button").classList.add('btn-success')
    }
    if(isEnabled){
        document.getElementById("service-enable-button").innerText = 'disable'
        document.getElementById("service-enable-button").classList.remove('btn-success')
        document.getElementById("service-enable-button").classList.add('btn-danger')
    } else {
        document.getElementById("service-enable-button").innerText = 'enable'
        document.getElementById("service-enable-button").classList.remove('btn-danger')
        document.getElementById("service-enable-button").classList.add('btn-success')
    }

}


const serviceButtonClick = (action) => {
    console.log(action)
    let endpoint = document.getElementById('service-button-label').innerText + '/'
    switch(action){
        case 'enable':
            if(document.getElementById("service-enable-button").innerText === 'enable'){
                endpoint += 'enable'
            } else {
                endpoint +=  'disable'
            }
            break
        case 'start':
            if(document.getElementById("service-start-button").innerText === 'start'){
                endpoint += 'start'
            } else {
                endpoint +=  'stop'
            }
            break
    }
    fetch(`${api_url}/${endpoint}`, getDataOptions)
                .then(response => response.json())
                .then(result => {
                    editors.service.session.setValue(result.data)
                    current_node = result.data
                    setServiceButtons()
                })
                .catch(error => console.log('error', error))
}

const handleChangeTree = (data) => {
    current_node = ''
    document.getElementById('ui_frame').src = ''
    if (data.node !== undefined && data.node.data !== null) {
        fetch(`${api_url}/${data.node.data}`, getDataOptions)// jshint ignore:line
            .then(response => response.json())
            .then(result => {
                current_node = result.data
                setDetail(data.node, result)
            })
            .catch(error => console.log('error', error))
    }
}


const disableTree = () => { // jshint ignore:line
    // disable visible nodes
    $('#device_tree_area li.jstree-node').each(function () {
        $('#device_tree_area').jstree("disable_node", this.id)
    })
    // block open new nodes
    $('#device_tree_area i.jstree-ocl').off('click.block').on('click.block', function () {
        return false;
    });

}

const enableTree = () => { // jshint ignore:line
    // enable again visible nodes
    $('#device_tree_area li.jstree-node').each(function () {
        $('#device_tree_area').jstree("enable_node", this.id)
    });
    // unblock open new nodes
    $('#device_tree_area i.jstree-ocl').off('click.block');
}

const create_device_tree = (response) => { // jshint ignore:line
    let data = response.data
    let root = {
        "icon": "../../css/images/cpu.svg",
        "text": data.server.id,
        "data": `config/server`,
        "index": 'm2ag-server-tag',
        "state": {"opened": true},
        "type": "root",
        "children": []
    };

    root.children.push({
        "icon": "../../css/images/node-minus.svg",
        "text": "available",
        "type": "component",
        "state": {"opened": false},
        "children": []
    });

    for (let i in data.available) { // jshint ignore:line
        if (data.available.hasOwnProperty(i) && data.enabled.indexOf(data.available[i]) < 0) {
            root.children[root.children.length - 1].children.push({
                "icon": "../../css/images/file-text.svg",
                "type": "thing",
                "text": data.available[i],
                "index": "m2ag-thing-tag",
                "data": `config/things/${data.available[i]}`
            });
        }
    }


    root.children.push({
        "icon": "../../css/images/node-plus.svg",
        "text": "enabled",
        "type": "component",
        "state": {"opened": true},
        "children": []
    });

    for (let i in data.enabled) { // jshint ignore:line
        if (data.enabled.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "type": "thing",
                "text": data.enabled[i],
                "index": "m2ag-thing-tag",
                "ui": i,
                "data": `config/things/${data.enabled[i]}`
            });
        }
    }

    root.children.push({
        "icon": "../../css/images/tools.svg",
        "text": 'services',
        "state": {"opened": true},
        "children": []
    });
    for (let i in data.services) { // jshint ignore:line
        if (data.services.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "type": "service",
                "text": data.services[i],
                "data": `${data.services[i]}/status`,
                "index": "m2ag-service-tag"
            });
        }
    }
    device_tree_area.jstree(true).settings.core.data = [root];
    device_tree_area.jstree(true).refresh();
}


const treeInit = () => { // jshint ignore:line
    editorsInit()
    tabsOff()
    device_tree_area.jstree({
        "types": {
            "default": {
                "icon": "../../css/images/type.svg"
            },
            "thing": {
                "icon": "../../css/images/speedometer2.svg"
            },
            "service": {
                "icon": "../../css/images/led-green.png"
            }
        },
        "dnd": {
            check_while_dragging: true
        },
        "plugins": ["dnd", "types", "wholerow"],
        "core": {
            'check_callback': function (operation, node, node_parent) {
                if (operation === "move_node") {
                    return node.type === "thing" && node_parent.original.type === "component"; //only allow dropping inside nodes of type 'Parent'
                }
                return false;  //allow all other operations
            }
        }
    });
    device_tree_area.on("changed.jstree", function (e, data) { // jshint ignore:line
        handleChangeTree(data)
    });
    device_tree_area.bind("move_node.jstree", function (e,data) { // jshint ignore:line
        handleMoveNode(data)
    });
    // get the current enabled list, write to server, update tree from response
    // set current state and set tree back to the same.

}
