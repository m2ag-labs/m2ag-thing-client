serviceList.component('service-element', {
    props: {
        context: {
            type: String,
            required: true
        },
    },
    template:
    /*html*/
        `
          <ul class="list-group text-left">
          <li class="list-group-item list-group-item-primary text-center">
            <h5>{{ context }}</h5>
          </li>
          <li id="run-list-element"
              class="list-group-item text-center"
              v-bind:class="{'list-group-item-success': this.isRunning,
                           'list-group-item-warning': !this.isRunning
                        }">
            <h6><span id="run_status">{{ statusMessage }}</span></h6>
          </li>
          <li class="list-group-item text-center">
            <button style="margin-right: 10px" class="btn"
                    :class="{'btn-outline-success': !this.isEnabled,
                           'btn-outline-danger': this.isEnabled,
                    }"
                    @click="changeState('isEnabled')">{{this.isEnabled ? "disable": "enable"}}
            </button>
            <button class="btn"
                    :class="{'btn-outline-success': !this.isRunning,
                           'btn-outline-danger': this.isRunning,
                    }"
                    @click="changeState('isRunning')">{{this.isRunning ? "stop": "start"}}
            </button>
          </li>
          </ul>`,
    data() {
        return {
            //context: 'm2ag-thing',
            status: '',
            isEnabled: false,
            isRunning: false,
            statusMessage: "is in an unknown state",
            polling: false
        }
    },
    methods: {
        getStatus() {
            fetch(`${api_url}/${this.context}/status`, getDataOptions)
                .then(response => response.json())
                .then(result => this.setUI(result.data))
                .catch(error => console.log('error', error))
        },
        setUI(data) {
            this.status = data;
            this.isRunning = data.split("\n")[2].trim().indexOf(`(running)`) > -1
            this.isEnabled = data.split("\n")[1].trim().indexOf(`service; enabled;`) > -1
            if (this.polling) {
                this.statusMessage = data.split("\n")[2].trim().substr((`Active:`).length);
                this.polling = false
            } else {
                this.statusMessage = data.split("\n")[2].trim().substr((`Active:`).length, data.split("\n")[2].trim().indexOf(`;`) - 1 - (`Active`).length);
            }
        },
        changeState(id) {
            let end_point = `${this.context}/`

            if (id === 'isEnabled') {
                if (this.isEnabled)
                    end_point += 'disable'
                else
                    end_point += 'enable'
            }
            if (id === 'isRunning') {
                if (this.isRunning)
                    end_point += 'stop'
                else
                    end_point += 'start'
            }
            this.status = ""
            fetch(`${api_url}/${end_point}`, getDataOptions)
                .then(response => response.json())
                .then(result => this.setUI(result.data))
                .catch(error => console.log('error', error))

        }
    },
    created() {
        this.getStatus()
        //setTimeout(this.getStatus, 1000)
    }

})
