const device_tree_area = $('#device_tree_area') // uses jquery
const all_pills = document.getElementsByClassName('all_pills')
const iframes = document.querySelectorAll("iframe");

let current_view = 'none'
let current_tab = 'none'
let current_node = 'none'

let thing_tab = new bootstrap.Tab(document.querySelector('#thing-tab')); // jshint ignore:line
let service_tab = new bootstrap.Tab(document.querySelector('#service-tab')) // jshint ignore:line
const setTabs = (view) => {
    document.getElementById('thing_frame').contentWindow.location.replace('ui/blank.html')
    document.getElementById('ui_frame').contentWindow.location.replace('ui/blank.html')
    document.getElementById('service_frame').contentWindow.location.replace('ui/blank.html')
    document.getElementById('helper_frame').contentWindow.location.replace('ui/blank.html')
    if (view !== current_view) {
        current_view = view
        if (current_view === 'm2ag-thing-tag') {
            thing_tab.show()
            current_tab = 'thing-tab'
        } else {
            service_tab.show()
            current_tab = 'service-tab'
        }
    }
    for (const i of all_pills) {
        i.style.display = 'none'
    }

}

const tabClickHandler = (tab) => { // jshint ignore:line
    current_tab = tab
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

const resizeAll = (frame_only = false) => {
    for( let i = 0; i < iframes.length; i++) {
        if(!frame_only) {
            iframes[i].style.height = `${window.innerHeight - 150}px`
        }
        iframes[i].contentWindow.postMessage(window.innerHeight, window.origin)
    }
}

const setDetail = (node) => {
    if ('index' in node.original) {
        setTabs(node.original.index)
        switch (node.original.index) {
            case 'm2ag-thing-tag':
                document.getElementsByClassName('thing_pill').item(0).style.display = 'block'
                document.getElementById('thing_frame').contentWindow.location.replace(
                    `ui/editor.html?path=${node.data}&type=json&auth=${auth_hash}&ts=${Date.now()}`) // jshint ignore:line

                if ('ui' in node.original) {
                    document.getElementsByClassName('ui_pill').item(0).style.display = 'block'
                    document.getElementById('ui_frame').contentWindow.location.replace(`ui/raspiui.html?index=${node.original.ui}&socket=true&jwt=${jwt_token}`) // jshint ignore:line
                } else if (current_tab === 'ui-tab'){
                    thing_tab.show()
                }
                if ('helper' in node.original && node.original.helper !== false) {
                    document.getElementsByClassName('helper_pill').item(0).style.display = 'block'
                    document.getElementById('helper_frame').contentWindow.location.replace(`ui/editor.html?path=${node.original.helper}&type=python&auth=${auth_hash}&ts=${Date.now()}`) // jshint ignore:line

                } else if(current_tab === 'helper-tab'){
                    thing_tab.show()
                }
                break
            case 'm2ag-server-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/editor.html?path=${node.data}&type=json&auth=${auth_hash}&ts=${Date.now()}`) // jshint ignore:line
                if ('ui' in node.original) {
                    document.getElementById('ui_frame').contentWindow.location.replace(node.original.ui)
                }
                break
            case 'm2ag-service-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/service.html?path=${node.data}&type=json&auth=${auth_hash}&ts=${Math.random()}`) // jshint ignore:line
                break
            default:
                break
        }
    }
}
//If user changes from a parent to a leaf and back too  fast fetch errors will occur.
const handleChangeTree = (data) => {
    if (data.node !== undefined && data.node.data !== null) {
        if(current_node !== data.node.data) {
            current_node = data.node.data
            fetch(`${api_url}/${data.node.data}`, getDataOptions)// jshint ignore:line
                .then(response => response.json())
                .then(result => {
                    setDetail(data.node, result)
                })
                .catch(error => console.log('error', error))
        }
    } else {
        setTabs('none')
        current_node = 'none'
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
            if (current_data.helpers.indexOf(current_data.available[i]) !== -1) {
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
            if (current_data.helpers.indexOf(current_data.enabled[i]) !== -1) {
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
    setTabs()
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
    device_tree_area.bind("move_node.jstree", function (e, data) { // jshint ignore:line
        handleMoveNode(data)
    });

}

window.addEventListener('resize', resizeAll);
window.onmessage = (event) => {
    switch(event.data){
        case 'resize':
            //TODO: this resizes everything every time for each iframe.
            resizeAll(true)
            break
        default:
            console.log(event.data)
            break
    }
}
