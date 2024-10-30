// version dtf-1.0

class InputValidation {
	constructor(params, libraries, ctx) {
			this.params = params
			this.libraries = libraries
			this.ctx = ctx
	}

	async validate() {
			return new Promise(async (resolve, reject) => {
					try {
			console.log(`Executing validate method, orchrun_id: ${this.params.orchRunId}`)
							this.#validateFileDetails()

							if (await this.#modelExists()) {
									console.log(`Model Imported already, Please remove existing import and try again, orch_run_id: ${this.params.orchRunId}`)

									throw new Error('Model Imported already, Please remove existing import and try again')
							}

							console.log(`Basic input validation completed, orchrun_id: ${this.params.orchRunId}`)

							resolve(true)
					} catch (error) {
							console.log(`Error at validate method, orchrun_id: ${this.params.orchRunId}`, error)

							reject(error)
					}
			})
	}

	#validateFileDetails() {
			if (!this.params.actualParams._fileId)
					throw new Error('Invalid Parameters - _fileId is Invalid')
			if (!this.params.actualParams._fileVersionId)
					throw new Error('Invalid Parameters - _fileVersionId is Invalid')
	if(this.params.ext != 'bimpk' && this.params.ext != 'sgpk')
		throw new Error('Invalid model file extension')
	}

	async #modelExists() {
			return new Promise(async (resolve, reject) => {
					try {
							const { PlatformApi } = this.libraries
			const fileIdAttribute = `_versions._userAttributes.${this.params.ext}.fileId`
			const fileVersionIdAttribute = `_versions._userAttributes.${this.params.ext}.fileVersionId`
							const criteria = {
									query: {
											[fileIdAttribute]: this.params.actualParams._fileId,
											[fileVersionIdAttribute]: this.params.actualParams._fileVersionId,
											'_versions.all': true,
									}
							}
							const project = { _namespaces: this.ctx._namespaces }

							const models = await PlatformApi.IafProj.getModels(project, criteria, this.ctx)
							const doesExist = models ? models.length > 0 : false

			resolve(doesExist)
					} catch (error) {
							console.log(`Error at modelExists method, orchrun_id: ${this.params.orchRunId}`, error)
							
							reject(error)       
					}
			})
	}
}

class BimpkImport {
#assetTypeMap = null;
#propMap;
#typeMap;

	constructor(params, libraries, ctx) {
			this.params = params
			this.libraries = libraries
			this.ctx = ctx
	}

	async initialize() {
	return new Promise(async (resolve, reject) => {
		try {
			console.log(`Bimpk import initialized, orch_run_id: ${this.params.orchRunId}`)
			const { PlatformApi,  IafScriptEngine, ModelFileReader } = this.libraries;
			const { IafItemSvc } = PlatformApi
			let param = { ...this.params.actualParams, filename: this.params.filename, ext: this.params.ext, orchRunId: this.params.orchRunId }
			
			// set global variables first
			await Promise.all([
				IafScriptEngine.setVar("namespaces", this.ctx._namespaces),
				IafScriptEngine.setVar("package_name", param.filename),
				IafScriptEngine.setVar("package_name_short", param.filename.substring(0, 11)),
				IafScriptEngine.setVar("bimpk_fileid", param._fileId),
				IafScriptEngine.setVar("bimpk_fileVersionId", param._fileVersionId)
			])

			const { _list = [] } = await IafItemSvc.getNamedUserItems(
									{
											"query": {
													"_userType": "bim_model_version",
													"_versions._userAttributes.bimpk.fileId": param._fileId,
													"_itemClass":"NamedCompositeItem"
											}
									}, 
									this.ctx, 
									{}
							) || {};
							const bim_model = _list[0];

							if (bim_model) {
									await IafScriptEngine.setVar("bim_model", bim_model);
							}

			const { bimFilePath, manifest } = await ModelFileReader.downloadAndUnzipModelFile(param, ctx)
			const { files, occurrences } = manifest
			const fileLength = files.length - 1;
			let index = -1;

			if (bim_model) { //
				console.time(`${this.params.orchRunId}: createBIMCollectionVersion`)
									await this.#createBIMCollectionVersion();
				console.timeEnd(`${this.params.orchRunId}: createBIMCollectionVersion`)
							} else {
				console.time(`${this.params.orchRunId}: createBIMCollections`)
									await this.#createBIMCollections();
				console.timeEnd(`${this.params.orchRunId}: createBIMCollections`)
							}

			const [
				{ _id: bimModelId },
				model_els_coll,
				model_els_props_coll,
				model_type_el_coll,
				data_cache_coll,
				model_geom_file_coll,
				model_geom_views_coll
			] = await Promise.all([
				IafScriptEngine.getVar("bim_model"),
				IafScriptEngine.getVar("model_els_coll"),
				IafScriptEngine.getVar("model_els_props_coll"),
				IafScriptEngine.getVar("model_type_el_coll"),
				IafScriptEngine.getVar("data_cache_coll"),
				IafScriptEngine.getVar("model_geom_file_coll"),
				IafScriptEngine.getVar("model_geom_views_coll")
			])
							
			let relatedCollections = [model_els_coll._userItemId,
				model_els_props_coll._userItemId,
				model_type_el_coll._userItemId,
				data_cache_coll._userItemId,
				model_geom_file_coll._userItemId,
				model_geom_views_coll._userItemId
			]
				
			await IafScriptEngine.addRelatedCollections({
					"namedCompositeItemId": bimModelId,
					"relatedCollections": relatedCollections
			}, ctx);

			const myCols = {
				model_els_coll,
				model_els_props_coll,
				model_type_el_coll,
				data_cache_coll,
				model_geom_file_coll,
				model_geom_views_coll
			}

			try {
				this.#assetTypeMap = await IafScriptEngine.getItems({
					collectionDesc: {
						_userType: 'iaf_dt_type_map_defs_coll',
						_namespaces: this.ctx._namespaces
					},
					options: {
						page: { getAllItems: true }
					}
				}, this.ctx)
				console.log(`Asset map type received, orch_run_id: ${this.params.orchRunId} `, typeof this.#assetTypeMap)
			} catch (err) {
				console.log(`Type Map collection does not exist, orch_run_id: ${this.params.orchRunId}`)
			}

			for (const model of files) {
				index += 1;
				// find occurances
				let occs = occurrences.filter(d => d.source === model.id)
				
				if(!occs?.length) {
					console.warn(`Warning: Occurrences missing for model: ${model.id}, orch_run_id: ${this.params.orchRunId}`)
											occs = []
									}

				for (const occ of occs) {
					const filePath = bimFilePath + '/' + occ.data.objects
					let newOccurrence = true
					let letsLoop = true

					while(letsLoop) {
						console.log(`Requesting bimpk batchlet, orch_run_id: ${this.params.orchRunId}`)

						console.time(`${this.params.orchRunId}: getModelBatchlet`)
						const { bimBatch, endOfFile } = await ModelFileReader.getModelBatchlet(filePath, this.params.orchRunId)
						console.log(`Bim batchlet received: ${bimBatch?.objects?.length}, orch_run_id: ${this.params.orchRunId}`)
						console.timeEnd(`${this.params.orchRunId}: getModelBatchlet`)

						console.time(`${this.params.orchRunId}: extractBimpk`)
						await this.#extractBimpk(model.name, bimBatch, newOccurrence)
						console.timeEnd(`${this.params.orchRunId}: extractBimpk`)
						
						console.time(`${this.params.orchRunId}: createRelatedItemsAndRelationships`)
						await this.#createRelatedItemsAndRelationships(newOccurrence, myCols)
						console.timeEnd(`${this.params.orchRunId}: createRelatedItemsAndRelationships`)

						newOccurrence = false

						if(endOfFile) break
					}
				}

				if(fileLength === index) {
											const result = {
						filecolid: myCols.model_geom_file_coll._userItemId,
						viewcolid: myCols.model_geom_views_coll._userItemId,
						compositeitemid: bimModelId,
						myCollections: myCols,
						filename: param.filename,
						_fileId: param._fileId,
						_fileVersionId: param._fileVersionId,
						bimFilePath,
						manifest
					}

					await IafScriptEngine.clearVars();
					
					return resolve(result)
									}
			}
		} catch (error) {
			reject(error)	
		}
	})
	}

