// Redux Slice for handling the list of models and selected model data
//
// This slice is loaded by ipa-core by putting it in your app/ipaCore/redux folder and adding
// this config to your app/ipaCore/ipaConfig.js
// redux: {
//    slices: [
//       { name: 'modelSlice', file: 'modelSlice.js' }
//    ]
// },

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { IafProj, IafItemSvc } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'

// Redux Slice
export const modelSlice = createSlice({
   name: 'model',
   initialState: {
      allModels: [],                            // all models in the project
      selectedModel: null,                      // the currently selected model   
      selectedModelElementCollection: null,     // the current model elements collection
      selectedModelTypeCollection: null,        // the current model element type props collection
      selectedModelPropCollection: null,        // the current model element props collection
      loadingElement: false,                    // if an element is being retrieved form Twinit
      selectedElement: null,                    // the currently selected element
      sliceIds: []                              // model slice ids (search results)
   },
   reducers: {
      setSliceIds: (state, action) => {
         if (Array.isArray(action.payload)) {
            state.sliceIds = action.payload
         }
      }
   },
   extraReducers: (builder) => {
      builder
         .addCase(loadAllModels.fulfilled, (state, action) => {
            state.allModels = action.payload
         })
         .addCase(setCurrentModel.fulfilled, (state, action) => {
            state.selectedModel = action.payload.selectedModel
            state.selectedModelElementCollection = action.payload.elementCollection
            state.selectedModelPropCollection = action.payload.elementPropsCollection
            state.selectedModelTypeCollection = action.payload.elementTypePropsCollection
         })
         .addCase(setCurrentModelElement.pending, (state, action) => {
            state.loadingElement = true
         })
         .addCase(setCurrentModelElement.fulfilled, (state, action) => {
            state.selectedElement = action.payload
            state.loadingElement = false
         })
   }
})

// thunk to load all the model composites in a project
export const loadAllModels = createAsyncThunk('project/getModels',
   async() => {
      let currentProject = await IafProj.getCurrent()
      let importedModelComposites = await IafProj.getModels(currentProject)
      return importedModelComposites
   }
)

// thunk to load the currently selected model data by composite item id
export const setCurrentModel = createAsyncThunk('model/setCurrentModel',
   async (modelCompositeId, thunkApi) => {

      if (!modelCompositeId) return { 
         selectedModel: null,
         elementCollection: null,
         elementPropsCollection: null,
         elementTypePropsCollection: null
      }

      let allModels = thunkApi.getState().modelSlice.allModels

      let selectedModel = allModels.find(amc => amc._id === modelCompositeId)

      // get collections contained in the NamedCompositeItem representing the model
      let collectionsModelCompositeItem = (await IafItemSvc.getRelatedInItem(selectedModel._userItemId, {}))._list

      let elementCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_elements')
      let elementPropsCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_element_props')
      let elementTypePropsCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_type_elements')

      return { selectedModel, elementCollection, elementPropsCollection, elementTypePropsCollection }
   }
)

// thunk to load the currently selected model element by pkgid
export const setCurrentModelElement = createAsyncThunk('model/setCurrentModelElement',
   async (pkgid, thunkApi) => {

      if (!pkgid) return null

      const { selectedModelElementCollection, selectedModelTypeCollection, selectedModelPropCollection } = thunkApi.getState().modelSlice

      // query the element collection as the parent
      // and follow relationships to the child instance and type properties
      let selectedModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {package_id: pkgid},
            collectionDesc: {_userItemId: selectedModelElementCollection._userItemId, _userType: selectedModelElementCollection._userType},
         },
         related: [
            {
               relatedDesc: { _relatedUserType: selectedModelPropCollection._userType},
               as: 'instanceProperties'
            },
            {
               relatedDesc: { _relatedUserType: selectedModelTypeCollection._userType},
               as: 'typeProperties'
            }
         ]
      })

      let userSelectedElement = selectedModelElements._list[0]
      userSelectedElement.typeProperties = userSelectedElement.typeProperties._list[0].properties
      userSelectedElement.instanceProperties = userSelectedElement.instanceProperties._list[0].properties

      return userSelectedElement
   }
)

export const { setSliceIds } = modelSlice.actions

export default modelSlice.reducer