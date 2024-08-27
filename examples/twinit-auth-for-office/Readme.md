# Twinit Authentication for Office Example using Excel

Twinit Auth for Office contains an example Twinit authentication workflow for building Office add-ins that integrate with Twinit. This example is created for an Excel add-in using React, but the authentication flow will be the same for any Office add-in.

This example and any and all code, are provided as-is and without warranty or support, for educational purposes. You are free to use the code in your own projects.

## Prerequisites

Before starting to use the Twinit Authentication for Office add-in you need to either have access to or be knowledgeable in the following:

* Have your Twinit application id (either for Twinit Sandbox or Twinit Production, though the example will assume Twinit Sandbox in most cases)
* Have Application Owner access to your application or are able to have an application owner make updates to your applications redirect URIs
* Have a user account on the same Twinit environment as your application
* Have setup your environment variables [as described here](https://twinit.dev/docs/apis/javascript/npm-install) so that you can use the included .npmrc file to install the Twinit @dtplatform API libraries

## Building Office Add-Ins

For more details on building add-ins for Office applications see [Microsoft's developer documentation](https://learn.microsoft.com/en-us/office/dev/add-ins/overview/learning-path-beginner).

To start a new Excel add-in from scratch follow the documentation [here](https://learn.microsoft.com/en-us/office/dev/add-ins/excel/excel-add-ins-overview).

## Sideloading the Twinit Auth Example Add-In

The following steps will run the add-in in the desktop version of Excel. To run the sideload the add-in for Excel in the browser follow the steps [here](https://learn.microsoft.com/en-us/office/dev/add-ins/quickstarts/excel-quickstart-jquery?tabs=yeomangenerator#try-it-out)

In order to run the Twinit Auth Example add-in you will need to make two configuration changes. The first will be update your Twinit application configuration to add an allowed redirect to the Twinit Auth Example Signin page after the user has signed in to Twinit. The second will be to update the add-in code to include your application id. The steps to update both configurations are below.

### Update Your Twinit Application Config

You will need to have application owner access to follow these steps or to have an application owner follow them for you. These updates to your application's redirect URIs will allow Twinit to redirect a signed in user back to the Excel add-in.

1. Sign in to the Twinit Console Application
   * [Twinit Sandbox Console](https://sandbox.invicara.com/console)
   * [Twinit Production Console](https://apps.invicara.com/console)
2. Select your application from the dropdown list
3. Select the 'Application Details' page from the navigation bar on the left
4. In the Settings > Redirect URIs section add a new entry for ```https://localhost:3000/signin.html```
5. Click the Save Settings button

### Update the Twinit Auth Example Config

These changes will add your application to the add-in allowing users to select it to sign in to.

1. Clone this code locally
2. Rename ```src/taskpane/TwinitConfig_template.js``` to ```src/taskpane/TwinitConfig.js```
3. Open ```TwinitConfig.js``` and replace the item in the applications array with your application name and application id
4. Save the file

### Run the Twinit Auth Example Locally

> __@dtplatform libraries__  
If you have not already, be sure that you have [created the DTPLATFORM environment variables as described here](https://twinit.dev/docs/apis/javascript/npm-install) so that the .npmrc file included in this project will be able to install the correct @dtplatform libraries in order for the add-in to communicate with Twinit.

1. run ```npm install```
2. run ```npm start```

## Signing In with the Add-In

When the Twinit Auth for Office add-in loads, select the environment for your application, and then select your application. Click Signin.

![Welcome Screen](./docs/img/Welcome.jpg)

A new dialog will open allowing you to sign in to Twinit.

![Twinit Signin Dialog](./docs/img/twinitsignin.jpg)

Signin as you usually would to Twinit.

Once signin is complete, the dialog will disappear and you will see the add-in user interface updates to display your user's first name in the header.

![Add-in UI](./docs/img/loggedin.jpg)

## How the Authentication Code Works

The Twinit Auth for Office example uses [OAuth2 Implicit Grant](https://twinit.dev/docs/apis/rest/authentication/implicit) to retrieve an access token from Twinit. The example can be easily modified, however, to use any of Twinit's other supported authentication flows.

### Authentication Code Flow

1. Excel loads the task pane, and after the task pane has loaded, it renders the add-in's React application  in ```src/taskpane/components/App.jsx```.
2. App.jsx looks to see if an access token is stored in localStorage. If it does not find one it renders the ```src/taskpane/components/Welcome.jsx``` component allowing for a user to select the Twinit environment and the application to which they would like to sign in.

```html
<div className={styles.root}>

   {!token &&  <Welcome logo="assets/twinit-logo-3.png" title={'Twinit Auth for Office'} message="Welcome" onTokenReceived={receiveSignIn} />}

   {token && <TwinitContext.Provider value={{getTwinitCtx, signout}}>
      <TwinitAddin logo="assets/twinit-logo-3.png" title={'Twinit Auth for Office'} />
   </TwinitContext.Provider>}

</div>
```

3. The user selects a Twinit environment and an application and clicks the Signin button.
4. ```src/taskpane/components/Welcome.jsx``` then opens a new dialog containing ```src/dialogs/signin.html``` and passes the user's chosen environment and application (client) id as search params in the dialog's URL.

```js
// src/taskpane/components/Welcome.jsx
// open a dialog containing src/dialogs/signin.html passing the app id selected and the twinit env url selected by the user in the query params
   Office.context.ui.displayDialogAsync(`https://localhost:3000/signin.html?client_id=${selectedApp}&env=${selectedEnv}`, { height: 60, width: 30 },
      (asyncResult) => {
         const dialog = asyncResult.value

         // subscribe the dialog's DialogMessageReceived event to receive the users token from signin.html aftr they sign in to Twinit
         dialog.addEventHandler(Office.EventType.DialogMessageReceived, (token) => {

            // send the token back to App and cose the signin dialog
            props.onTokenReceived(selectedEnv, token.message)
            dialog.close()
         })
      }
   )
```
5. ```src/dialogs/signin.html``` loads in the dialog. It is an empty html file that only loads the ```src/dialogs/signin.js``` script.
6. ```src/dialogs/signin.js``` checks the dialog's URL for an access token. If it does not find one, it gets the environment and the application id from its search params in its URL and uses them to redirect the user to Twinit's signin.

```js
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
 
})()
```

7. The user signs in to Twinit and when complete Twinit redirects the dialog back to ```src/dialogs/signin.html```.
8. ```src/dialogs/signin.js``` checks the dialog's url again for an access token, and this time finding one, messages the access token back to it's parent, which is ```src/taskpane/components/Welcome.jsx```.
9. ```src/taskpane/components/Welcome.jsx``` rceives the message, passes it back to the top level component ```src/taskpane/components/App.jsx```, and closes the dialog.

```js
// subscribe the dialog's DialogMessageReceived event to receive the users token from signin.html aftr they sign in to Twinit
dialog.addEventHandler(Office.EventType.DialogMessageReceived, (token) => {

   // send the token back to App and cose the signin dialog
   props.onTokenReceived(selectedEnv, token.message)
   dialog.close()

})
```