async #createBIMCollectionVersion() {
	return new Promise(async (resolve, reject) => {
		try {
			console.log(`Found Previous Model Creating Versions, orch_run_id: ${this.params.orchRunId}`);
			const { IafScriptEngine } = this.libraries;
			const [ bimModel, bimpkFileId, bimpkFileVersionId, packagename, packagenameShort ] = await Promise.all([
				IafScriptEngine.getVar("bim_model"),
				IafScriptEngine.getVar("bimpk_fileid"),
				IafScriptEngine.getVar("bimpk_fileVersionId"),
				IafScriptEngine.getVar('package_name'),
				IafScriptEngine.getVar('package_name_short')
			])
			const newModelVer = { 
				namedUserItemId: bimModel._id,
				_userAttributes: {
					bimpk: {
						fileId: bimpkFileId,
						fileVersionId: bimpkFileVersionId
					}   
				}
			}
			const [modelRelatedCollection] = await Promise.all([
				IafScriptEngine.getCollectionsInComposite(bimModel._id, null, this.ctx),
				IafScriptEngine.createNamedUserItemVersion(newModelVer, this.ctx)
			])

			console.log(`modelRelatedCollection, orch_run_id: ${this.params.orchRunId}`, modelRelatedCollection)
			console.log(`Created BIM Collection Version bim_model version, orch_run_id: ${this.params.orchRunId}`);

			let model_els_coll, model_els_props_coll, model_type_el_coll, model_geom_file_coll, model_geom_views_coll, data_cache_coll;

			for (const obj of modelRelatedCollection) {
				if(obj._userType === 'rvt_elements' && !model_els_coll) {
					model_els_coll = obj
				}else if(obj._userType === 'rvt_element_props' && !model_els_props_coll) {
					model_els_props_coll = obj
				}else if(obj._userType === 'rvt_type_elements' && !model_type_el_coll) {
					model_type_el_coll = obj
				}else if(obj._userType === 'bim_model_geomresources' && !model_geom_file_coll) {
					model_geom_file_coll = obj
				}else if(obj._userType === 'bim_model_geomviews' && !model_geom_views_coll) {
					model_geom_views_coll = obj
				}else if(obj._userType === 'data_cache' && !data_cache_coll) {
					data_cache_coll = obj
				}
			}

			if (!data_cache_coll) {
				const data_cache_coll_def = {
					_name: packagename + '_data_cache',
					_shortName: packagenameShort + '_data_cache',
					_description: 'Data cached about imported model',
					_userType: 'data_cache',
					_namespaces: this.ctx._namespaces
				}

				data_cache_coll = await IafScriptEngine.createCollection(data_cache_coll_def, this.ctx);

				console.log(`Created Model Data Cache, orch_run_id: ${this.params.orchRunId}`);
			}

			console.log(`Created Model versions, orch_run_id: ${this.params.orchRunId}`);
			// create the versions
			await Promise.all([
				IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_els_coll._userItemId }, this.ctx),
				IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_els_props_coll._userItemId }, this.ctx),
				IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_type_el_coll._userItemId }, this.ctx),
				IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": data_cache_coll._userItemId }, this.ctx),
				IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_geom_file_coll._userItemId }, this.ctx),
				IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_geom_views_coll._userItemId }, this.ctx)
			])

			// set them in global variables
			await Promise.all([
				IafScriptEngine.setVar("model_els_coll", model_els_coll),
				IafScriptEngine.setVar("model_els_props_coll", model_els_props_coll),
				IafScriptEngine.setVar("model_type_el_coll", model_type_el_coll),
				IafScriptEngine.setVar("data_cache_coll", data_cache_coll),
				IafScriptEngine.setVar("model_geom_file_coll", model_geom_file_coll),
				IafScriptEngine.setVar("model_geom_views_coll", model_geom_views_coll)
			])

			const elemCollIndex = {
				"_id": model_els_coll._userItemId,
				indexDefs: [
					{
						key: { "id": 1 },
						options: {
							name: "model_els_coll_id",
							default_language: "english"
						}
					},
					{
						key: { "source_id": 1 },
						options: {
							name: "model_els_coll_source_id",
							default_language: "english"
						}
					}
				]
			};

			const typeElemCollIndex = {
				"_id": model_type_el_coll._userItemId,
				indexDefs: [
					{
						key: { "id": 1 },
						options: {
							name: "typeElemsCol_id",
							default_language: "english"
						}
					},
					{
						key: { "source_id": 1},
						options: {
							name: "typeElemsCol_source_id",
							default_language: "english"
						}
					}
				]
			}
			
			await Promise.all([
				IafScriptEngine.createOrRecreateIndex(elemCollIndex, this.ctx),
				IafScriptEngine.createOrRecreateIndex(typeElemCollIndex, this.ctx)
			])

			resolve(true)
		}catch(error) {
			console.log('Error at createBIMCollectionVersion')
			console.error(error)

			reject(error)
		}
	})
}

