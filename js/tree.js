const device_tree_area = $('#device_tree_area');
const all_pills = document.getElementsByClassName('all_pills')
let current_node = ''
let current_data = ''
let current_view = 'none'

const thing_tab = new bootstrap.Tab(document.querySelector('#thing-tab'))
const tabsOff = (view) => {
    if(view !== current_view) {
        current_view = view
        thing_tab.show()
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
    if ('index' in node.original) {
        tabsOff(node.original.index)
        switch (node.original.index) {
            case 'm2ag-thing-tag':
                if ('ui' in node.original) {
                    document.getElementsByClassName('ui_pill').item(0).style.display = 'block'
                    document.getElementById('ui_frame').src =
                       `${window.location.origin}/ui/raspiui.html?index=${node.original.ui}&socket=true&jwt=${jwt_token}` // jshint ignore:line
                }
                if ('helper' in node.original && node.original.helper !== false) {
                    document.getElementsByClassName('helper_pill').item(0).style.display = 'block'
                    document.getElementById('helper_frame').src =
                       `${window.location.origin}/ui/editor.html?path=${node.original.helper}&type=python&auth=${auth_hash}`

                }
                break
            case 'm2ag-server-tag':
                document.getElementsByClassName('service_pill').item(0).style.display = 'block'
                if ('ui' in node.original) {
                    document.getElementById('ui_frame').src = node.original.ui
                }
                break
            case 'm2ag-service-tag':

                break
            default:
                break
        }
    }

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
    let current_data = response.data
    let root = {
        "icon": "../../css/images/cpu.svg",
        "text": current_data.server.id,
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

    for (let i in current_data.available) { // jshint ignore:line
        if (current_data.available.hasOwnProperty(i) && current_data.enabled.indexOf(current_data.available[i]) < 0) {
            let helper = false
            if(current_data.helpers.indexOf(current_data.available[i]) !== -1) {
                helper = `config/helpers/${current_data.available[i]}`
            }
            root.children[root.children.length - 1].children.push({
                "icon": "../../css/images/file-text.svg",
                "type": "thing",
                "text": current_data.available[i],
                "index": "m2ag-thing-tag",
                "data": `config/things/${current_data.available[i]}`,
                "helper": helper
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

    for (let i in current_data.enabled) { // jshint ignore:line
        if (current_data.enabled.hasOwnProperty(i)) {
            let helper = false
            if(current_data.helpers.indexOf(current_data.enabled[i]) !== -1) {
                helper = `config/helpers/${current_data.enabled[i]}`
            }
            root.children[root.children.length - 1].children.push({
                "type": "thing",
                "text": current_data.enabled[i],
                "index": "m2ag-thing-tag",
                "ui": i,
                "data": `config/things/${current_data.enabled[i]}`,
                "helper": helper
            });
        }
    }

    root.children.push({
        "icon": "../../css/images/tools.svg",
        "text": 'services',
        "state": {"opened": true},
        "children": []
    });
    for (let i in current_data.services) { // jshint ignore:line
        if (current_data.services.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "type": "service",
                "text": current_data.services[i],
                "data": `${current_data.services[i]}/status`,
                "index": "m2ag-service-tag"
            });
        }
    }
    device_tree_area.jstree(true).settings.core.data = [root];
    device_tree_area.jstree(true).refresh();
}


const treeInit = () => { // jshint ignore:line
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

}
