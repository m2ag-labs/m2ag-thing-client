const deviceDetail = Vue.createApp({
    data() {
        return {
            selected: '',
            title: 'Detail',
            current_module: '',
            isDirty: false
        }
    },
    methods: {
        setModule(module) {
            this.selected = module
            this.current_module = ''
            if (module !== '') {
                fetch(`${api_url}/${module}`, getDataOptions)
                    .then(response => response.json())
                    .then(result => {
                        if (this.selected === 'config/component_map') {
                            this.current_module = result.data
                        } else {
                            this.current_module = JSON.stringify(result.data, null, 2)
                        }
                    })
                    .catch(error => console.log('error', error))
            }
        },
        cancelModuleAction() {
            this.isDirty = false
            this.current_module = ''
            this.setModule(this.selected)
        },
        saveModule() {
            try {
                if (this.selected === "config/component_map") {
                    putDataOptions['body'] = JSON.stringify(this.current_module.component_map)
                } else {
                    putDataOptions['body'] = JSON.stringify(JSON.parse(document.getElementById('current_module_edit').innerText))
                }
            } catch (e) {
                alert('Content is not valid json')
                return
            }
            this.current_module = ''
            this.isDirty = false
            fetch(`${api_url}/${this.selected}`, putDataOptions)
                .then(response => response.json())
                .then(result => {
                    this.current_module = JSON.stringify(result.data, null, 2)
                    if (['config/component_map', 'config/server'].includes(this.selected)) {
                        fetch(`${api_url}/config`, getDataOptions)
                            .then(response => response.json())
                            .then(result => create_device_tree(result))
                            .catch(error => console.log('error', error))
                    }
                })
                .catch(error => console.log('error', error))
        },
        addModule() {
            this.isDirty = true
            const classes = document.querySelectorAll('select');
            for (let i = 0; i < classes.length; i++) {
                classes[i].disabled = true;
            }
            this.current_module.component_map.thing = 'component'
        },
        deleteModule(member) {
            delete this.current_module.component_map[member]
            this.saveModule()
        },
        optionChange(id) {
            const current = document.getElementById(`${id}`)
            const component = document.getElementById(`${id}_component`)
            if (id !== current.value) {
                delete this.current_module.component_map[id]
            }
            this.current_module.component_map[current.value] = component.value

            if (!this.isDirty) {
                this.isDirty = true
                const classes = document.querySelectorAll('select');
                for (let i = 0; i < classes.length; i++) {
                    classes[i].disabled = true;
                }
                current.disabled = false
                component.disabled = false
            }
        },
        thingOptions(thing = ''){
            let things = this.current_module.things.filter(x =>
                !Object.keys(this.current_module.component_map).includes(x) || x === thing
            )
            if(thing === 'thing') things.push('thing')
            return things
        }

    },
    watch: {
        isDirty: function (val) {
            if (val) {
                disableTree()
            } else {
                enableTree()
            }
        }
    }
})



