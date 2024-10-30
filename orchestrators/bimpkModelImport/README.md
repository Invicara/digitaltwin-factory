# bimpk Model Import Orchestrator Setup
version dtf-1.0

The bimpk Model Import Orchestrator Setup can be used to enable bimpk model import in Twinit workspaces and projects.

See the Twinit Academy Self-Led Developer Training Intermediate course to learn more about the model import orchestrator and the imported model data format.

You are free to take these scripts and modify for your own purposes and, as with all digitaltwin-factory content, is available under the [Apache 2.0 License](../../LICENSE).

## Running the Setup Script

1. Open VS Code and sign into your application on Twinit
2. Either open an existing project or workspace or create a new one
3. Create a new script named __Model Import Orch Setup__, choosing your own description, short name, and user type
4. Copy and paste the contents of the __bimpk Model Import Orchestrator Setup.mjs__ into your new script and commit it to Twinit
5. Right click on the new script and select __Run Script__
6. Run __Create Model Import Orchestrator__
7. When prompted to select a file, pick __import_helper.js__
8. When the script has completed it will return the result of creating the import_helper script and the result of creating the bimpk model import orchestrator in your project

You can now upload bimpks to the Twinit File Service via the [Twinit plugins](https://apps.invicara.com/ipaplugins/) or other means such as the [modelImport pageComponent](../../pageComponents/modelImport/README.md)