import React from "react"
import { makeStyles } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80px',
        backgroundColor: 'white',
        borderBottom: `1px solid black`
    },
    logoWrapper: {
        display: 'flex',
        alignItems: 'center',
        margin: '0px 20px 0px 0px'
    },
    actionIcon: {
         margin: '0px 10px 0px 10px',
         cursor: 'pointer'
    }
}))

const HeaderBar = (props) => {

    const classes = useStyles()
    
    const { userLogout, goToUserAccount, switchProj } = props
    const Logo = props.logoComponent

    const reloadUserConfig = () => {
      sessionStorage.removeItem('ipadt_configData')
      window.location.reload()
    }

    return (

        <header className={`HeaderBar__container ${classes.container}`}>
            <div className={classes.logoWrapper}>
                <Logo homepage="#/" appName={''} contextProps={props}/>
            </div>
            <div>
               <i className={`fas fa-sign-out-alt fa-2x ${classes.actionIcon}`} 
                  onClick={userLogout}>
               </i>
               <i className={`fas fa-user fa-2x ${classes.actionIcon}`}
                  onClick={goToUserAccount}>
               </i>
               <i className={`fas fa-exchange-alt fa-2x ${classes.actionIcon}`}
                  onClick={switchProj}>
               </i>
               <i className={`fas fa-sync fa-2x ${classes.actionIcon}`}
                  onClick={reloadUserConfig}>
               </i>
            </div>
        </header>

    )
}

export default HeaderBar