const device_tree_area = $('#device_tree_area');
let current_node = ''
const editor = ace.edit("ace_editor"); // jshint ignore:line
editor.setTheme("ace/theme/chrome")
editor.session.setMode("ace/mode/json")
editor.setOptions({
          fontSize: "12pt"
      });

function treeInit() {
    device_tree_area.on("changed.jstree", function (e, data) {
        current_node = ''
        editor.session.setValue('')
        document.getElementById('ui_frame').src = ''
        if (data.node !== undefined && data.node.data !== null) {
            fetch(`${api_url}/${data.node.data}`, getDataOptions)
                .then(response => response.json())
                .then(result => {
                    const t = JSON.stringify(result.data, null, 2)
                    current_node = t
                    setDetail(data.node,t)
                })
                .catch(error => console.log('error', error))
        }
    });
    device_tree_area.jstree({
        "types": {
            "default": {
                "icon": "../../css/images/type.svg"
            },
            "thing": {
                "icon": "../../css/images/speedometer2.svg"
            },
             "service": {
                "icon": "../../css/images/wrench.svg"
            }
        },
        "dnd": {
                check_while_dragging: true
        },
        "plugins": ["dnd", "types", "wholerow"],
        "core": {
            'check_callback': function(operation, node, node_parent, node_position, more) {
                    // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
                    // in case of 'rename_node' node_position is filled with the new node name

                    if (operation === "move_node") {
                        return node.type === "thing" && node_parent.original.type === "component"; //only allow dropping inside nodes of type 'Parent'
                    }
                    return false;  //allow all other operations
                }}
    });

    device_tree_area.bind("move_node.jstree", function (e, data) {
        // get the current enabled list, write to server, update tree from response
        // set current state and set tree back to the same.
        let update = {"enabled": []}
        for(let i of data.instance.get_json()[0].children){
            if(i.text === 'enabled'){
                for(let j of i.children){
                    update.enabled.push(j.text)
                }
                break
            }
        }

        putDataOptions.body = JSON.stringify(update)
        fetch(`${api_url}/config/enabled`, putDataOptions)
                .then(response => response.json())
                .then(result => {
                    create_device_tree(result)
                })
                .catch(error => console.log('error', error))
       });
}

function setDetail(node, t) {
    editor.session.setValue(t)
    editor.setReadOnly(true);
    if('index' in node.original){
                //set the thing url in ui
                   document.getElementById('ui_frame').src =
        `${window.location.origin}/ui/raspiui.html?index=${node.original.index}&socket=true&jwt=${jwt_token}`
            }
}

function disableTree() {
    // disable visible nodes
    $('#device_tree_area li.jstree-node').each(function () {
        $('#device_tree_area').jstree("disable_node", this.id)
    })
    // block open new nodes
    $('#device_tree_area i.jstree-ocl').off('click.block').on('click.block', function () {
        return false;
    });

}

function enableTree() {
    // enable again visible nodes
    $('#device_tree_area li.jstree-node').each(function () {
        $('#device_tree_area').jstree("enable_node", this.id)
    });
    // unblock open new nodes
    $('#device_tree_area i.jstree-ocl').off('click.block');
}

function create_device_tree(response) {
    let data = response.data
    let root = {
        "icon": "../../css/images/cpu.svg",
        "text": data.server.id,
        "data": `config/server`,
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
                "type": "thing",
                "text": data.available[i],
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
                "index": i,
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
                "data": `config/things/${data.services[i]}`
            });
        }
    }


    device_tree_area.jstree(true).settings.core.data = [root];
    device_tree_area.jstree(true).refresh();
}





