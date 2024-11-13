import React from 'react'
import { Rnd } from "react-rnd"

import IafDocViewer from '@dtplatform/iaf-doc-viewer'

import './FloatingModelDocViewer.scss'


const FloatingModelDocViewer = ({docIds, position, size, onClose}) => {

   return <Rnd
         default={{
            x: position?.x || 80,
            y: position?.y || 80,
            width: size?.width || '600px',
            height: size?.height  || '600px',
         }}
         className='float-viewer'
      >
         {onClose && <div className='float-viewer-header' onClick={onClose}><i className='fas fa-times'></i></div>}
         <IafDocViewer
            docIds={docIds}
            style={{height: '100%', width: '100%'}}
         />
      </Rnd>
}

export default FloatingModelDocViewer