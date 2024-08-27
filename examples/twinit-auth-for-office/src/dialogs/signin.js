(async () => {
   await Office.onReady();

   function getHashValue(key) {
      var matches = location.hash.match(new RegExp(key+'=([^&]*)'))
      return matches ? matches[1] : null
   }

   let token = getHashValue('access_token')

   // if the url contains a hash and an account_token we send the token back to the Welcome Component (the dialog's parent)
   if (token) {
      Office.context.ui.messageParent(token)
   } else {

      // else we redirect the user to signin on Twinit using the twinit url and application id passed to the signin.hml page
      let urlSearchParams = new URLSearchParams(window.location.search)
      window.location = `${urlSearchParams.get('env')}/passportsvc/api/v1/oauth/authorize/?client_id=${urlSearchParams.get('client_id')}&response_type=token&scope=read write&redirect_uri=https://localhost:3000/signin.html`
   }
 
 })();