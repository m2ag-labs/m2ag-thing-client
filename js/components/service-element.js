(function () {

    const KEYCODE = {
        SPACE: 32,
        ENTER: 13,
    };

    //Anything up here is shared by all the elements created from this class
    class ServiceElement extends HTMLElement {
        constructor(params) {
            super();
            this.params = params;
            this.polled = false;
            this.attachShadow({mode: 'open'})
                .innerHTML = `
                <link  href="css/bootstrap.min.css" rel="stylesheet">
                <ul class="list-group text-left">
                    <li class="list-group-item list-group-item-primary text-center">
                        <h5>${this.params.context}</h5>
                    </li>
                    <li class="list-group-item list-group-item-warning text-center" id="run-list-element">
                        <h6><span id="run_status">in an unknown state</span></h6>
                    </li>
                    <li class="list-group-item  text-center">
                        <table style="width:100%">
                            <tr>
                                <td>
                                    <div class="custom-control custom-switch">
                                        <input autocomplete="enable-switch" class="custom-control-input"
                                               id="enabled" type="checkbox">
                                        <label class="custom-control-label" for="enabled">enable</label>
                                    </div>
                                </td>
                                <td>
                                    <div class="custom-control custom-switch">
                                        <input autocomplete="run-switch" class="custom-control-input"
                                               id="running" type="checkbox">
                                        <label class="custom-control-label" for="running"> run </label>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </li>
                </ul>`
        }

        static get observedAttributes() {
            return ['enabled', 'running', 'polling'];
        }

        get running() {
            return this.hasAttribute('running');
        }

        set running(value) {
            const isRunning = Boolean(value);
            this.shadowRoot.querySelector('#running').checked = isRunning;
            if (isRunning) {
                this.setAttribute('running', '');
            } else {
                this.removeAttribute('running');
            }
        }

        get enabled() {
            return this.hasAttribute('enabled');
        }

        set enabled(value) {
            const isEnabled = Boolean(value);
            this.shadowRoot.querySelector('#enabled').checked = isEnabled;
            if (isEnabled) {
                this.setAttribute('enabled', '');
            } else {
                this.removeAttribute('enabled');
            }
        }

        get polling() {
            return this.hasAttribute('polling');
        }

        set polling(value) {
            const isPolling = Boolean(value);
            if (isPolling) {
                this.setAttribute('polling', '');
            } else {
                this.removeAttribute('polling');
            }
        }

        set status(data) {
            //TODO: error check this.
            let value = data.data;
            if (value !== "") {
                let isRunning = value.split("\n")[2].trim().indexOf(`inactive`) === -1
                let isEnabled = value.split("\n")[1].trim().indexOf(`service; disabled;`) === -1

                if (isRunning !== this.running) this.running = isRunning;
                if (isEnabled !== this.enabled) this.enabled = isEnabled;

                if (this.polled) {
                    this.shadowRoot.querySelector(`#run_status`).innerText = value.split("\n")[2].trim().substr((`Active:`).length);
                } else {
                    this.shadowRoot.querySelector(`#run_status`).innerText = value.split("\n")[2].trim().substr((`Active:`).length, value.split("\n")[2].trim().indexOf(`;`) - 1 - (`Active`).length);
                }
                if (isRunning) {
                    this.shadowRoot.querySelector(`#run-list-element`).classList.remove(`list-group-item-warning`);
                    this.shadowRoot.querySelector(`#run-list-element`).classList.add(`list-group-item-success`);
                } else {
                    this.shadowRoot.querySelector(`#run-list-element`).classList.add(`list-group-item-warning`);
                    this.shadowRoot.querySelector(`#run-list-element`).classList.remove(`list-group-item-success`);
                }
            }
        }

        poll(value = false) {
            if (this.polled !== value) {
                this.polled = value
                this._toggleAttribute('polling')
            }
            fetch(`${api_url}/${this.params.context}/status`, getDataOptions)
                .then(response => response.json())
                .then(result => this.status = result)
                .catch(error => console.log('error', error))

        }

        connectedCallback() {
            //TODO: why am i upgrading this?
            this._upgradeProperty('polling');
            this._upgradeProperty('enabled');
            this._upgradeProperty('running');

            this.shadowRoot.querySelector('#enabled').addEventListener('change', this._onEnableChange.bind(this));
            this.shadowRoot.querySelector('#enabled').addEventListener('keydown', this._onEnableKeyDown.bind(this));

            this.shadowRoot.querySelector('#running').addEventListener('change', this._onRunningChange.bind(this));
            this.shadowRoot.querySelector('#running').addEventListener('keydown', this._onRunningKeyDown.bind(this));

            this.poll()
        }

        _upgradeProperty(prop) {
            if (this.hasOwnProperty(prop)) {
                let value = this[prop];
                delete this[prop];
                this[prop] = value;
            }
        }

        disconnectedCallback() {
            this.shadowRoot.querySelector('#enabled').removeEventListener('change', this._onEnableChange);
            this.shadowRoot.querySelector('#enabled').removeEventListener('keydown', this._onEnableKeyDown);
            this.shadowRoot.querySelector('#running').removeEventListener('change', this._onRunningChange);
            this.shadowRoot.querySelector('#running').removeEventListener('keydown', this._onRunningKeyDown);
        }

        attributeChangedCallback(name, oldValue, newValue) {
            const hasValue = newValue !== null;
            this.setAttribute(`aria-${name}`, hasValue.toString());
        }

        _onEnableKeyDown(event) {
            this._onKeyDown(event, 'enabled');
        }

        _onRunningKeyDown(event) {
            this._onKeyDown(event, 'running');
        }

        _onKeyDown(event, id) {

            if (event.altKey)
                return;

            switch (event.keyCode) {
                case KEYCODE.SPACE:
                case KEYCODE.ENTER:
                    event.preventDefault();
                    this._onChange(id);
                    break;
                default:
                    return;
            }
        }

        _onEnableChange() {
            this._onChange('enabled');
        }

        _onRunningChange() {
            this._onChange('running');
        }

        _onChange(id) {
            let end_point = `${this.params.context}/`
            if (id === 'enabled') {
                if (this.enabled)
                    end_point += 'disable'
                else
                    end_point += 'enable'
            }

            if (id === 'running') {
                if (this.running)
                    end_point += 'stop'
                else
                    end_point += 'start'
            }

            fetch(`${api_url}/${end_point}`, getDataOptions)
                .then(response => response.json())
                .then(result => this.status = result)
                .catch(error => console.log('error', error))

            this._toggleAttribute(id)
        }

        _toggleAttribute(id) {
            this[id] = !this[id];
            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    id: this[id],
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    window.customElements.define('service-element', ServiceElement);
})();