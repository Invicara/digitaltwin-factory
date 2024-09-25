import * as React from "react"
import PropTypes from "prop-types"

import Header from './TwinitAddinComponents/Header'
import Addin from './TwinitAddinComponents/Addin'

const TwinitAddin = (props) => {
  const { title, logo } = props

  return (
   <div>
      <Header logo={logo} title={title} />
      <Addin />
   </div>
  )
}

TwinitAddin.propTypes = {
  title: PropTypes.string,
  logo: PropTypes.string,
  message: PropTypes.string,
  onTokenReceived: PropTypes.func
}

export default TwinitAddin
