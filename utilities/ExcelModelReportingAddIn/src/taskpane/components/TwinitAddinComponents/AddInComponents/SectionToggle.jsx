import * as React from "react"
import PropTypes from "prop-types"
import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components"
import { ChevronCircleUp28Regular, ChevronCircleDown28Regular } from '@fluentui/react-icons'

const useStyles = makeStyles({
   toggle: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
   },
   iconToggle: {
      cursor: "pointer"
   },
   ruledText: {
      width: "100%",
      textAlign: "center",
      borderBottom: "1px solid #000",
      lineHeight: "0.1rem",
      margin: "10px 0px 20px 0px"
   },
   ruledTextLabel: {
      background: "#fff",
      padding: "0px 10px",
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightBold
   }
})

const SectionToggle = ({label, collapsed, setCollapsed, propStyles}) => {

   const styles = useStyles()

   return (
      <div id='projectmodelpicker_toggle' className={styles.toggle}>
         <div className={mergeClasses(styles.ruledText, propStyles?.ruledText)}><span className={styles.ruledTextLabel}>{label}</span></div>
         {setCollapsed && !collapsed && <ChevronCircleUp28Regular className={styles.iconToggle} onClick={() => setCollapsed(true)} />}
         {setCollapsed && collapsed && <ChevronCircleDown28Regular className={styles.iconToggle} onClick={() => setCollapsed(false)} />}
      </div>
   );
};

SectionToggle.propTypes = {
   label: PropTypes.string,
   collapsed: PropTypes.bool,
   setCollapsed: PropTypes.func,
   propStyles: PropTypes.object
}

export default SectionToggle
