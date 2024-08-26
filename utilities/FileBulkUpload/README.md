# Bulk File Upload

## Overview

The Bulk File/Document Upload with Attributes script is a powerful automation tool designed to streamline the process of uploading multiple files to Twinit while associating specific attributes to each file.

All files will be uploaded to the Root Container for a Project in Twinit, and FileItem will be created for each file in the Twinit Item Service.

### Features:

1. Resumable File Uploads

The script facilitates the resumable upload of large files, ensuring a smooth transfer and minimizing the risk of data loss during the upload process.

2. Attribute Mapping

Associates attributes with each file based on information provided in an Excel spreadsheet. Attributes are defined in the "Attribute_List" sheet of the spreadsheet.

3. Custom Attribute Values

Allows for the attachment of different attribute values to every file/document, providing flexibility in defining attributes on a per-file basis.

4. Batch Processing

Supports batch processing for cases where the number of files exceeds a predefined threshold. This prevents potential memory issues and ensures the successful upload of a large sets of files.

5. Status Tracking

After uploading all files, we can easily track the status of each file/document. This includes information on which files were successfully uploaded, which files were missing in the sheet, and which files failed to upload. 

## Prerequisites:

Prepare an Excel spreadsheet with the following specifications:

The spreadsheet must contain a sheet named "Attribute_List."

The "Attribute_List" sheet should include a column named "File Name" to uniquely identify each file.

Define additional columns for the attributes you wish to associate with each file.

The script uses the information in this spreadsheet to map attributes to the corresponding files during the upload process.

## How to execute the bulk file upload script:

1. Open VS Code, go to the Twinit extension, and sign in
2. Select the project to which you want to upload files
3. Open the script folder, create a new script, and copy paste the contents of BulkLoad.js into it. Save the script.
4. Right click on the script and select Run Script
5. Select 'Bulk Upload Files' from the run script dropdown
6. Select the Excel spreadsheet with your file names and “Attribute_List” sheet 
7. Select one or more files to upload - these files shoudl be in your Excel spreadsheet

The script will then begn uploading files. IF you have selected many files or large files this could be a long running operation.

When upload has completed VS Code will ask to download a result file. This results file is Excel spreadsheet with tabs with information for files which were successfully uploaded, files that failed to upload, or files which were selected to be uploaded but were missing from the original spreadsheet.

## Example files

Example files are included and can be used with the above steps to test the Bulk File Upload script.

In step 6 select 'examples/Upload Spreadsheet/Example Bulk File Upload File Attributes Spreadsheet.xlsx'.

In step 7 select all the files in 'examples/Upload Files'.