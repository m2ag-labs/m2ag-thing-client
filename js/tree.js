const device_tree_area = $('#device_tree_area');
let current_selected_node;
function treeInit(){
    device_tree_area.on("changed.jstree", function (e, data) {
            //Prevent the tree from changing nodes if there are changes pending.
            let target = document.getElementsByTagName('component-map-element');
            if (target.length === 0) target = document.getElementsByTagName('module-detail-element')
            if (target.length !== 0 && target[0].hasAttribute('isdirty')) {
                alert("Please save or cancel pending changes before proceeding");
                return false;
            }
            if (data.node !== undefined) {
                //console.log(data.node.id + " : " + data.node.text);
                if (data.node.data !== null) {
                    //Don't change unless a new category
                    if(current_selected_node !== data.node.data) {
                        current_selected_node = data.node.data
                        setTable(data.node)
                    }
                } else {
                    current_selected_node = null;
                    clearTable();
                }
            }
        });
         device_tree_area.jstree({
            "plugins": ['types']
        });
}

function create_device_tree(response) {

    let data = response.data

    let root = {
        "text": data.id,
        "state": {"opened": true},
        "type": "root",
        "children": []
    };
    //Add modules to root
    root.children.push({
        "text": 'thing server : ' + data.thing_server,
        "type": "child",
        "data": `config/server`
    });

    root.children.push({
        "text": 'version : ' + data.ver,
        "type": "child",
        "data": `config/server`
    });

    root.children.push({
        "text": 'ui : ' + data.ui,
        "type": "child",
        "data": `config/server`
    });

    root.children.push({
        "text": 'things',
        "type": "child",
        //       "data": `/config/component_map`,
        "state": {"opened": false},
        "children": []
    });

    for (let i in data.things) { // jshint ignore:line
        if (data.things.hasOwnProperty(i)) {
            root.children[root.children.length - 1].children.push({
                "text": i,
                "data": `config/things/${i}`
            });
        }
    }

    root.children.push({
        "text": 'components',
        "type": "child",

        "state": {"opened": false},
        "children": []
    });

    for (let j in data.hardware) {
        if (data.hardware.hasOwnProperty(j)) {
            root.children[root.children.length - 1].children.push({
                "text": j,
                "data": `config/components/${j}`
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

    for (let k in data.component_map) { // jshint ignore:line
        if (data.component_map.hasOwnProperty(k)) {
            root.children[root.children.length - 1].children.push({
                "text": `${k} => ${data.component_map[k]}`,
                "data": 'config/component_map'
            });
        }
    }
    device_tree_area.jstree(true).settings.core.data = [root];
    device_tree_area.jstree(true).refresh();
}

function clearTable() {
    let ele = document.getElementsByTagName('component-map-element');
    if (ele.length > 0){
        ele[0].removeEventListener('invalid', updateModule)
        document.getElementById('detail_table_li').removeChild(ele[0])
    }
    ele = document.getElementsByTagName('module-detail-element');
    if (ele.length > 0){
        ele[0].removeEventListener('invalid', updateModule)
        document.getElementById('detail_table_li').removeChild(ele[0])
        delete ele[0]
    }
}

function setTable(node) {

    fetch(`${api_url}/${node.data}`, getDataOptions )
                .then(response => response.json())
                .then(result => buildTable(result, node.data))
                .catch(error => console.log('error', error))

}

function buildTable(response, path = '') {

    let data = response.data

    clearTable();

    if ('component_map' in data) {
        document.getElementById("detail_table_li").classList.remove('text-left')
        document.getElementById("detail_table_li").classList.add('text-center')
        const te = customElements.get('component-map-element')
        let ele = new te({'data': data, 'ctx': 'config/component_map'})
        ele.addEventListener('invalid', updateModule )
        document.getElementById("detail_table_li").append(ele)
    } else {
        document.getElementById("detail_table_li").classList.remove('text-center')
        document.getElementById("detail_table_li").classList.add('text-left')
        const te = customElements.get('module-detail-element')
        let ele = new te({'data': data, 'ctx': path})
        ele.addEventListener('invalid', updateModule )
        document.getElementById("detail_table_li").append(ele)
    }

}

function updateModule(evt) {

    switch (evt.detail.id) {
        case 'cancel':
            buildTable({'data': evt.target.data}, evt.detail.path)
            break
        case 'accept':
        case 'delete':
            putDataOptions['body'] = JSON.stringify(evt.detail.data)
            fetch(`${api_url}/${evt.detail.path}`, putDataOptions)
                .then(response => response.json())
                .then(result => buildTable(result, evt.detail.path))
                .catch(error => console.log('error', error))

            fetch(`${api_url}/config`, getDataOptions)
                .then(response => response.json())
                .then(result => create_device_tree(result))
                .catch(error => console.log('error', error))
            break

    }
}