async #createBIMCollections () {
	return new Promise(async (resolve, reject) => {
		try {
			const { IafScriptEngine } = this.libraries;

			console.log(`Creating Model Collections, orch_run_id: ${this.params.orchRunId}`);
			const [ packagename, packagenameShort, bimpkFileId, bimpkFileVersionId ] = await Promise.all([
				IafScriptEngine.getVar("package_name"),
				IafScriptEngine.getVar("package_name_short"),
				IafScriptEngine.getVar("bimpk_fileid"),
				IafScriptEngine.getVar("bimpk_fileVersionId")
			])

			console.log(`packagename: ${packagename}, packagenameShort: ${packagenameShort} orch_run_id: ${this.params.orchRunId}`)
			//create Elements Collection
			const elementsCol = {
				"_name": packagename + "_elements",
				"_shortName": packagenameShort + "_ba_elem",
				"_description": "Elements in BA model",
				"_userType": "rvt_elements",
				"_namespaces": this.ctx._namespaces
			}

			//create Element Properties Collection
			const modelElemPropsCol = {
				_name: packagename + '_elem_props',
				_shortName: packagenameShort + '_elprops',
				_description: 'Element Props in BA model',
				_userType: 'rvt_element_props',
				_namespaces: this.ctx._namespaces
			}

			//create Type Elements Collection
			const typeElemsCol = {
				_name: packagename + '_type_el',
				_shortName: packagenameShort + '_type_el',
				_description: 'Type Elements in BA Check model',
				_userType: 'rvt_type_elements',
				_namespaces: this.ctx._namespaces
			}
			
			//create Geometry File Collection
			const geometryFilesCol = {
				"_name": packagename + "_geom_file",
				"_shortName": packagenameShort + "_geom_file",
				"_description": "File Collection for Geometry Files",
				"_userType": "bim_model_geomresources",
				"_namespaces": this.ctx._namespaces
			}

			//create Geometry View Collection
			const geometryViewsCol = {
				"_name": packagename + "_geom_view",
				"_shortName": packagenameShort + "_geom_view",
				"_description": "Geometry Views in Model",
				"_userType": "bim_model_geomviews",
				"_namespaces": this.ctx._namespaces
			}

			//create Model Data Cache Collection
			const dataCacheCol = {
				"_name": packagename + "_data_cache",
				"_shortName": packagenameShort + "_data_cache",
				"_description": "Data cached about imported model",
				"_userType": "data_cache",
				"_namespaces": this.ctx._namespaces
			}
			
			//create Model Composite Item
			const modelCompItem = {
				"_name": packagename,
				"_shortName": packagenameShort + "_modelver",
				"_description": "BIM model version by transform",
				"_userType": "bim_model_version",
				"_namespaces": this.ctx._namespaces,
				"_version": {
					"_userAttributes": {
						"bimpk": {
							"fileId": bimpkFileId,
							"fileVersionId": bimpkFileVersionId
						}
					}
				}
			}
			console.log(`modelCompItem, orch_run_id: ${this.params.orchRunId}`, modelCompItem)

			const [
				model_els_coll, model_els_props_coll, model_type_el_coll, model_geom_file_coll, model_geom_views_coll, data_cache_coll, model
			] = await Promise.all([
				IafScriptEngine.createCollection(elementsCol, this.ctx),
				IafScriptEngine.createCollection(modelElemPropsCol, this.ctx),
				IafScriptEngine.createCollection(typeElemsCol, this.ctx),
				IafScriptEngine.createCollection(geometryFilesCol, this.ctx),
				IafScriptEngine.createCollection(geometryViewsCol, this.ctx),
				IafScriptEngine.createCollection(dataCacheCol, this.ctx),
				IafScriptEngine.createNamedCompositeItem(modelCompItem, this.ctx)
				
			])

			// set them in global variables
			await Promise.all([
				IafScriptEngine.setVar("model_els_coll", model_els_coll),
				IafScriptEngine.setVar("model_els_props_coll", model_els_props_coll),
				IafScriptEngine.setVar("model_type_el_coll", model_type_el_coll),
				IafScriptEngine.setVar("model_geom_file_coll", model_geom_file_coll),
				IafScriptEngine.setVar("model_geom_views_coll", model_geom_views_coll),
				IafScriptEngine.setVar("data_cache_coll", data_cache_coll),
				IafScriptEngine.setVar("bim_model", model)
			])

			const elemCollIndex = {
				"_id": model_els_coll._userItemId,
				indexDefs: [
					{
						key: { "id": 1 },
						options: {
							name: "model_els_coll_id",
							default_language: "english"
						}
					},
					{
						key: { "source_id": 1 },
						options: {
							name: "model_els_coll_source_id",
							default_language: "english"
						}
					}
				]
			};
			const typeElemCollIndex = {
				"_id": model_type_el_coll._userItemId,
				indexDefs: [
					{
						key: { "id": 1 },
						options: {
							name: "typeElemsCol_id",
							default_language: "english"
						}
					},
					{
						key: { "source_id": 1 },
						options: {
							name: "typeElemsCol_source_id",
							default_language: "english"
						}
					}
				]
			}
			console.log(`Create or recreate index, orch_run_id: ${this.params.orchRunId}`);

			await Promise.all([
				await IafScriptEngine.createOrRecreateIndex(elemCollIndex, this.ctx),
				await IafScriptEngine.createOrRecreateIndex(typeElemCollIndex, this.ctx)
			])

			resolve(true)
		}catch(error) {
			console.log(`Error at createBIMCollections, orch_run_id: ${this.params.orchRunId}`)
			console.error(error)

			reject(error)
		}
	})
}

