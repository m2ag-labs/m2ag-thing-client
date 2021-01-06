const serviceList = Vue.createApp({
    data() {
        return {
            services: [],
            polling: false
        }
    },
    methods: {
        getStatus() {
            fetch(`${api_url}/config/features`, getDataOptions)
                .then(response => response.json())
                .then(result => this.services = result.data)
                .catch(error => console.log('error', error))
        },
        pollServices() {
            this.services.forEach((value) => {
                this.$refs[value].polling = this.polling
                this.$refs[value].getStatus()
            })

            setTimeout(() => {
                if (this.polling) this.pollServices()
            }, 3000)

        }
    },
    created() {
        setTimeout(this.getStatus, 250)
    }
})




