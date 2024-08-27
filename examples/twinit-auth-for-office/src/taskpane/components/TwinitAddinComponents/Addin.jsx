import * as React from "react"
import PropTypes from "prop-types"
import { makeStyles } from "@fluentui/react-components"

const useStyles = makeStyles({
   addinBody: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "100px 10px 10px 10px",
      border: "2px solid lightgray",
      borderRadius: "10px",
      height: "120px",
      color: "lightgray",
      fontWeight: "bold"
   }
})

const Addin = (props) => {

   const styles = useStyles()

   return (
      <div className={styles.addinBody}>
         YOUR CUSTOM ADDIN GOES HERE
      </div>
   );
};

Addin.propTypes = {
  
}

export default Addin