async #extractBimpk (fileName, bimBatch, newOccurrence) {
	return new Promise(async (resolve, reject) => {
		try {
			console.log(`Executing extract Bimpk function, orch_run_id: ${this.params.orchRunId}`);
			const { IafScriptEngine } = this.libraries;

			// Extract data 
			const objects = []
			let types = []

			for(const obj of bimBatch.objects) {
				objects.push({
					"package_id": obj.id,
					"type_id": obj.type,
					"relationships": obj.relationships,
					"source_id": obj.sourceId,
					"properties": obj.properties,
					"source_filename": fileName 
				})
			}

			if(newOccurrence) {
				this.#propMap = new Map()
				bimBatch.properties.forEach(prop => this.#propMap.set(prop.id, prop))

				this.#typeMap = new Map()

				console.log(`New occurrence file detected, orch_run_id: ${this.params.orchRunId}`)
				for(const { id, name, sourceId, properties } of bimBatch.types) {
					types.push({ id, name, "source_id": sourceId, properties })
				}

				console.log(`About to process type extraction, typesLen: ${types?.length}, orch_run_id: ${this.params.orchRunId}`)

				for (let type of types) {
					for (let prop of type.properties) {
						//const _myProp = bimBatch.properties.find(x => x.id == prop.id);
						const _myProp = this.#propMap.get(prop.id)

						prop.dName = _myProp.dName;
						if (_myProp.hasOwnProperty("Asset Category")) {
							prop.baType = _myProp["Asset Category"]
						}
					}

					type._id = await IafScriptEngine.newID("mongo", { "format": "hex" });
					//console.log(JSON.stringify({"message":"Received new ID from mongo: type._id: " + type?._id}));

					type.properties = this.#groupBy(type.properties, "dName");
					
					if (this.#assetTypeMap && type.properties.hasOwnProperty("Revit Family") && type.properties.hasOwnProperty("Revit Type")) {
						const _myRow = this.#assetTypeMap.find(x => x["Revit Family"] == type.properties["Revit Family"].val && x["Revit Type"] == type.properties["Revit Type"].val);
						
						if (_myRow) {
							type.dtCategory = _myRow.dtCategory;
							type.dtType = _myRow.dtType;
						}
					}

					this.#typeMap.set(type.id, type)
				}
	
				console.log(`Type Extraction is complete, orch_run_id: ${this.params.orchRunId}`);
			}else {
				console.log(`Old occurrence file detected. Using existing manage_type_els, orch_run_id: ${this.params.orchRunId}`)

				types = await IafScriptEngine.getVar("manage_type_els")
			}

			
			let _myProperties = [];
			console.log(`About to process objects, objectsLen: ${objects?.length}`);
			
			// do the same for properties in the object
			for (let obj of objects) {
				obj._id = await IafScriptEngine.newID("mongo", { "format": "hex" });

				//const _myVal = types.find(x => x.id == obj.type_id);
				
				const _myVal = this.#typeMap.get(obj.type_id)

				obj.dtCategory = _myVal.dtCategory;
				obj.dtType = _myVal.dtType;

				if (_myVal.hasOwnProperty("baType")) {
					obj.baType = _myVal.baType;
				}

				if (_myVal.hasOwnProperty("properties")) {

					if (_myVal.properties.hasOwnProperty("Revit Family")) {
						obj.revitFamily = _myVal.properties['Revit Family'];
					}
					
					if (_myVal.properties.hasOwnProperty("Revit Type")) {
						obj.revitType = _myVal.properties['Revit Type'];
					}

					if (_myVal.properties.hasOwnProperty("Revit Category")) {
						obj.revitCategory = _myVal.properties['Revit Category'];
					}

				}

				if(obj.properties?.length > 0) {
					obj.properties.forEach(prop => {
						//let _myProp = bimBatch.properties.find(x => x.id == prop.id);
						const _myProp = this.#propMap.get(prop.id)

						prop.dName = _myProp.dName;
					});

					obj.properties = this.#groupBy(obj.properties, "dName");
				}else {
					obj.properties = {}
				}
				_myProperties.push({ _id: obj._id, properties: obj.properties })

				delete obj.properties
			};

			console.log(`Property Extraction is complete, orch_run_id: ${this.params.orchRunId}`);
			const setVars = [
				IafScriptEngine.setVar("properties", _myProperties),
				IafScriptEngine.setVar("manage_els", objects)
			]

			if(newOccurrence){
				setVars.push(IafScriptEngine.setVar("manage_type_els", types))
			}
			await Promise.all(setVars)
			await IafScriptEngine.setVar(
				"manage_el_to_type_relations",
				this.#mapItemsAsRelated(objects, types, 'type_id', 'id')
			)

			resolve(true)
		} catch (err) {
			console.log(`Error at extractBimpk, orch_run_id: ${this.params.orchRunId}`)
			console.error(err)

			reject(err)
		}
	})
}

async #createRelatedItemsAndRelationships (newOccurrence, _colls) {
	return new Promise(async (resolve, reject) => {
		try {
			const { IafScriptEngine } = this.libraries

			console.log(`Creating Model Relations and Related Items, orch_run_id: ${this.params.orchRunId}`);
			const getVarCalls = [
				await IafScriptEngine.getVar("manage_els"),
				await IafScriptEngine.getVar("properties"),
				await IafScriptEngine.getVar("manage_el_to_type_relations")
			]
			if(newOccurrence) {
				getVarCalls.push(await IafScriptEngine.getVar("manage_type_els"))
			}
			const [ manage_els, properties, relations, manage_type_els ] = await Promise.all(getVarCalls)
			
			const callList = [
				IafScriptEngine.createItemsBulk({
					"_userItemId": _colls.model_els_coll._userItemId,
					"_namespaces": this.ctx._namespaces,
					"items": manage_els
				}, this.ctx)
			]
			console.log(`Create Related Collection manage_els, orch_run_id: ${this.params.orchRunId}`);

			if(newOccurrence) {
				callList.push(
					IafScriptEngine.createItemsBulk({
						"_userItemId": _colls.model_type_el_coll._userItemId,
						"_namespaces": this.ctx._namespaces,
						"items": manage_type_els
					}, this.ctx)
				)
				console.log(`Create Related Collection manage_type_els, orch_run_id: ${this.params.orchRunId}`);
			}

			await Promise.all(callList)

			console.log(`Create Related Collection properties, orch_run_id: ${this.params.orchRunId}`);
			console.log(`Create Related Collection Relations, relations: ${relations?.length} orch_run_id: ${this.params.orchRunId}`);
			
			await Promise.all([
				IafScriptEngine.createItemsAsRelatedBulk({
					"parentUserItemId": _colls.model_els_coll._userItemId,
					"_userItemId": _colls.model_els_props_coll._userItemId,
					"_namespaces": this.ctx._namespaces,
					"items": properties
				}, this.ctx),

				IafScriptEngine.createRelations({
					"parentUserItemId": _colls.model_els_coll._userItemId,
					"_userItemId": _colls.model_type_el_coll._userItemId,
					"_namespaces": this.ctx._namespaces,
					relations
				}, this.ctx)
			])
			
			resolve(true); 
		} catch (error) {
			console.log(`Error at createRelatedItemsAndRelationships, orch_run_id: ${this.params.orchRunId}`)
			console.error(error)

			reject(error)        
		}
	})      
}

#groupBy(objectArray, property) {
	return objectArray.reduce((acc, obj) => {
		let key = obj[property];

		key = key.replace(/[\.]+/g, "");
		if (!acc[key]) {
			acc[key] = {};
		}
		// Add object to list for given key's value
		acc[key] = obj;

		return acc;
	}, {});
}

#mapItemsAsRelated (parentItems, relatedItems, fromField, relatedField) {
	let res = [];

	for (let i = 0, l = parentItems.length; i < l; i++) {
		let relatedRecs = [];
		let parentItem = parentItems[i];
		let fromValues = [];

		if (!(parentItem[fromField]) && fromField.indexOf(".") > 1) {
			fromValues = fromField.split(".").reduce((o, i) => o[i] || [], parentItem);
		} else {
			fromValues = Array.isArray(parentItem[fromField]) ? parentItem[fromField] : [parentItem[fromField]];
		}

		if (fromValues && fromValues.length > 0)
			relatedRecs = relatedItems.filter(r => fromValues.includes(r[relatedField]));

		if (relatedRecs.length > 0) {
			res.push({
				parentItem: parentItems[i],
				relatedItems: relatedRecs
			});
		}
	}
	console.log('mapItemsAsRelated length ', res?.length)
	return res;
}
}

