const device_tree_area = $('#device_tree_area') // uses jquery
const all_pills = document.getElementsByClassName('all_pills')
const iframes = document.querySelectorAll("iframe");

const thing_tab = new bootstrap.Tab(document.querySelector('#thing-tab')); // jshint ignore:line
const service_tab = new bootstrap.Tab(document.querySelector('#service-tab')) // jshint ignore:line
const ui_tab = new bootstrap.Tab(document.querySelector('#ui-tab')) // jshint ignore:line

let service_list = {}
let tree_data = {}
let current_view = 'none'
let current_tab = 'none'
let current_node = 'none'

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

let webTimer

const webWorkerFunction = () => {
    let calls = []
    for (let i in service_list) {
        calls.push(fetch(`${api_url}/status/${i}`, getOptions)
            .then(response => response.json()))
    }
    Promise.all(calls).then(results => {
        let changed = false
        for(let i in results) {
            for (let j in results[i].data) {
                if (service_list[j] !== results[i].data[j]) {
                    service_list[j] = results[i].data[j]
                    changed = true
                }
            }
        }
       if(changed){
           create_device_tree()
       }
    }).catch(error => {
        console.log(error)
        //alert(error)
    })/**/

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
    putOptions.body = JSON.stringify(update) // jshint ignore:line
    fetch(`${api_url}/config/enabled`, putOptions)// jshint ignore:line
        .then(response => response.json())
        .then(result => {
            current_node = 'none'
            tree_data = result
            create_device_tree()
        })
        .catch(error => console.log('error', error))
    if(service_list['m2ag-thing']){ //stop the thing on enabled list updates
        fetch(`${api_url}/m2ag-thing/stop`, getOptions)// jshint ignore:line
        .catch(error => console.log('error', error))
    }

}

const resizeAll = () => {
    for (let i = 0; i < iframes.length; i++) {
        iframes[i].style.height = `${window.innerHeight - 150}px`
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
                    `ui/editor.html?path=${node.data}&type=json&auth=${config.hash}&ts=${Date.now()}`) // jshint ignore:line

                if ('ui' in node.original) {
                    document.getElementsByClassName('ui_pill').item(0).style.display = 'block'
                    document.getElementById('ui_frame').contentWindow.location.replace(`ui/raspiui.html?index=${node.original.ui}&socket=true&jwt=${config.token}`) // jshint ignore:line
                } else if (current_tab === 'ui-tab') {
                    thing_tab.show()
                }
                if ('helper' in node.original && node.original.helper !== false) {
                    document.getElementsByClassName('helper_pill').item(0).style.display = 'block'
                    document.getElementById('helper_frame').contentWindow.location.replace(`ui/editor.html?path=${node.original.helper}&type=python&auth=${config.hash}&ts=${Date.now()}`) // jshint ignore:line
                } else if (current_tab === 'helper-tab') {
                    thing_tab.show()
                }
                break
            case 'm2ag-server-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/editor.html?path=${node.data}&type=json&auth=${config.hash}&ts=${Date.now()}`) // jshint ignore:line
                if ('ui' in node.original) {
                    document.getElementById('ui_frame').contentWindow.location.replace(node.original.ui)
                }
                break
            case 'm2ag-service-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/service.html?path=${node.data}&type=json&auth=${config.hash}&ts=${Math.random()}`) // jshint ignore:line
                break
            case 'm2ag-user-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/user.html?path=${node.data}&type=json&auth=${config.hash}&ts=${Date.now()}`) // jshint ignore:line
                break
            case 'm2ag-thinggetter-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/thinggetter.html?auth=${config.hash}&ts=${Date.now()}`) // jshint ignore:line
                break
            case 'm2ag-thingapi-tag':
                document.getElementById('service_frame').contentWindow.location.replace(`ui/thingapi.html?auth=${config.token}&ts=${Date.now()}`) // jshint ignore:line
                break
            default:
                break
        }
    }
}


