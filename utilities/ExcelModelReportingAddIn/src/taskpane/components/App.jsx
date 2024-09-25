// Top level React app for the Excel Twinit Add-In
// Manages the Twinit workspace and token and providing a ctx to used when making API requests

import * as React from "react"
import { useState, useEffect, createContext } from "react"
import PropTypes from "prop-types"
import Welcome from "./Welcome"
import TwinitAddin from './TwinitAddin'
import { makeStyles } from "@fluentui/react-components"

import { IafSession } from '@dtplatform/platform-api'

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
  },
})

export const TwinitContext = createContext()

const App = (props) => {
  const styles = useStyles()

  const [ token, setToken] = useState(null)
  const [ workspace, setWorkspace ] = useState()

  useEffect(() => {

    setupSession()

  }, [])

  const setupSession = async ()=> {

    if (window.localStorage.getItem('twc') && window.localStorage.getItem('twe')) {
      receiveSignIn(window.localStorage.getItem('twe'), window.localStorage.getItem('twc'))
    }
    
  }

  const receiveSignIn = async (env, newToken) => {

    window.localStorage.setItem('twc', newToken)
    window.localStorage.setItem('twe', env)

    await IafSession.setConfig({
      itemServiceOrigin: env,
      passportServiceOrigin: env,
    })

    await IafSession.setErrorCallback(onTwinitError)
    
    setToken(newToken)
  }

  const onTwinitError = (error) => {
   
    if (error.status === 401)
      signout()

  }

  const getTwinitCtx = () => {
    return {
      authToken: token,
      _namespaces: workspace ? workspace._namespaces : []
    }
  }

  const signout = () => {
    window.localStorage.removeItem('twc')
    setToken(null)
  }
 
  return (
    <div className={styles.root}>

      {!token &&  <Welcome logo="assets/twinit-logo-3.png" title={'Twinit Auth for Office'} message="Welcome" onTokenReceived={receiveSignIn} />}

      {token && <TwinitContext.Provider value={{getTwinitCtx, setWorkspace, workspace, signout}}>
        <TwinitAddin logo="assets/twinit-logo-3.png" title={'Twinit Auth for Office'} />
      </TwinitContext.Provider>}

    </div>
  )
}

export default App