class SgpkImport {
constructor(params, libraries, ctx) {
	this.params = params
			this.libraries = libraries
	this.ctx = ctx
}

initialize() {
	return new Promise(async (resolve, reject) => {
		try {
			console.log(`Sgpk import begins, orch_run_id: ${this.params.orchRunId}`)
			const { IafScriptEngine, ModelFileReader, } = this.libraries
			const param = { 
				...this.params.actualParams, 
				filename: this.params.filename,
				orchRunId: this.params.orchRunId,
				ext: this.params.ext
			}

			// set global variables first
			await IafScriptEngine.setVar("namespaces", this.ctx._namespaces);
			await IafScriptEngine.setVar("package_name", param.filename);
			await IafScriptEngine.setVar("package_name_short", param.filename.substring(0, 11));

			const bim_model = await IafScriptEngine.getCompositeCollection(
				{
					"_userType": "bim_model_version",
					"_versions._userAttributes.sgpk.fileId": param._fileId
				},
				ctx,
				{}
			);

			if (bim_model) {
				await IafScriptEngine.setVar("bim_model", bim_model);

				await this.#createBIMCollectionVersion();
			} else {
				await this.#createBIMCollections();
			}

			const { bimFilePath, manifest } = await ModelFileReader.downloadAndUnzipModelFile(param, ctx)
			const result = await IafScriptEngine.getVar("outparams")

			result.bimFilePath = bimFilePath
			result.manifest = manifest
			result.filename = param.filename
			result._fileId = param._fileId
			result._fileVersionId = param._fileVersionId
			
			resolve(result)
		} catch (error) {
			console.error(`Error at importSgpk, orch_run_id: ${orchRunId}`, error)

			reject(error)
		}
	})
}

async #createBIMCollections() {
	return new Promise(async (resolve, reject) => {
		try {
			const { IafScriptEngine } = this.libraries
			
			console.log(`Creating Model Collections, orch_run_id: ${this.params.orchRunId}`)

			const packagename = await IafScriptEngine.getVar("package_name")
			const packagenameShort = await IafScriptEngine.getVar("package_name_short")
			
			//create Geometry File Collection
			const geometryFilesCol = {
				_name: packagename + '_geom_file',
				_shortName: packagenameShort + '_geom_file',
				_description: 'File Collection for Geometry Files',
				_userType: 'bim_model_geomresources',
				_namespaces: this.ctx._namespaces
			}

			console.log(`Create BIM Collection - Geometry File Collection, orch_run_id: ${this.params.orchRunId}`)
			const model_geom_file_coll = await IafScriptEngine.createCollection(geometryFilesCol, this.ctx)
			
			//create Geometry View Collection
			const geometryViewsCol = {
				_name: packagename + '_geom_view',
				_shortName: packagenameShort + '_geom_view',
				_description: 'Geometry Views in Model',
				_userType: 'bim_model_geomviews',
				_namespaces: this.ctx._namespaces
			}

			console.log(`Create BIM Collection - Geometry View Collection, orch_run_id: ${this.params.orchRunId}`)
			const model_geom_views_coll = await IafScriptEngine.createCollection(geometryViewsCol, this.ctx)
			
			//create Model Composite Item
			const modelCompItem = {
				_name: packagename,
				_shortName: packagenameShort + '_modelver',
				_description: 'BIM model version by transform',
				_userType: 'bim_model_version',
				_namespaces: this.ctx._namespaces
			}
			const bim_model = await IafScriptEngine.createNamedCompositeItem(modelCompItem, this.ctx)

			await IafScriptEngine.setVar("bim_model", bim_model)

			const _myCollections = { 
				model_geom_file_coll, 
				model_geom_views_coll 
			};

			await this.#addRelatedCollections(_myCollections)

			resolve(true)       
		} catch (error) {
			console.error(`Error at createBIMCollections, orch_run_id: ${this.params.orchRunId}`, error)
			
			reject(error)
		}
	})
}

async #createBIMCollectionVersion() {
	return new Promise(async (resolve, reject) => {
		try {
			const { IafScriptEngine } = this.libraries
			console.log(`Found Previous Model Creating Versions, orch_run_id: ${this.params.orchRunId}`)

			const { _id: bim_model_id } = await IafScriptEngine.getVar("bim_model")
			const modelRelatedCollection = await IafScriptEngine.getCollectionsInComposite(
				bim_model_id,
				null, 
				this.ctx
			)
			
			console.log(`Create BIM Collection Version - bim_model, orch_run_id: ${this.params.orchRunId}`)
			await IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": bim_model_id }, this.ctx)

			const model_geom_file_coll = modelRelatedCollection.find(x => x._userType === 'bim_model_geomresources')
			const model_geom_views_coll = modelRelatedCollection.find(x => x._userType === 'bim_model_geomviews')
			
			console.log(`Create BIM Collection Version model_geom_file_coll, orch_run_id: ${this.params.orchRunId}`)
			await IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_geom_file_coll._userItemId }, this.ctx)
			
			console.log(`Create BIM Collection Version model_geom_views_coll, orch_run_id: ${this.params.orchRunId}`)
			await IafScriptEngine.createNamedUserItemVersion({ "namedUserItemId": model_geom_views_coll._userItemId }, this.ctx)
			
			const _myCollections = {
				model_geom_file_coll,
				model_geom_views_coll
			}

			this.#addRelatedCollections(_myCollections)

			resolve(true)
		}catch(error) {
			console.error(`Error at createBIMCollectionVersion, orch_run_id: ${orchRunId}`, error)
			
			reject(error)
		}
	})
}

async #addRelatedCollections (_colls) {
	return new Promise(async (resolve, reject) => {
		try {
			const { IafScriptEngine } = this.libraries

			console.log(`Creating Model Relations and Related Items, orch_run_id: ${this.params.orchRunId}`)
			const { _id: bim_model_id } = await IafScriptEngine.getVar("bim_model")

			await IafScriptEngine.addRelatedCollections({
				namedCompositeItemId: bim_model_id,
				relatedCollections: [
					_colls.model_geom_file_coll._userItemId,
					_colls.model_geom_views_coll._userItemId
				]
			}, ctx)

			await IafScriptEngine.setVar(
				'outparams',
				{
					filecolid: _colls.model_geom_file_coll._userItemId,
					viewcolid: _colls.model_geom_views_coll._userItemId,
					compositeitemid: bim_model_id
				}
			)

			resolve(true)
		} catch (error) {
			console.error(`Error at addRelatedCollections, orch_run_id: ${this.params.orchRunId}`, error)
			
			reject(error)
		}
	})
}

}

