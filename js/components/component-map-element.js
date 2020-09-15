(function () {

    const KEYCODE = {
        SPACE: 32,
        ENTER: 13,
    };

    //Anything up here is shared by all the elements created from this class
    class ComponentMapElement extends HTMLElement {
        constructor(data) {
            super();
            this.data = data.data
            this.ctx = data.ctx
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
            let row = ''
            this.shadowRoot.querySelector("#detail_table_head").innerHTML = `<tr><th scope="col">Thing</th><th scope="col">Component</th><th scope="col"><img id="add_button"src="/images/1024px-Ambox_emblem_plus.svg.png" style="width: 24px; height: auto " alt=""></th></tr>`;
            for (const thing in this.data['component_map']) {
                if (this.data['component_map'].hasOwnProperty(thing)) {
                    row += `<tr><td>${this.createOptionField(thing, 'thing', this.data['things'], thing)}</td>`
                    row += `<td>${this.createOptionField(this.data.component_map[thing], 'component', this.data['components'], thing)}</td>`
                    row += `<td><img class="accept ${thing}_control" name=${thing} src="/images/72px-Dialog-accept.svg.png" style="width: 24px; height: auto; display: none " alt="">`
                    row += `<img class="cancel ${thing}_control" name=${thing} src="/images/72px-Dialog-error-round.svg.png" style="width: 24px; height: auto; display: none " alt="">`
                    row += `<td><img class="delete ${thing}_control" name=${thing} src="/images/72px-User-trash-full.svg.png" style="width: 24px; height: auto " alt="" ></td></tr>`
                }
            }
            this.shadowRoot.querySelector("#detail_table_body").innerHTML = row

            let optf = this.shadowRoot.querySelectorAll('select')
            for (let i = 0; i < optf.length; i++) {
                optf[i].ctx = this.componentMapChanged.bind(this)
                optf[i].onchange = this.callComponentMapChanged
            }


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
            ['accept', 'cancel', 'delete'].forEach((action) => {
                const control = that.shadowRoot.querySelectorAll(`.${action}`)
                for (let i = 0; i < control.length; i++) {
                    control[i].ctx = that._onClick.bind(that)
                    switch (action) {
                        case 'accept':
                            control[i].addEventListener('click', that._onAccept);
                            break;
                        case 'cancel':
                            control[i].addEventListener('click', that._onCancel);
                            break;
                        case 'delete':
                            control[i].addEventListener('click', that._onDelete);
                            break;
                    }

                }
            })
            this.shadowRoot.querySelector('#add_button').addEventListener('click', this.addComponentMap.bind(this))
        }

        _upgradeProperty(prop) {
            if (this.hasOwnProperty(prop)) {
                let value = this[prop];
                delete this[prop];
                this[prop] = value;
            }
        }

        disconnectedCallback() {
            let optf = this.shadowRoot.querySelectorAll('select')
            for (let i = 0; i < optf.length; i++) {
                delete optf[i].ctx
                optf[i].removeEventListener('change', this.callComponentMapChanged)
            }
            this.shadowRoot.querySelector('#add_button').removeEventListener('click', this.addComponentMap)
            const that = this;
            ['accept', 'cancel', 'delete'].forEach((action) => {
                const control = that.shadowRoot.querySelectorAll(`.${action}`)
                for (let i = 0; i < control.length; i++) {
                    delete control[i].ctx
                    switch (action) {
                        case 'accept':
                            control[i].removeEventListener('click', that._onAccept);
                            break;
                        case 'cancel':
                            control[i].removeEventListener('click', that._onCancel);
                            break;
                        case 'delete':
                            control[i].removeEventListener('click', that._onDelete);
                            break;
                    }

                }
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

        _onAccept() {
            this.ctx('accept', this.name);
        }

        _onCancel() {
            this.ctx('cancel', this.name);
        }

        _onDelete() {
            this.ctx('delete', this.name);
        }

        _onClick(action, name) {
            switch (action) {
                case 'delete':
                    this.deleteComponentMap(name)
                    break
                case 'accept':
                    this.saveComponentMap(name)
                    break
                default:
                    this.deleteComponentMap('cancel')
                    break
            }
        }

        _setAttribute(id, value) {
            this[id] = value;
            this.shadowRoot.dispatchEvent(new CustomEvent('isdirty', {
                detail: {
                    id: this[id],
                },
                bubbles: true,
                composed: true
            }));
        }

        createOptionField(value, field, options, onchange) {
            let more_options = "";
            let installed = [];
            if (field === 'thing') {
                installed = Object.keys(this.data.component_map);
            } else {
                installed = Object.values(this.data.component_map);
            }

            for (let i = 0; i < options.length; i++) {
                if (!installed.includes(options[i])) {
                    more_options += `<option value="${options[i]}">${options[i]}</option>`
                }
            }
            //Field -- is component or thing
            //onchange is the thing this thing is associated with -- so is <thing>_<thing>
            return `<div class="input-group mb-3 form-inline">
              <select class="custom-select" name="${onchange}" id="${onchange}_${field}">
                <option selected>${value}</option>
                ${more_options}
              </select>
           </div>`
        }

        addComponentMap() {
            //Add an empty row to the current with check mark and trash can
            if (this.dirty === false) {
                //console.log('add');
                this.dirty = 'new'
                this._setAttribute('isdirty', true)
                //Disable all the fields (so only the current field needs to be tracked)
                const classes = this.shadowRoot.querySelectorAll('select');
                for (let i = 0; i < classes.length; i++) {
                    classes[i].disabled = true;
                }
                let rows = this.shadowRoot.querySelector("#detail_table_body").innerHTML;
                let row = "";
                row += `<tr><td>${this.createOptionField('new', 'thing', this.data.things, 'new')}</td>`;
                row += `<td>${this.createOptionField('new', 'component', this.data.components, 'new')}</td>`;
                row += `<td><img id="new-save" src="/images/72px-Dialog-accept.svg.png" style="width: 24px; height: auto " alt="">`;
                row += `<img id="new-cancel" src="/images/72px-Dialog-error-round.svg.png" style="width: 24px; height: auto " alt=""></td></tr>`
                //todo -- try append:
                this.shadowRoot.querySelector('#detail_table_body').innerHTML = rows + row;
                this.shadowRoot.querySelector('#new-save').addEventListener('click', this.newSaveComponentMap.bind(this))
                this.shadowRoot.querySelector('#new-cancel').addEventListener('click', this.cancelComponentMap.bind(this))

            } else {
                alert("Please save or cancel pending changes before proceeding");
                return false;
            }
        }

        callComponentMapChanged() {
            this.ctx(this.name)
        }

        componentMapChanged(thing) {
            if (this.dirty === false) {
                this.dirty = thing;
                this._setAttribute('isdirty', true)
                //Display the images for this rows controls
                let classes = this.shadowRoot.querySelectorAll(`.${thing}_control`);
                for (let i = 0; i < classes.length; i++) {
                    classes[i].style.display = "inline";
                }
                //Disable all the fields (so only the current field needs to be tracked)
                classes = this.shadowRoot.querySelectorAll('select');
                for (let i = 0; i < classes.length; i++) {
                    classes[i].disabled = true;
                }
                //Re-enable the current fields
                classes = this.shadowRoot.querySelectorAll(`select[name='${thing}']`)
                for (let i = 0; i < classes.length; i++) {
                    classes[i].disabled = false;
                }
            }
            if (this.dirty !== thing) {
                alert("Please save or cancel pending changes before proceeding");
                return false;
            }
        }

        cancelComponentMap() {
            this.deleteComponentMap('cancel')
        }

        deleteComponentMap(thing) {
            this._setAttribute('isdirty', false)
            this.dirty = false
            if (thing !== 'cancel') {
                delete this.data.component_map[thing];
                this.shadowRoot.dispatchEvent(new CustomEvent('invalid', {
                detail: {
                    id: 'delete',
                    path: 'config/component_map',
                    data: this.data.component_map
                },
                bubbles: true,
                composed: true
            }));
            } else {
                this.shadowRoot.dispatchEvent(new CustomEvent('invalid', {
                    detail: {
                        id: 'cancel',
                        path: 'config/component_map',
                        data: this.data
                    },
                    bubbles: true,
                    composed: true
                }));
            }
        }

        newSaveComponentMap() {
            this.saveComponentMap('new')
        }

        saveComponentMap(thing) {
            //On every save go back to server and reset table.
            const tng = this.shadowRoot.querySelector(`#${thing}_thing`).value;
            const cmp = this.shadowRoot.querySelector(`#${thing}_component`).value;
            if (tng === 'new' || cmp === 'new') {
                alert("Please select a thing and a component or cancel");
                return false;
            }
            if (tng !== thing) {
                //The thing changed
                delete this.data.component_map[thing];
            }
            this.data.component_map[tng] = cmp;
            this.shadowRoot.dispatchEvent(new CustomEvent('invalid', {
                detail: {
                    id: 'accept',
                    path: 'config/component_map',
                    data: this.data.component_map
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    window.customElements.define('component-map-element', ComponentMapElement);
})();