const jwtModal = (mode) => {
    const modal = new bootstrap.Modal(document.getElementById('jwt_modal'))
            fetch(`${api_url}/auth`, getOptions)
                .then(response => response.json())
                .then(result => {
                    document.getElementById('thing_url').innerText = thing_url
                    document.getElementById('jwt_token').innerText = result.data.token
                })
                .catch(error => console.log('error', error))
            modal.show()
 }








