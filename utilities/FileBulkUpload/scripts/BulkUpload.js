let bulkUpload =  {
    async bulkUploadFileWithAttributes(input, libraries, ctx) {
        let { PlatformApi, IafScriptEngine, UiUtils } = libraries
        const proj = await PlatformApi.IafProj.getCurrent(ctx);
        let iaf_ext_files_coll = await IafScriptEngine.getFileCollection({
            _userType: "file_container",
            _shortName: "Root Container"
        }, ctx)
        const containerObj = await PlatformApi.IafFile.getRootContainer(proj, ctx);
        let xlsxFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".xlsx" });
        let typeWorkbook = await UiUtils.IafDataPlugin.readXLSXFiles(xlsxFiles);
        let wbJSON = UiUtils.IafDataPlugin.workbookToJSON(typeWorkbook[0]);
        let iaf_dt_grid_data = wbJSON["Attribute_List"];
        let data_as_objects = await UiUtils.IafDataPlugin.parseGridData({ gridData: iaf_dt_grid_data });

        let selectedSheetData = {};
        data_as_objects.forEach(function (item) {
            var fileName = item['File Name'];
            for (var key in item) {
                if (item[key] === undefined) {
                    item[key] = '';
                }
            }
            delete item['File Name']
            selectedSheetData[fileName] = item;
        });

        let selectFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: true });
        let missingFiles = [];
        let sucessUploadFiles = [];
        let failerUploadFiles = [];
        let allSucessFiles = []
        const selectFilesName = [];

        const fileUploadPromises = [];

        if (selectFiles.length > 100) {
            console.log('in side more then 100 files :----')

            const chunkSize = 50;


            for (let i = 0; i < selectFiles.length; i += chunkSize) {

                const chunkPromises = [];

                for (let j = i; j < Math.min(i + chunkSize, selectFiles.length); j++) {
                    const fileItem = selectFiles[j];
                    selectFilesName.push(fileItem.name)

                    if (!selectedSheetData.hasOwnProperty(fileItem.name)) {
                        missingFiles.push({ "Missing in sheet File Name": fileItem.name });
                        console.log('file not present in sheet:->', fileItem.name);
                    } else {
                        console.log('file present in sheet:->', fileItem.name);

                        fileItem.fileObj.fileItem = {
                            fileAttributes: selectedSheetData[fileItem.name]
                        };
    
                        const uploadPromise = new Promise((resolve, reject) => {
                            PlatformApi.IafFile.uploadFileResumable(containerObj, fileItem.fileObj, {
                                filename: fileItem.name,
                                onComplete: (fileItem) => {
                                    resolve({ "status": "sucess", "fileName": fileItem.name })
                                },
                                onError: (error) => {
                                    reject({ "status": "rejected", "error": error, "fileName": fileItem.name })
                                }
                            }, ctx).catch((error) => {
                                reject({ "status": "rejected", "error": error, "fileName": fileItem.name })
                            });
                        });

                        chunkPromises.push(uploadPromise);
                    }
                }

                await Promise.allSettled(chunkPromises).then((finalData) => {
                    finalData.forEach((settledPromise) => {
                        if (settledPromise.status === 'fulfilled') {
                            const result = settledPromise.value;
                            sucessUploadFiles.push({ "Success File Name": result.fileName });
                            allSucessFiles.push(result.fileName)
                        } else if (settledPromise.status === 'rejected') {
                            const reason = settledPromise.reason;
                            failerUploadFiles.push({ "Failed File Name": reason.fileName });
                        }
                    });
                });
            }

        } else {
            console.log('in side lest then 100 files :----')
            for (const fileItem of selectFiles) {
                selectFilesName.push(fileItem.name)
                if (!selectedSheetData.hasOwnProperty(fileItem.name)) {
                    missingFiles.push({ "Missing File Name": fileItem.name });
                    console.log('file not present in sheet:->', fileItem.name);
                } else {
                    console.log('file present in sheet:->', fileItem.name);
                    const path = fileItem.uri._fsPath;
                    fileItem.fileObj.fileItem = {
                        fileAttributes: selectedSheetData[fileItem.name]
                    };

                    const uploadPromise = new Promise((resolve, reject) => {
                        PlatformApi.IafFile.uploadFileResumable(containerObj, fileItem.fileObj, {
                            filename: fileItem.name,
                            onComplete: (fileItem) => {
                                resolve({ "status": "sucess", "fileName": fileItem.name })
                            },
                            onError: (error) => {
                                reject({ "status": "rejected", "error": error, "fileName": fileItem.name })
                            }
                        }, ctx).catch((error) => {
                            reject({ "status": "rejected", "error": error, "fileName": fileItem.name })
                        });
                    });

                    fileUploadPromises.push(uploadPromise);

                }
            }

            await Promise.allSettled(fileUploadPromises).then((finalData) => {
                finalData.forEach((settledPromise) => {
                    if (settledPromise.status === 'fulfilled') {
                        const result = settledPromise.value;
                        console.log('Sucess file upload :---->', result)
                        sucessUploadFiles.push({ "Success File Name": result.fileName });
                        allSucessFiles.push(result.fileName)
                    } else if (settledPromise.status === 'rejected') {
                        const reason = settledPromise.reason;
                        console.log('failed file upload :---->', reason)
                        failerUploadFiles.push({ "Failed File Name": reason.fileName });
                    }
                });
            });

        }

        let missingUpload = [];
        for (const keys in selectedSheetData) {
            if (!selectFilesName.includes(keys)) {
                missingUpload.push({ "Missing in folder File Name": keys })
            }
        }

        let finalFailedFiles = [];
        for (let i = 0; i < failerUploadFiles.length; i++) {
            let item = failerUploadFiles[i];
            let fileItems = await IafScriptEngine.getFileItems(
                {
                    collectionDesc: { _userType: iaf_ext_files_coll._userType, _userItemId: iaf_ext_files_coll._userItemId },
                    query: { "name": item['Failed File Name'] },
                    options: { page: { getAllItems: true } }
                }, ctx);

            if (fileItems.length == 0) {
                finalFailedFiles.push(item);
            }
            else {
                if (!allSucessFiles.includes(item['Failed File Name'])) {
                    console.log('file not include in sucess...')
                    sucessUploadFiles.push({ "Success File Name": item['Failed File Name'] })
                }
                else {
                    console.log('file pressenttttt in sucessss......')
                }
            }
        }

        if (missingFiles.length > 0) {
            missingFiles[0].Count = missingFiles.length;
        }

        if (sucessUploadFiles.length > 0) {
            sucessUploadFiles[0].Count = sucessUploadFiles.length;
        }

        if (finalFailedFiles.length > 0) {
            finalFailedFiles[0].Count = finalFailedFiles.length;
        }

        if (missingUpload.length > 0) {
            missingUpload[0].Count = missingUpload.length;
        }


        let finalSheetArray = [
            { sheetName: "Missing_File_In_Sheet", objects: missingFiles },
            { sheetName: "Successfully_Upload", objects: sucessUploadFiles },
            { sheetName: "Failed_To_Upload", objects: finalFailedFiles },
            { sheetName: "Missing_File_In_Folder", objects: missingUpload }
        ];

        let relationWorkbook = await UiUtils.IafDataPlugin.createWorkbookFromAoO(finalSheetArray);
        await UiUtils.IafDataPlugin.saveWorkbook(relationWorkbook, "Bulk_Upload_File_Status.xlsx");
        return
    }
}