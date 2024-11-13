// Redux Slice for handling the list of documents related to a model element
//
// This slice is loaded by ipa-core by putting it in your app/ipaCore/redux folder and adding
// this config to your app/ipaCore/ipaConfig.js
// redux: {
//    slices: [
//       { name: 'documentsSlice', file: 'documentsSlice.js' }
//    ]
// },

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { IafProj } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'

// Redux Slice
export const documentsSlice = createSlice({
   name: 'documents',
   initialState: {
      rootContainer: null,    // the root container of all files in the project
      allDocuments: [],       // the list of all files related to a model element
      selectedDocuments: []   // the list of selected documents in the allDocuments list
   },
   reducers: {
      selectDocument: (state, action) => {
         state.selectedDocuments.push(action.payload)
      },
      unselectDocument: (state, action) => {
         state.selectedDocuments = state.selectedDocuments.filter(doc => doc._id !== action.payload._id)
      },
      unselectAllDocuments: (state) => {
         state.selectedDocuments = []
      }
   },
   extraReducers: (builder) => {
      builder
         .addCase(loadRootContainer.fulfilled, (state, action) => {
            state.rootContainer = action.payload
         })
         .addCase(loadFileItems.fulfilled, (state, action) => {
            state.allDocuments = action.payload
            state.selectedDocuments = []
         })
   }
})

// thunk to load the rootContainer into the redux state
export const loadRootContainer = createAsyncThunk('project/getRootContainer',
   async() => {
      let project = await IafProj.getCurrent()
      let containers = await IafProj.getFileContainers(project._id)
      return containers._list.find(c => c._name === 'Root Container')
   }
)

// thunk to load the files related to a given model element
export const loadFileItems = createAsyncThunk('model/getFileItems',
   async (args, thunkApi) => {

      let rootContainer = thunkApi.getState().documentsSlice.rootContainer

      if (!rootContainer) return []

      let selectedModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {package_id: args.pkgid},
            collectionDesc: {_userItemId: args.selectedModelElementsCollection._userItemId, _userType: args.selectedModelElementsCollection._userType},
         },
         related: [
            {
               relatedDesc: { _relatedUserType: rootContainer._userType },
               as: 'documents'
            }
         ]
      })

      return selectedModelElements._list[0].documents._list.sort((a,b) => a.name.localeCompare(b.name))
   }
)


export const { selectDocument, unselectDocument, unselectAllDocuments } = documentsSlice.actions

export default documentsSlice.reducer