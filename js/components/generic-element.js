(function () {

    const KEYCODE = {
        SPACE: 32,
        ENTER: 13,
    };
    //Anything up here is shared by all the elements created from this class
    class GenericElement extends HTMLElement {
        params;
        constructor(params) {
            super();
            this.params = params;
            this.attachShadow({mode: 'open'})
                .innerHTML = `
                <link  href="css/bootstrap.min.css" rel="stylesheet">
                
                `
        }

        static get observedAttributes() {
            return [];
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
        }

        attributeChangedCallback(name, oldValue, newValue) {
            const hasValue = newValue !== null;
            this.setAttribute(`aria-${name}`, hasValue.toString());
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

        _onChange(id) {
            let end_point = `m2ag-${this.params.context}/`
            if(id === 'enabled'){
                if(this.enabled)
                    end_point += 'disable'
                else
                    end_point += 'enable'
            }

            if(id === 'running'){
                if(this.running)
                    end_point += 'stop'
                else
                    end_point += 'start'
            }

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

    window.customElements.define('service-element', GenericElement);
})();