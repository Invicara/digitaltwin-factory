import React, { useState, useEffect } from 'react'

import { makeStyles, Input, Dropdown, Option } from '@fluentui/react-components'

import PropTypes from 'prop-types'

const Modes = {
   EQ: 'equals',
   LT: 'less than',
   GT: 'greater than',
   BT: 'between',
   OT: 'outside'
}

const useStyles = makeStyles({
   numberInputTop: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      width: "100%",
      padding: "0px 10px 0px 10px"
   },
   modeDrop: {
      minWidth: "15%",
      marginRight: "10px"
   },
   numbers: {
      width: "30%",
      marginRight: "10px"
   }
})

const FilterNumberInput = ({id, onChange}) => {

   const [ currentMode, setCurrentMode ] = useState(Modes.EQ)

   const [ numberOne, setNumberOne ] = useState(null)
   const [ numberTwo, setNumberTwo ] = useState(null)

   const styles = useStyles()

   const switchMode = (e, data) => {
      setCurrentMode(data.optionValue)
   }

   useEffect(() => {

      if (onChange) {

         if (currentMode !== Modes.BT && currentMode !== Modes.OT) {
            onChange({mode: currentMode, valOne: numberOne})
         } else if (currentMode === Modes.BT) {
            onChange({
               mode: currentMode,
               valOne: (numberOne < numberTwo) ? numberOne : numberTwo,
               valTwo: (numberOne < numberTwo) ? numberTwo : numberOne
            })
         } else if (currentMode === Modes.OT) {
            onChange({
               mode: currentMode,
               valOne: (numberOne < numberTwo) ? numberTwo : numberOne,
               valTwo: (numberOne < numberTwo) ? numberOne : numberTwo
            })
         }
      }

   }, [currentMode, numberOne, numberTwo])

   return <div className={styles.numberInputTop}>
      <Dropdown
         className={styles.modeDrop}
         aria-labelledby={id}
         inlinePopup={true}
         onOptionSelect={switchMode}
         value={currentMode}
      >
         {Object.keys(Modes).map((mk) => <Option key={mk} value={Modes[mk]}>{Modes[mk]}</Option>)}
      </Dropdown>
      <Input id='numOne' className={styles.numbers} 
         type='number'
         value={numberOne}
         onChange={(e, data) => setNumberOne(parseFloat(data.value))}
      />
      {[Modes.BT, Modes.OT].includes(currentMode) && <Input id='numTwo' 
         className={styles.numbers} 
         type='number'
         value={numberTwo}
         onChange={(e, data) => setNumberTwo(parseFloat(data.value))}
      />}
   </div>
}

FilterNumberInput.propTypes = {
   id: PropTypes.string
}

export default FilterNumberInput