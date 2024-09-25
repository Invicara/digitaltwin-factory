import React, { useEffect, useState} from "react"
import PropTypes from "prop-types"
import { Button, Dropdown, Option, Image, Link, Input, tokens, makeStyles } from "@fluentui/react-components"
import { environments, applications } from '../TwinitConfig'

const useStyles = makeStyles({
  welcome_top: {
    display: "flex",
    flexDirection: "column",
    height: "100vh"
  },
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
    flexGrow: "1"
  },
  envSelect: {
    marginBottom: "10px",
    minWidth: "250px"
  },
  appSelect: {
    marginBottom: "10px",
    minWidth: "250px"
  },
  appIdInput: {
    marginBottom: "10px",
    minWidth: "250px"
  },
  button: {
    marginTop: "10px"
  },
  version: {
    marginTop: "auto"
  }
})

const Welcome = (props) => {
  const { title, logo, message } = props
  const styles = useStyles()

  const [ selectedEnv, setSelectedEnv ] = useState('')
  const [ selectedApp, setSelectedApp ] = useState('')
  const [ selectedValue, setSelectedValue ] = useState('')
  const [ showAppId, setShowAppId ] = useState(false)
  const [ version, setVersion ] = useState('')
  const [ error, setError ] = useState()


  useEffect(() => {
    fetch('manifest.xml')
      .then((res) => res.text())
      .then((xmlString) => new window.DOMParser().parseFromString(xmlString, "text/xml"))
      .then((xmlDoc) => {
        let officeAppNode = xmlDoc.getElementsByTagName("OfficeApp")[0]
        let version = officeAppNode.getElementsByTagName("Version")[0].childNodes[0].nodeValue
        setVersion(version)
      })
  })

  useEffect(() => {

    let appInfo = applications.find(app => app.id === selectedApp)
    setSelectedValue(appInfo?.name || '')

  }, [selectedApp])

  const handleEnvChange = (e, option) => {
    setSelectedEnv(option.optionValue)
  } 

  const handleAppChange = (e, option) => {
    setSelectedApp(option.optionValue)
  } 

  const sendToSignin = async () => {

    let url = `https://${window.location.host}/signin.html?client_id=${selectedApp}&env=${selectedEnv}`

    try {
    // open a dialog containing src/dialogs/signin.html passing the app id selected and the twinit env url selected by the user in the query params
    Office.context.ui.displayDialogAsync(url, { height: 60, width: 30 },
        (asyncResult) => {
            const dialog = asyncResult.value

            // subscribe the dialog's DialogMessageReceived event to receive the users token from signin.html aftr they sign in to Twinit
            dialog.addEventHandler(Office.EventType.DialogMessageReceived, (token) => {

              // send the token back to App and cose the signin dialog
              props.onTokenReceived(selectedEnv, token.message)
              dialog.close()
            })
        }
    )}
    catch(err) {
      console.log(err)
      setError('Error: ' + err.toString())
    }
 }

  return (
    <div className={styles.welcome_top}>
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

        <label id="application-select">Twinit Application {showAppId ? 'ID' : ''}</label>

        {!showAppId && <Dropdown
          className={styles.appSelect}
          aria-labelledby="application-select"
          placeholder="Select a Twinit Application"
          onOptionSelect={handleAppChange}
          selectedOptions={[selectedApp]}
          value={selectedValue}
        >
          {applications.map((app) => <Option key={app.name} value={app.id}>{app.name}</Option>)}
        </Dropdown>}
        {!showAppId && <div>Don't see your application? <Link href="#" onClick={() => setShowAppId(!showAppId)} inline>Click here</Link></div>}

        {showAppId && <Input className={styles.appIdInput} type='text' onChange={(e, data) => setSelectedApp(data.value)} value={selectedApp} />}
        {showAppId && <div>Click here to return to <Link href="#" onClick={() => setShowAppId(!showAppId)} inline>configured applications</Link></div>}
        
        <Button appearance="primary" className={styles.button} size="large" onClick={sendToSignin} disabled={!selectedEnv || !selectedApp}>
          Signin
        </Button>
        {error && <div>{error}</div>}
        <div className={styles.version}>{version}</div>
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
