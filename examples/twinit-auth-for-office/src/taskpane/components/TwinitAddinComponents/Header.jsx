import * as React from "react"
import { useEffect, useState, useContext } from 'react'
import PropTypes from "prop-types"
import { Image, tokens, makeStyles } from "@fluentui/react-components"

import { IafPassSvc } from '@dtplatform/platform-api'
import { TwinitContext } from '../App'

const useStyles = makeStyles({
   app__header: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: "20px",
      paddingTop: "20px",
      backgroundColor: tokens.colorNeutralBackground3,
   },
   leftSide:{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      marginLeft: "30px"
   },
   message: {
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightRegular,
      fontColor: tokens.colorNeutralBackgroundStatic,
      marginLeft: "10px"
   },
   rightSide:{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      marginRight: "30px",
      fontSize: tokens.fontSizeBase400,
   }
})

const Header = (props) => {
   const { title, logo } = props
   const styles = useStyles()

   const { getTwinitCtx, signout } = useContext(TwinitContext)

   const [ userName, setUserName ] = useState('')

   useEffect(() => {
      getUserInfo()
   }, [])

   // gets the user info from Twinit using the contect object from TwinitContext
   const getUserInfo = async () => {

      IafPassSvc.getCurrentUser(getTwinitCtx()).then((userInfo) => {
         setUserName(userInfo._firstname)
      }).catch((err) => {
         // if 401 error will be handled by App.jsx -> onTwinitError
         console.error('Error fetching current Twinit user', err)
      })

   }

   const handleSignout = async () => {
      IafPassSvc.logout(getTwinitCtx())
      signout()
   }

   return (
      <section className={styles.app__header}>
         <div className={styles.leftSide}>
            <Image width="30" height="30" src={logo} alt={title} />
            <div className={styles.message}>Welcome {userName}</div>
         </div>
         <div className={styles.rightSide}><a href="#" onClick={handleSignout}>Signout</a></div>
      </section>
   );
};

Header.propTypes = {
  title: PropTypes.string,
  logo: PropTypes.string,
  message: PropTypes.string,
  onTokenReceived: PropTypes.func
}

export default Header