class Helper {
constructor(params, libraries) {
	this.params = params
			this.libraries = libraries
}

async getFileMetaData(fileId) {
	return new Promise(async (resolve, reject) => {
		try {
			if(!fileId) throw new Error('_fileId is mandatory')

			const { PlatformApi } = this.libraries
			const { _name } = await PlatformApi.IafFileSvc.getFile(fileId, this.params.context) || {};

			if (!_name) {
				throw new Error(`Couldn't retrieve file information for _fileId: ${fileId}`);
			}
			const fileMeta = {
				filename : _name.slice(0, _name.lastIndexOf('.')),
				ext: _name.split('.')?.pop(),
			}

			resolve(fileMeta)
		} catch (error) {
			console.log(`Error at getFileMetaData method, orch_run_id: ${this.params.orchRunId}`, error)

			reject(error)
		}
	})
}
}

class SczImport {
constructor(params, libraries, ctx) {
	this.params = params
			this.libraries = libraries
			this.ctx = ctx
}

async intialize() {
	return new Promise(async (resolve, reject) => {
		try {
			const resources = await this.#processScz()
			
			await this.#updateViewableResources(resources)

			resolve(true)
		} catch (err) {
			reject(err)
		}
	})
}

	async #processScz() {
			return new Promise(async (resolve, reject) => {
		try {
							console.log(`Executing processScz method in SczTarget, orch_run_id: ${this.params.orchRunId}`)
							let viewItems = []
							viewItems = await this.#processGraphics()

							let viewItems2d = []
							viewItems2d = await this.#processGraphics2d()

							viewItems = viewItems.concat(viewItems2d)

							resolve(viewItems)
					}catch(error) {
							reject(error)
					}
			})
}

	async #processGraphics() {
			return new Promise(async (resolve, reject) => {
					try {
							console.log(`Executing processGraphics method in SczTarget, orch_run_id: ${this.params.orchRunId}`)
							const { manifest } = this.params.result
							const { files: manifestFiles, occurrences } = manifest
							let folderName
							let viewItems = []

							for (const maniFile of manifestFiles) {
									const layers = maniFile.layers;
									// find occurances
									const occs = occurrences.filter(d => d.source === maniFile.id)
									const graphicsFileTitle = this.#removeFileExtension(maniFile.name);

									for (const occ of occs) {
											const graphicsFilePath = occ.data.graphics;
											const graphics2dFilePath = occ.data.graphics2d;
											const modelBounding = occ.modelBounding;
											// folderName = 'geometryData_' + params.context.id + "_" + occ.id;

											const viewItemsOcc = await this.#addViewItems(
													graphicsFilePath, 
													graphics2dFilePath,
													folderName,
													graphicsFileTitle,
													layers,
													modelBounding
											);

											viewItems = viewItems.concat(viewItemsOcc);
									}
									//maniFile.occurences = occs
							}

							resolve(viewItems)
					} catch (error) {
							reject(error)
					}
			})
}

	async #addViewItems(graphicsFilePath, graphics2dFilePath, folderName, graphicsFileTitle, layers, modelBounding) {
			return new Promise(async (resolve, reject) => {
					try {
							const { PlatformApi } = this.libraries
							let folder
							let viewItems = []

							if (graphicsFilePath || graphics2dFilePath) {
									folderName = 'geometryData_' + this.params.context.id
									folder = await PlatformApi.IafFileSvc.addFolder(folderName, this.params.context._namespaces[0], undefined, this.params.context)

									await this.#updateFileDetailsInModel(folder._id)
							}

							if(graphicsFilePath) {
									const viewItems3d = await this.#process3D(
											graphicsFilePath,
											folder,
											graphicsFileTitle,
											layers,
											modelBounding
									)

									if (viewItems3d && viewItems3d.length > 0) {
											viewItems = viewItems.concat(viewItems3d)
									}
							}

							if(graphics2dFilePath) {
									const viewItems2d = await this.#process2D(graphics2dFilePath, folder, graphicsFileTitle)

									if (viewItems2d && viewItems2d.length > 0) {
											viewItems = viewItems.concat(viewItems2d)
									}
							}

							resolve(viewItems)
					} catch (error) {
			console.error(error)
							reject(error)
					}
			})
}

	async #processGraphics2d() {
	return new Promise(async (resolve, reject) => {
		try {
			console.log(`Executing processGraphics2d method, orch_run_id: ${this.params.orchRunId}`)
			const { view2ds } = this.params.result.manifest

			if (!view2ds) {
				console.warn (`In processGraphics2d, view2ds is found empty, skipping, orch_run_id: ${this.params.orchRunId}`);
				return resolve([])
			}
			let folderName
			let viewItems = []

			for (const { name: graphicsFileTitle, graphics2d: graphics2dFilePath } of view2ds) {
				const viewItemsOcc = await this.#addViewItems2d(graphics2dFilePath, folderName, graphicsFileTitle);

				viewItems = viewItems.concat(viewItemsOcc);
			}

			resolve(viewItems)
		} catch (error) {
			reject(error)	
		}
	})
}

async #addViewItems2d(graphics2dFilePath, folderName, graphicsFileTitle) {
	return new Promise(async (resolve, reject) => {
		try {
			const { PlatformApi } = this.libraries
			let folder
			let viewItems = []

			if (graphics2dFilePath) {
				folderName = 'geometryData_' + this.params.context.id
				folder = await PlatformApi.IafFileSvc.addFolder(
					folderName,
					this.params.context._namespaces[0],
					undefined,
					this.params.context
				)
				await this.#updateFileDetailsInModel(folder._id)
			}

			if(graphics2dFilePath) {
				const viewItems2d = await this.#process2DChopped(graphics2dFilePath, folder, graphicsFileTitle)

				if (viewItems2d && viewItems2d.length > 0) {
					viewItems = viewItems.concat(viewItems2d)
				}
			}

			resolve(viewItems)
		} catch (error) {
			reject(error)	
		}
	})
}	

async #process2D(graphics2dFilePath, folder, title) {
			return new Promise(async (resolve, reject) => {
					try {
				console.log(`Executing process2D method, orch_run_id: ${this.params.orchRunId}`);
							if (!graphics2dFilePath) return resolve([])

			const { ModelFileReader } = this.libraries
							//Upload Scz
							const filePath = this.params.result.bimFilePath + '/' + graphics2dFilePath;
							const filename = this.params.result.filename + '_2d.scz'
							const opts = { filename }
							const tags = ['#invgraphicsfile#']

							const uploadParams = { filePath, opts, tags, folder, context: this.params.context }
			const uploadRes = await ModelFileReader.uploadLargeFile(uploadParams)
			let sczFileItem = {}

			if(uploadRes?.isFileuploaded) {
				await this.#cacheFile(uploadRes.file?._id)
				sczFileItem = await this.#createFileItem(uploadRes.file);
			}
			let viewItems = [];
			//Upload mapping file
			const hoops_node_mapping_file = 'hoops_node_mapping2d.json';
			const mappingFilePath = this.#updatePath(filePath, hoops_node_mapping_file)
			const mapFileUploadParams = { filePath: mappingFilePath, opts: { filename: hoops_node_mapping_file }, tags: [], folder, readFile: true, context: this.params.context }
			const mappingFile = await ModelFileReader.uploadLargeFile(mapFileUploadParams);
			
			if(mappingFile?.isFileuploaded) {
				const mappingFileItem = await this.#createFileItem(mappingFile.file)
				const mapping2D = JSON.parse(mappingFile.rawFile)

				Object.keys(mapping2D).forEach(key => {
					viewItems.push({
						title: key,
						aspect: 'View2d',
						viewableResources: [sczFileItem._id],
						resources: [mappingFileItem._id]
					})
				})
			}

			resolve(viewItems)
					} catch (error) {
							console.log(`Error at process2D method, orch_run_id: ${this.params.orchRunId}`, error)

			reject(error)
					}
			})
}

