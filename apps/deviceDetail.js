const deviceDetail = Vue.createApp({
    data() {
        return {
            things: [],
            components: [],
            component_map: [],
            isDirty: false
        }
    },
    methods: {
        getConfig() {
            fetch(`${api_url}/config`, getDataOptions)
                .then(response => response.json())
                .then(result => this.services = result.data)
                .catch(error => console.log('error', error))
        }
    },
    created() {
        //setTimeout(this.getStatus, 1000)
    }
})




