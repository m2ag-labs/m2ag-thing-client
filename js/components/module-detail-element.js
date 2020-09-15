(function () {

    const KEYCODE = {
        SPACE: 32,
        ENTER: 13,
    };

    //Anything up here is shared by all the elements created from this class
    class ModuleDetailElement extends HTMLElement {
        constructor(data) {
            super();
            this.ctx = data.ctx //this is the path for update
            this.data = data.data
            this.dirty = false
            this.attachShadow({mode: 'open'})
                .innerHTML = `
                <link  href="css/bootstrap.min.css" rel="stylesheet">
                 <table class="table" id="detail_table">
                    <thead id="detail_table_head">
                    </thead>
                    <tbody id="detail_table_body">
                    </tbody>
                </table>
                `
            this.dirty = false;


            let head = `<tr><th scope="col">`
            head += `<img id="accept" src="/images/72px-Dialog-accept.svg.png" style="width: 24px; height: auto; display: none" alt="">`;
            head += `<img id="cancel" src="/images/72px-Dialog-error-round.svg.png" style="width: 24px; height: auto; display: none; margin-left: 5%; margin-right: 5%" alt="">`
            head += `<img id="delete" src="/images/72px-User-trash-full.svg.png" style="width: 24px; height: auto; display: none; margin-right: 5%" alt="" >Component: ${this.ctx}</th></tr>`
            let row = `<tr><td><pre id='module_content'>${JSON.stringify(this.data, null, 1)}</pre></td></tr>`;
            this.shadowRoot.querySelector("#detail_table_head").innerHTML = head
            this.shadowRoot.querySelector("#detail_table_body").innerHTML = row

        }

        static get observedAttributes() {
            return ['isdirty'];
        }

        get isdirty() {
            return this.hasAttribute('isdirty');
        }

        set isdirty(value) {
            const isDirty = value !== false;
            if (isDirty) {
                this.setAttribute('isdirty', '');
            } else {
                this.removeAttribute('isdirty');
            }
        }


        connectedCallback() {
            //TODO: why am i upgrading this?
            this._upgradeProperty('isdirty');
            const that = this;
            //add listeners
            ['accept', 'cancel', 'delete'].forEach((action) => {
                let ele = that.shadowRoot.querySelector(`#${action}`)
                ele.ctx = that._onClick.bind(that)
                ele.addEventListener('click', that._callOnClick)
            })
            this.shadowRoot.querySelector('#module_content').ctx = this._onClick.bind(this)
            this.shadowRoot.querySelector('#module_content').addEventListener('click', this._callOnClick)

        }

        _upgradeProperty(prop) {
            if (this.hasOwnProperty(prop)) {
                let value = this[prop];
                delete this[prop];
                this[prop] = value;
            }
        }

        disconnectedCallback() {
            const that = this;
            ['delete', 'cancel', 'accept'].forEach((action) => {
                let ele = that.shadowRoot.querySelector(`#${action}`)
                delete ele.ctx
                ele.removeEventListener('click', that._callOnClick)
            })
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

        _callOnClick() {
            this.ctx(this.id)
        }

        _onClick(action) {
            switch (action) {
                case 'delete':

                    break
                case 'accept':
                    let put = this.shadowRoot.querySelector('#module_content').innerText.replace(/\n/g, '')
                    try {
                        JSON.parse(put)
                    } catch (e) {
                        alert('the data entered is not json')
                        return
                    }
                    this.shadowRoot.dispatchEvent(new CustomEvent('invalid', {
                        detail: {
                            id: action,
                            path: this.ctx,
                            data: put
                        },
                        bubbles: true,
                        composed: true
                    }));
                    break
                case 'module_content':
                    this.shadowRoot.querySelector('#module_content').contentEditable = true;
                    this.shadowRoot.querySelector('#module_content').focus()
                    //turn on update and cancel button
                    this.shadowRoot.querySelector('#accept').style.display = 'inline'
                    this.shadowRoot.querySelector('#cancel').style.display = 'inline'
                    this._setAttribute('isdirty', true);
                    break;
                default:
                    //this._setAttribute('isdirty', false);
                    this.shadowRoot.dispatchEvent(new CustomEvent('invalid', {
                        detail: {
                            id: 'cancel',
                            path: this.ctx,
                            data: this.data
                        },
                        bubbles: true,
                        composed: true
                    }));
                    break
            }
        }

        _setAttribute(id, value) {
            this[id] = value;
            this.dispatchEvent(new CustomEvent('isdirty', {
                detail: {
                    id: this[id],
                },
                bubbles: true,
                composed: true
            }));
        }


    }

    window.customElements.define('module-detail-element', ModuleDetailElement);
})();