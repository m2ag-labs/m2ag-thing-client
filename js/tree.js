const device_tree_area = $('#device_tree_area');

function treeInit() {
    device_tree_area.on("changed.jstree", function (e, data) {
        if (data.node !== undefined && data.node.data !== null) {
            //if component_map or server go to parent node
            if (['component_map', 'server'].includes(data.node.data)) {
                device_tree_area.jstree('select_node', data.node.parent)
                device_tree_area.jstree('deselect_node', data.node.id)
            } else {
                if (deviceDetailApp.$data.selected !== data.node.data) {
                    deviceDetailApp.setModule(data.node.data)
                    //if comonent_map or server go to parent node
                }
            }
        } else {
            deviceDetailApp.setModule('')
        }
    });
    device_tree_area.jstree({
        "plugins": ['types']
    });
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
        "text": data.id,
        "state": {"opened": true},
        "type": "root",
        "children": []
    };

    root.children.push({
        "text": 'server',
        "type": "child",
        "data": `config/server`,
        "state": {"opened": true},
        "children": []
    });

    for (let i in data.server) { // jshint ignore:line
        if (data.server.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "text": `${i} : ${data.server[i]}`,
                "data": 'server'
            });
        }
    }

    root.children.push({
        "text": 'things',
        "type": "child",
        "state": {"opened": false},
        "children": []
    });

    for (let i in data.things) { // jshint ignore:line
        if (data.things.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "text": data.things[i],
                "data": `config/things/${data.things[i]}`
            });
        }
    }

    root.children.push({
        "text": 'components',
        "type": "child",
        "state": {"opened": false},
        "children": []
    });

    for (let i in data.components) {
        if (data.components.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "text": data.components[i],
                "data": `config/components/${data.components[i]}`
            });
        }
    }

    root.children.push({
        "text": 'component map',
        "type": "child",
        "data": "config/component_map",
        "state": {"opened": true},
        "children": []
    });

    for (let i in data.component_map) { // jshint ignore:line
        if (data.component_map.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "text": `${i} : ${data.component_map[i]}`,
                "data": 'component_map'
            });
        }
    }
    device_tree_area.jstree(true).settings.core.data = [root];
    device_tree_area.jstree(true).refresh();
}


