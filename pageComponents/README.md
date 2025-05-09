# pageComponents Overview

The pageComponents folder contains a number of drag, drop, and configure React pages that you can easily add to your own Twinit ipa-core web clients. Be sure to read the README for each component for details on how to implement the page and use it.

The available pageComponents vary in complexity from simple (intended to make it easy to learn a specific component or workflow), to more complex combining different concepts and workflows.

All of the pageComponents are free to be used in your own applications. You can also use them as a starting point and modify for own applications needs.

## pageComponent Types

### Document Viewer

* [simpleDocViewer](./simpleDocViewer/README.md) : A simple implementation of the document viewer that allows you to upload files, download files, and view files in the browser via a static page control
* [floatingDocViewer](./floatingDocViewer/README.md) : A simple implementation of the document viewer that allows you to upload files, download files, and view files in floating, draggable, and resizable component

### 3D/2D Model Import

* [modelImport](./modelImport/README.md) : A page that allows you to view the versions of .bimpk model files uploaded to the project's file service. It also allows you to import the latest version of the .bimpks into Twinit for use with the Item Service, Graphics Service, and the Twinit 3D/2D model viewer React component. Be sure to see the pageComponent readme for information on the required datasource orchestrator that must also be created for this pageComponent to function.

### 3D/2D Model Viewing and Interaction

These pageComponents all spotlight implementing the [Twinit IafViewerDBM component](https://twinit.dev/docs/apis/viewer/overview). Each pageComponent illustrates implementing a specific feature of the viewer.

* [simpleViewer](./simpleViewer/README.md) : A simple iafViewerDBM implementation of the  to view 3D/2D models. It also includes the logic to handle user selections in the model geometry to find and display the model properties for he selected geometry.
* [simpleViewerSavedViews](./simpleViewerSavedViews/README.md) : A simple implementation of the iafViewerDBM demonstrating how to interact with the viewer's camera to save and set views.
* [simpleViewerSpaces](./simpleViewerSpaces/) : A simple implementation of the iafViewerDBM demonstrating how to display and interact with spaces in the viewer.
* [simpleViewerThemes](./simpleViewerThemes/README.md) : A simple implementation of the iafViewerDBM demonstrating how to theme elements in the viewer with different colors.
* [simpleViewerVisibility](./simpleViewerVisibility/README.md) : A simple implementation of the iafViewerDBM demonstrating how to slice elements in the model to isolate them n context against the rest of the model elements, as well as how to completely hide elements from the view.
* [simpleViewerSpacesMarkup](./simpleViewerSpacesMarkup/README.md) : A simple implementation of the IafViewer demonstrating how to programmatically draw markup in the 3D view. The example case is drawing a temperature markup at the geometric center of building spaces.

### Complex pageComponents

These pageComponents combine multiple of the examples above to achieve a given use case, capability, or workflow. They may require more configuration or setup than the simple pageComponents.

* [modelDocViewer](./modelDocViewer/README.md) : This pageComponent combines the capabilities found in simplerViewer, simpleViewerVisibility, and floatingDocViewer to compose a pageComponent that supports searching and interrogating model elements, uploading and relating files to model elements, and viewing files.

* [modelDocViewerRedux](./modelDocViewerRedux/README.md) : This pageComponent buildings on the ModelDocViewer, introducing Redux state management by elevating all data previously managed by React Context to a Redux Slice.