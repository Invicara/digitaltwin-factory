// version dtf-1.0

let modelImportModule = {

	/*
	 * See the Twinit Academy Self-Led Developer Training Intermediate course to learn more about
	 * the model import orchestrator and the imported model data format.
	*/

	getRunnableScripts() {
		return [
			{ name: 'Create Model Import Orchestrator', script: 'createOrRecreateImportOrchestrator' },
		]
	},

	async createOrRecreateImportOrchestrator(input, libraries, ctx) {
		const { UiUtils, IafScriptEngine, PlatformApi } = libraries

		// Select supporting_files/import_helper.mjs
		let scriptFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: true, accept: ".js" })
		let scriptContents = await UiUtils.IafLocalFile.loadFiles(scriptFiles)

		let scriptItems = [{
			_name: "_orch Model Import Scripts",
			_shortName: "importHelper",
			_description: "Load, Transform and Write Model from BIMPK",
			_userType: "importHelper",
			_namespaces: ctx._namespaces,
			_version: {
				_userData: scriptContents[0]
			}
		}]

		// create the import helper script in the item service which be used by the import orchestrator
		// that we create below
		let createScriptResult = await PlatformApi.IafScripts.create(scriptItems, ctx)

		// look to see if a model import import orcehstrator all ready exists and if so, delete it
		// this will allow us to run this script multiple times if needed to update the orchestrator
		let datasources = await IafScriptEngine.getDatasources({_namespaces: ctx._namespaces}, ctx)
    	let existingImportOrch = datasources.find(d => d._userType === "bimpk_importer")

		if (existingImportOrch) {
			await IafScriptEngine.removeDatasource({orchId: existingImportOrch.id}, ctx)
		}
  
		// create the new import orchestrator config
		const orchestratorConfig = {
			 _name: 'Import BIMPK Models',
			 _description: 'Orchestrator to import model from BIMPK file',
			 _namespaces: ctx._namespaces,
			 _userType: 'bimpk_importer', // _userType we will use to find the orchestrator when we want to run it
			 _schemaversion: '2.0',
			 _params: {
				  tasks: [
						{
							// our import helper script that runs importModel from the script
							// uses the parameter passed to it at runtime
							name: 'default_script_target',
							'_actualparams': {
								'userType': 'importHelper',
								'_scriptName': 'importModel'
							},
							_sequenceno: 1
						},
						{
							// our import helper script again, but this time running createModelDataCache
							name: 'default_script_target',
							'_actualparams': {
								'userType': 'importHelper',
								'_scriptName': 'createModelDataCache'
							},
							_sequenceno: 2
						}
				  ]
			 }
		}
  
		// creates the import orchestrator in the Datasources Service
		let createDatasourceOrchResult =  await PlatformApi.IafDataSource.createOrchestrator(orchestratorConfig, ctx)

		return { createScriptResult, createDatasourceOrchResult }
  	}

}

export default modelImportModule