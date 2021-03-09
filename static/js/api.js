const thing_url = `${window.location.protocol}//${window.location.hostname}:8888`
const api_url = `${window.location.protocol}//${window.location.hostname}:5000`
const git_url = `https://raw.githubusercontent.com/m2ag-labs/m2ag-things/master`

const dataHeaders = new Headers();
dataHeaders.append("Content-Type", "application/json")
//dataHeaders.append("Authorization", 'Basic ' + auth_hash) -- set in init in main and managelocalstrorage
const   getDataOptions = {
    method: 'GET',
    headers: dataHeaders,
    redirect: 'follow'
};
/**
 * use for post and delete too. Be sure to set method back to PUT if changed
 * @type {{redirect: string, headers: Headers, method: string, body: string}}
 */
const putDataOptions = {
    method: 'PUT',
    headers: dataHeaders,
    body: '',
    redirect: 'follow'
}


const thingHeaders = new Headers();
thingHeaders.append("Content-Type", "application/json");
const getThingOptions = {
    method: 'GET',
    headers: thingHeaders,
    redirect: 'follow',
    credentials: 'omit'
};
/**
 * use for post too
 * @type {{redirect: string, headers: Headers, method: string, body: string}}
 */
const putThingOptions = {
    method: 'PUT',
    headers: thingHeaders,
    body: '',
    redirect: 'follow'
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