const handleChangeTree = (data) => {
    if (data.node !== undefined && data.node.data !== null) {
        if (current_node !== data.node.data) {
            current_node = data.node.data
            setDetail(data.node)
        }
    } else {
        //Prevent reloads of iframe content on tree update
        if(data.action !== 'deselect_all') {
            setTabs('none')
            current_node = 'none'
        }
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

const create_device_tree = () => {// jshint ignore:line
    const response = tree_data
    let root = {
        "icon": "../../css/images/cpu.svg",
        "text": response.data.server.id,
        "data": `config/server`,
        "index": 'm2ag-server-tag',
        "state": {"opened": true},
        "type": "root",
        "children": []
    };

    root.children.push({
        "icon": "../../css/images/node-minus.svg",
        "text": "available",
        "data": "thinggetter",
        "index": "m2ag-thinggetter-tag",
        "type": "component",
        "state": {"opened": false},
        "children": []
    });

    for (let i in response.data.available) { // jshint ignore:line
        if (response.data.available.hasOwnProperty(i) && response.data.enabled.indexOf(response.data.available[i]) < 0) {
            let helper = false
            if (response.data.helpers.indexOf(response.data.available[i]) !== -1) {
                helper = `config/helpers/${response.data.available[i]}`
            }
            root.children[root.children.length - 1].children.push({
                "icon": "../../css/images/file-text.svg",
                "type": "thing",
                "text": response.data.available[i],
                "index": "m2ag-thing-tag",
                "data": `config/things/${response.data.available[i]}`,
                "helper": helper
            });
        }
    }


    root.children.push({
        "icon": "../../css/images/node-plus.svg",
        "text": "enabled",
        "data": "thingurl",
        "index": "m2ag-thingapi-tag",
        "type": "component",
        "state": {"opened": true},
        "children": []
    });

    for (let i in response.data.enabled) { // jshint ignore:line
        if (response.data.enabled.hasOwnProperty(i)) {
            let helper = false
            if (response.data.helpers.indexOf(response.data.enabled[i]) !== -1) {
                helper = `config/helpers/${response.data.enabled[i]}`
            }
            root.children[root.children.length - 1].children.push({
                "type": "thing",
                "text": response.data.enabled[i],
                "index": "m2ag-thing-tag",
                "ui": i,
                "data": `config/things/${response.data.enabled[i]}`,
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
    //If service list is not populated, do so now
    for (let i in response.data.services) { // jshint ignore:line
        if (response.data.services.hasOwnProperty(i)) {
            const target = response.data.services[i]
            let ic
            if (service_list[target]) {
                ic = '../../css/images/led-green.png'
            } else {
                ic = '../../css/images/led-red.png'
            }
            root.children[root.children.length - 1].children.push({
                "icon": ic,
                "type": "service",
                "text": response.data.services[i],
                "data": `${response.data.services[i]}/status`,
                "index": "m2ag-service-tag"
            });
        }
    }

    root.children.push({
        "icon": "../../css/images/people.svg",
        "text": "users",
        "type": "users",
        "state": {"opened": false},
        "children": []
    });

    for (let i in response.data.users) { // jshint ignore:line
        if (response.data.available.hasOwnProperty(i) && response.data.enabled.indexOf(response.data.users[i]) < 0) {
            root.children[root.children.length - 1].children.push({
                "icon": "../../css/images/person.svg",
                "type": "user",
                "text": response.data.users[i],
                "index": "m2ag-user-tag",
                "data": `config/user/${response.data.users[i]}`
            });
        }
    }
    device_tree_area.jstree(true).settings.core.data = [root];
    device_tree_area.jstree(false).refresh();
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
    fetch(`${api_url}/config`, getOptions)
                .then(response => response.json())
                .then(result => {
                    tree_data = result
                    for(let i in tree_data.data.services){
                        service_list[tree_data.data.services[i]] = false
                    }
                    webWorkerFunction()
                    create_device_tree()
                })// jshint ignore:line
                .catch(error =>{
                    configManager('clear-login')
                    //alert(error)
                })

    //TODO: move to webworker
    webTimer = setInterval(webWorkerFunction, 3000)

}

window.onbeforeunload = (event) => {
    clearInterval(webTimer)
}

window.addEventListener('resize', resizeAll);
window.onmessage = (event) => {
    switch (event.data) {
        case 'resize':
            //TODO: this resizes everything every time for each iframe.
            resizeAll()
            break
        case 'reload-tree':
            fetch(`${api_url}/config`, getOptions)// jshint ignore:line
                .then(response => response.json())
                .then(result => {
                    tree_data = result
                    create_device_tree()
                })
                .catch(error => alert(error))
            break
        default:
            console.log(event.data)
            break
    }
}

