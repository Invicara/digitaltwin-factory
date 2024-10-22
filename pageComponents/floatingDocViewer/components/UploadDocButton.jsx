import React, { useState, useContext } from 'react'

import { IafFileSvc, IafProj } from '@dtplatform/platform-api'
import { IafLocalFile } from '@dtplatform/ui-utils'
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls'

import './UploadDocButton.scss'

import { FilesContext } from '../FloatingDocView'

const UploadDocButton = (props) => {

	const { loadFiles } = useContext(FilesContext)

   const [ uploading, setUploading ] = useState(false) // if the button is currently uploading a file
   const [ progress, setProgress ] = useState('0%') // current upload percent if a file is uploading
   const [ error, setError ] = useState() // error text if an error is encountered during upload
   
   const uploadFile = async () => {

      setUploading(true)
      setProgress('0%')
      setError(null)

      // select the file to upload - single select though still returns an array
		let files = await IafLocalFile.selectFiles({ multiple: false, accept: "*" })

		function onUploadComplete(deferredResolve, file) {
			deferredResolve()
		}

		function onUploadProgress(bytesUploaded, bytesTotal, file) {
			let percentComplete = (bytesUploaded/bytesTotal * 100).toFixed(0)
			setProgress(`${percentComplete}%`)
		}

		function onUploadError(deferredReject, error, file) {
			setError('Error uplaoding file!')
			deferredReject(error)
		}

		// upload each file async - onyl one in this case
		let uploadPromises = [] // a collection of deferred promises, 1 for each file we upload
		for (const file of files) {

			let deferredResolve, deferredReject
			uploadPromises.push(new Promise((resolve, reject) => {
				deferredResolve = resolve
				deferredReject = reject
			}))

			try {
				let project = await IafProj.getCurrent()
				await IafFileSvc.addFileResumable(file.fileObj, project._namespaces, [], [], null, {
						filename: file.name,
						onProgress: (bytesUploaded, bytesTotal) => onUploadProgress(bytesUploaded, bytesTotal, file),
						onComplete: (file) => onUploadComplete(deferredResolve, file),
						onError: (error) => onUploadError(deferredReject, error, file)
					}
				)
			} catch(e) {
				console.log(e)
				deferredReject(e)
				setError('Error Uploading file!')
			}

		}

      await Promise.all(uploadPromises).then(() => {
         console.log('File successfully uploaded')
    	}).catch(() => {
			console.error('Error uploading file!')
		}).finally(() => {
			setUploading(false)
         setProgress('0%')
			loadFiles()
		})

   }

   return <div className='file-upload-ctrl'>
		<GenericMatButton
				onClick={uploadFile}
				disabled={uploading}
				styles={{ width: '100%' }}
				className='file-upload-btn'
				customClasses='file-upload-btn'>
		{!uploading ? 'Upload File' : `${progress}`}
		</GenericMatButton>
		<div className='file-upload-error-msg'>{error ? error : ''}</div>
	</div>
}

export default UploadDocButton