async #process2DChopped(graphicsFilePath, folder, title) {
			return new Promise(async(resolve, reject) => {
					try {
							console.log(`Executing process2DChopped method arguments, orch_run_id: ${this.params.orchRunId}`);
							const { path, ModelFileReader } = this.libraries
							let viewItem = {
									title: title ? title : '2dGraphics',
									aspect: 'View2d'
							}
							// Upload Scz
							const filePath = this.params.result.bimFilePath + '/' + graphicsFilePath
							const filePathParts = graphicsFilePath.split('/');
							const filename = this.params.result.filename + '_' + filePathParts[1] + '.scz';
							const opts = { filename }
							const tags = ['#invgraphicsfile#']

							const uploadParams = { filePath, opts, tags, folder, context: this.params.context }
							const uploadRes = await ModelFileReader.uploadLargeFile(uploadParams)
							let sczFileItem = {}

							if(uploadRes?.isFileuploaded) {
									await this.#cacheFile(uploadRes.file?._id)
									sczFileItem = await this.#createFileItem(uploadRes.file);
									viewItem.viewableResources = [sczFileItem._id]
							}
							//const dir = path.dirname(filePath)
							const hoops_node_mapping_file = 'hoops_node_mapping2d.json'
							//const mappingFilePath = dir + '/' + hoops_node_mapping_file

							const mappingFilePath = this.#updatePath(filePath, hoops_node_mapping_file)
							const mapFileUploadParams = { filePath: mappingFilePath, opts: { filename: hoops_node_mapping_file }, tags: [], folder, context: this.params.context }
							const mappingFile = await ModelFileReader.uploadLargeFile(mapFileUploadParams);
							
							if(mappingFile?.isFileuploaded) {
									const mappingFileItem = await this.#createFileItem(mappingFile.file)

									viewItem.resources = [mappingFileItem._id]
							}

							resolve([viewItem])
					} catch (error) {
							reject(error)
					}
			})
}

async #process3D(graphicsFilePath, folder, title, layers, modelBounding) {
			return new Promise(async(resolve, reject) => {
					try {
							  console.log(`Executing process3D method, orch_run_id: ${this.params.orchRunId}`)
							const { path, ModelFileReader } = this.libraries
							let viewItem = {
									title: title ? title : '3dGraphics',
									aspect: 'View3d'
							}
							//Upload Scz
							const filePath = this.params.result.bimFilePath + '/' + graphicsFilePath;
							const filePathParts = graphicsFilePath.split('/');
							const filename = this.params.result.filename + '_' + filePathParts[1] + '.scz';
							const opts = { filename }
							const tags = ['#invgraphicsfile#']

							//Scz file upload
							const uploadParams = { filePath, opts, tags, folder, context: this.params.context }
							const uploadRes = await ModelFileReader.uploadLargeFile(uploadParams)
							
							if(uploadRes?.isFileuploaded) {
									await this.#cacheFile(uploadRes.file?._id)
									const sczFileItem = await this.#createFileItem(uploadRes.file);

									viewItem.viewableResources = [sczFileItem._id];
									layers && (viewItem.layers = layers);
									modelBounding && (viewItem.modelBounding = modelBounding);
							}

			//Upload mapping file
							const hoops_node_mapping_file = 'hoops_node_mapping.json';
							const mappingFilePath = this.#updatePath(filePath, hoops_node_mapping_file)
							const mapFileUploadParams = { filePath: mappingFilePath, opts: { filename: hoops_node_mapping_file }, tags: [], folder, context: this.params.context }
							
			const mapFile = await ModelFileReader.uploadLargeFile(mapFileUploadParams);

							if(mapFile?.isFileuploaded) {
									const mappingFileItem = await this.#createFileItem(mapFile.file);

									viewItem.resources = [mappingFileItem._id];
							}
							
							resolve([viewItem]);
					} catch (error) {
							reject(error)
					}
			})
}


async #updateViewableResources(viewItems) {
			return new Promise(async(resolve, reject) => {
					try {
							console.log(`Executing updateViewableResources method, orch_run_id: ${this.params.orchRunId}`);
							console.log(`viewItems count: ${viewItems?.length}`)
							if (!viewItems || viewItems.length <= 0) return resolve(true)

							const { PlatformApi } = this.libraries

							for (let viewItem of viewItems) {
									let resViewItem = await PlatformApi.IafItemSvc.createRelatedItems(this.params.result.viewcolid, [viewItem], this.params.context)

									resViewItem = resViewItem?._list[0]
									let relationShips = []
									let relatedToIds = viewItem.viewableResources ? viewItem.viewableResources : []

									relatedToIds = relatedToIds
											? relatedToIds.concat(
													viewItem.resources ? viewItem.resources : []
											)
											: []
									if (relatedToIds.length > 0) {
											const relations = {
													_relatedFromId: resViewItem._id,
													_relatedUserItemId: this.params.result.filecolid,
													_relatedToIds: relatedToIds
											}

											relationShips.push(relations)
											await PlatformApi.IafItemSvc.addRelationsBulk(this.params.result.viewcolid, relationShips, this.params.context)
									}
							}

							resolve(true)
					} catch (error) {
							reject(error)
					}
			})
}

