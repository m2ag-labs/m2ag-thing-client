const thing_url = `${window.location.protocol}//${window.location.hostname}:8888`
const api_url = `${window.location.protocol}//${window.location.hostname}:5000`
const git_url = `https://raw.githubusercontent.com/m2ag-labs/m2ag-iot-things/master`

/**
 * Using fetch in the code for now. Control auth and settings here. Basic auth
 * @param method
 * @param body
 * @returns {{mode: string, redirect: string, headers: {Authorization: string, "Content-Type": string}, cache: string, method: string, referrerPolicy: string, credentials: string}}
 */
function fetchDataOptions(method = 'GET', body = null) {
    let init = {
        method: method,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + auth_hash
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
    }
    if (body !== null)
        init['body'] = body

    return init
}

/**
 * Same as getDataOptions except security will be jwt (by beta)
 * @param method
 * @param body
 * @returns {{mode: string, redirect: string, headers: {"Content-Type": string}, cache: string, method: string, referrerPolicy: string, credentials: string}}
 */
function fetchThingOptions(method = 'GET', body = null) {

    let init = {
        method: method,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            //'Authorization': 'Basic ' + auth_hash,
            //'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    }
    if (body !== null)
        init['body'] = body

    return init
}

/***
 *
 * @param url pass in full path --
 * @param method
 * @param body
 * @returns {Promise<any>}
 */
async function restData(url = '', method = 'GET', body = null) {
    const request = new Request(url , {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors',
        cache: 'default',
    });
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}


/**
 * Can't get fetch to get the module files from git hub due to cors issues -- xhr works.
 * It's pretty fast too. Wrapped in a promise
 * @param path  to a thing, component or other resource on git hub
 * @param type  json or text
 * @returns {Promise<>}
 */
function getModules(path = '', type = 'json') {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        let timeout
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                clearTimeout(timeout)
                if (this.responseText.includes("404: Not Found")) {
                    reject('file not found')
                } else {
                    if (type === 'json') {
                        //TODO: make this a try
                        try {
                            resolve(JSON.parse(this.responseText))
                        } catch (e) {
                            reject("unable to parse json", path)
                        }
                    } else {
                        resolve(this.responseText)
                    }
                }
            }
        });
        const now = Date.now() //make sure we get fresh components
        xhr.open("GET", `${git_url}/${path}?_=${now}`);
        xhr.send();
        timeout = setTimeout(() => {
                reject('request timeout')
            }, 3000
        )
    });
}

