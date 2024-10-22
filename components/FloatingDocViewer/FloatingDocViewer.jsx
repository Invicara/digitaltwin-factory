import React from 'react'
import { Rnd } from "react-rnd"

import IafDocViewer from '@dtplatform/iaf-doc-viewer'

import './FloatingDocViewer.scss'


const FloatingDocViewer = ({docIds, position, size}) => {


   return <Rnd
         default={{
            x: position?.x || 80,
            y: position?.y || 80,
            width: size?.width || '600px',
            height: size?.height  || '600px',
         }}
         className='float-viewer'
      >
         <IafDocViewer
            docIds={docIds}
            style={{height: '100%', width: '100%'}}
         />
      </Rnd>
}

export default FloatingDocViewer