async #updateFileDetailsInModel(folderId) {
	return new Promise(async(resolve, reject) => {
		try {
			console.log(`Executing updateFileDetailsInModel method, orch_run_id: ${this.params.orchRunId}`);
			const { _, ModelFileReader, PlatformApi } = this.libraries
			//let userAttributes = {}
			let thumbnailPath = _.get(
				_.find(this.params.result.manifest.occurrences, oc => oc.data),
				'data.thumbnail'
			) || 'thumbnail.png';

			thumbnailPath = this.params.result.bimFilePath + '/' + thumbnailPath
			const uploadParams = {
				filePath: thumbnailPath,
				_namespaces: this.params.context._namespaces[0], 
				folderId,
				tags: undefined,
				ctx: this.params.context,
				opts: {}
			}
			const fileUpload = await ModelFileReader.uploadSmallFile(uploadParams)

			if (fileUpload?.isFileuploaded) {
				const { fileInfo } = fileUpload
				const userAttributes = {
					thumbnail: {
						fileId: fileInfo[0]._id,
						fileVersionId: fileInfo[0]._tipId
					},
					[this.params.ext]: {
						fileId: this.params.result._fileId,
						fileVersionId: this.params.result._fileVersionId
					}
				};

				const compItem = await PlatformApi.IafItemSvc.getNamedUserItem(this.params.result.compositeitemid, this.params.context);
				const version = compItem._versions[0];
				
				if (version.hasOwnProperty('_userAttributes')) {
					Object.assign(version._userAttributes, userAttributes);
				}else {
					version._userAttributes = userAttributes;
				}
				
				await PlatformApi.IafItemSvc.updateNamedUserItemVersion(compItem._id, version._id, version, this.params.context);
			}

			resolve(true)
		} catch (error) {
			console.log(`Error at updateFileDetailsInModel method, orch_run_id: ${this.params.orchRunId}`, error)

			reject(error)
		}
	})
}

	async #cacheFile(_fileId) {
	return new Promise(async (resolve, reject) => {
		try {
				const { PlatformApi } = this.libraries

			await PlatformApi.IafGraphicsSvc.cacheGraphicsFiles([{ _fileId }], this.params.context)
			console.log(`Successfully cached file_id: ${_fileId} in graphics service, orch_run_id: ${this.params.orchRunId}`)

			resolve(true)
		} catch (error) {
			reject(error)
		}
	})
}

	async #createFileItem(fileObj) {
	return new Promise(async (resolve, reject) => {
		try {
				const { PlatformApi } = this.libraries
			const fileAttr = {
				_fileId: fileObj._id,
				_fileVersionId: fileObj._tipId,
				filename: fileObj._name
			};
			
			const { _list = [] } = await PlatformApi.IafItemSvc.createRelatedItems(this.params.result.filecolid, [fileAttr], this.params.context) || {};
			
			resolve(_list[0])
		} catch (error) {
			console.log(`Error at createFileItem method, orch_run_id: ${this.params.orchRunId}`, error)

			reject(error)
		}
	})
}

	#updatePath(filePath, fileName) {
	try {
		let splitPaths = filePath.split('/')

		splitPaths[splitPaths.length - 1] = fileName
		const modifiedFilePath = splitPaths.join('/')

		return modifiedFilePath
	} catch (error) {
		console.log(`Error at #updatePath, orch_run_id: ${this.params.orchRunId}`, error)
		
		throw error
	}
		
}

	#removeFileExtension (fileName) {
	const split = fileName.split('.');
	const extension = split.pop();
	const exists = extension && (extension.length === 3);

	return exists ? split.join(".") : fileName;
}
}

async function importModel(params, libraries, ctx) {
return new Promise(async (resolve, reject) => {
	try {
		console.log(`Executing importModel method, orch_run_id: ${params.orchRunId}`)
		console.time(`${params.orchRunId}: validation`)
		const helper = new Helper(params, libraries)
		const { filename, ext } = await helper.getFileMetaData(params?.actualParams?._fileId)

		params.filename = filename
		params.ext = ext?.toLowerCase()

		const validateInput = new InputValidation(params, libraries, ctx)
		await validateInput.validate()
		console.timeEnd(`${params.orchRunId}: validation`)
		
		let result = {}

		if(params.ext == 'bimpk') {
			console.time(`${params.orchRunId}: BimpkImport`)
			const bimpkImport = new BimpkImport(params, libraries, ctx)

			result = await bimpkImport.initialize()
			console.timeEnd(`${params.orchRunId}: BimpkImport`)
		}else {
			const sgpkImport = new SgpkImport(params, libraries, ctx)
			result = await sgpkImport.initialize()
		}

		params.result = result

		console.time(`${params.orchRunId}: SczImport`)
		const sczImport = new SczImport(params, libraries, ctx)
		await sczImport.intialize()
		console.timeEnd(`${params.orchRunId}: SczImport`)
		
		const res = {
			filecolid: result.filecolid,
			viewcolid: result.viewcolid,
			compositeitemid: result.compositeitemid
		}
		if(result.myCollections) {
			res.myCollections = result.myCollections
		}
		console.log(`Model import is complete, ${params.orchRunId}`)

		resolve(res)
	}catch(error) {
		reject(error)
	}
})
}

const cacheSourceFileGraphicsIds = async (params, libraries, ctx)=> {
	return new Promise(async (resolve, reject)=> {
			try{
					const { IafScriptEngine} = libraries;
					const { model_els_coll, data_cache_coll } = params.inparams.myCollections

					console.log('--> cache elems: ' + model_els_coll._name)
					console.log('--> cache data: ' + data_cache_coll._name)

					const { _list: sourcefileList = [] } = await IafScriptEngine.getDistinct({
							collectionDesc: { _userType: model_els_coll._userType, _userItemId: model_els_coll._userItemId },
							field: 'source_filename',
							options: { getCollInfo: true }
					}, ctx) || {}
					const sourcefileNames = sourcefileList[0]?._versions[0]?._relatedItems?.source_filename
					let cacheDataItems = []

					for (let i = 0; i < sourcefileNames.length; i++) {
							const { _list: packageIdList = [] } = await IafScriptEngine.getDistinct({
									collectionDesc: { _userType: model_els_coll._userType, _userItemId: model_els_coll._userItemId },
									query: { source_filename: sourcefileNames[i] },
									field: 'package_id',
									options: { getCollInfo: true }
							}, ctx) || {}

							cacheDataItems.push({
									dataType: 'sourcefileToPkgIds',
									data: {
											source_filename: sourcefileNames[i],
											package_id: packageIdList[0]?._versions[0]?._relatedItems?.package_id
									}
							})
					}
					const bim_els = await IafScriptEngine.createItemsBulk({
							"_userItemId": data_cache_coll._userItemId,
							"_namespaces": ctx._namespaces,
							"items": cacheDataItems
					}, ctx);

					await IafScriptEngine.setVar("outparams", { cacheDataItems: bim_els })

					console.log("Create Cache Data: source filenames to package_ids");

					resolve(true)
			} catch (err) {
					console.log('Error at cacheSourceFileGraphicsIds')
					console.error(err)

					reject(err)
			}
	})
}

async function createModelDataCache(params, libraries, ctx) {
return new Promise(async (resolve, reject) => {
	try {
		const { IafScriptEngine } = libraries;
		
		await cacheSourceFileGraphicsIds(params, libraries, ctx)
		const outParams = await IafScriptEngine.getVar("outparams");

		resolve(outParams)
	} catch (error) {
		console.log('Error at createModelDataCache')
		console.error(error)

		reject(error)
	}
})
}