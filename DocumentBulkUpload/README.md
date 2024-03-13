Overview

The Bulk File/Document Upload with Attributes script is a powerful automation tool designed to streamline the process of uploading multiple files to a platform while associating specific attributes to each file.

Features:

1. Resumable File Uploads

The script facilitates the resumable upload of large files, ensuring a smooth transfer and minimizing the risk of data loss during the upload process.

2. Attribute Mapping

Associates attributes with each file based on information provided in an Excel spreadsheet. Attributes are defined in the "Attribute_List" sheet of the spreadsheet.

3. Custom Attribute Values

Allows for the attachment of different attribute values to every file/document, providing flexibility in defining attributes on a per-file basis.

4. Batch Processing

Supports batch processing for cases where the number of files exceeds a predefined threshold. This prevents potential memory issues and ensures the successful upload of large sets of files.

5. Status Tracking

After uploading all files, we can easily track the status of each file/document. This includes information on which files were successfully uploaded , Which files were missing in the sheet and which files were fail to upload . 

Prerequisites:

Prepare an Excel spreadsheet with the following specifications:

The spreadsheet must contain a sheet named "Attribute_List."

The "Attribute_List" sheet should include a column named "File Name" to uniquely identify each file.

Define additional columns for the attributes you wish to associate with each file.

The script uses the information in this spreadsheet to map attributes to the corresponding files during the upload process.

How to execute script:

Open VS code and Run Bulk upload script

Open vs code , go to Digital Twin extension

Select your project 

Open script folder and select validation Script

Right click on Validation script

Right Click on Validation Script and click on Run Script

Click on Run script 

When you click on Run Script, script selection menu will open to select the script to run 

Select bulk upload files script to run 

Select Excel spreadsheet which have “Attribute_List” sheet 

When we click on  bulk upload files option First popup will open to select the Excel spreadsheet which have “Attribute_List” sheet 

Select multiple files to upload

Second popup will open to select the Files/Documents which we want to upload 

We can select multiples Files/Documents 

We can select any type of File/Document

Download File/Document upload status file 

When file/Document upload process will complete then we got the option to download status file 

In status file we can track the status of Successfully Upload, Missing files in the sheet or Fail to uploaded Files/Documents 

In status file we have three different sheets , Missing_File_In_Sheet, Successfully_Upload, Failed_To_Upload