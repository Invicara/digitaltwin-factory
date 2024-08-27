import * as React from "react"
import { useState } from "react"
import PropTypes from "prop-types"
import { Button, Dropdown, Option, Image, tokens, makeStyles } from "@fluentui/react-components"
import { environments, applications } from '../TwinitConfig'

const useStyles = makeStyles({
  welcome__header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "30px",
    paddingTop: "100px",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  message: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightRegular,
    fontColor: tokens.colorNeutralBackgroundStatic,
  },
  welcome__ctrls: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "30px",
    paddingTop: "30px",
  },
  envSelect: {
    marginBottom: "10px"
  },
  appSelect: {
    marginBottom: "10px"
  },
  button: {
   backgroundColor: "#C71784",
   ':hover': {backgroundColor: "#9f1269"}
  }
})

const Welcome = (props) => {
  const { title, logo, message } = props
  const styles = useStyles()

  const [ selectedEnv, setSelectedEnv ] = useState('')
  const [ selectedApp, setSelectedApp ] = useState('')

  const handleEnvChange = (e, option) => {
    setSelectedEnv(option.optionValue)
  } 

  const handleAppChange = (e, option) => {
    setSelectedApp(option.optionValue)
  } 

  const sendToSignin = async () => {

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
 }

  return (
    <div>
      <section className={styles.welcome__header}>
        <Image width="90" height="90" src={logo} alt={title} />
        <h1 className={styles.message}>{message}</h1>
      </section>
      <div className={styles.welcome__ctrls}>

        <label id="environment-drop">Twinit Environment</label>
        <Dropdown
          className={styles.envSelect}
          aria-labelledby="environment-drop"
          placeholder="Select a Twinit Environment"
          onOptionSelect={handleEnvChange}
        >
          {environments.map((env) => <Option key={env.name} value={env.url}>{env.name}</Option>)}
        </Dropdown>

        <label id="application-drop">Twinit Application</label>
        <Dropdown
          className={styles.appSelect}
          aria-labelledby="application-drop"
          placeholder="Select a Twinit Application"
          onOptionSelect={handleAppChange}
        >
          {applications.map((app) => <Option key={app.name} value={app.id}>{app.name}</Option>)}
        </Dropdown>

        <Button appearance="primary" className={styles.button} size="large" onClick={sendToSignin} disabled={!selectedEnv || !selectedApp}>
          Signin
        </Button>
      </div>
    </div>
  )
}

Welcome.propTypes = {
  title: PropTypes.string,
  logo: PropTypes.string,
  message: PropTypes.string,
  onTokenReceived: PropTypes.func
}

export default Welcome
