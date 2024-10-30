import { IafFileSvc } from "@dtplatform/platform-api";
import _ from "lodash";
import moment from "moment";
const VALID_FILE_EXT = ['.bimpk', '.sgpk'];

export const getSelectedBimpkVersions = (bimpks, bimpkid) =>
  bimpks.find((bimpk) => bimpk._id === bimpkid)?.versions || [];

export const isImported = (ver, allImportedModelVersions) => {

  console.log('isImp', ver, allImportedModelVersions)

  return !!allImportedModelVersions.find(itv => itv.fileId === ver._fileId && itv.fileVersionId === ver._id)

}

export const isTipVersion = (ver, bimpks, selectedBimpk) => {
  let result = false;

  if (selectedBimpk) {
    let bimpk = _.find(bimpks, { _id: selectedBimpk.value });
    result = bimpk._tipId === ver._id;
  }

  return result;
};

export const onVersionChecked = (checkedVer, bimpks, callback) => {
  //check the selected version and uncheck all others
  //const checkedVer = checkedRow.original;

  // toggle the checked state of the version and uncheck all others
  bimpks.forEach((bimpk) => {
    bimpk.versions.forEach((version) => {
      if (checkedVer._id === version._id) {
        if (version.checked) {
          version.checked = false;
        } else {
          version.checked = true;
        }
      } else {
        version.checked = false;
      }
    });
  });

  callback(bimpks, checkedVer);
};

export const constructModelFileVersions = async (modelFiles) => {
  //for each bimpk file
  //1. get its name with no extension
  //2. get its versions
  //3. sort the versions newest at top
  //4. for each version create a nice create date for display
  //5. set a property to be used in the table for the check box being checked or not

  const promises = modelFiles.map(async (modelFile) => {
    const fetchedVersions = await IafFileSvc.getFileVersions(modelFile._id);
    const versions = fetchedVersions._list;

    const sortedExpandedVersions = versions.map((version) => {
      const created = moment(version._metadata._createdAt);

      return {
        ...version,
        displayCreateDate: created.format('MMM D YYYY, h:mm a'),
        checked: false,
      };
    })
      .sort((a, b) => {
        return b._version - a._version;
      });

    return {
      ...modelFile,
      nameNoExt: modelFile._name.split('.').slice(0, -1).join() + ' (' + modelFile._name.split('.').pop() + ')',
      versions: sortedExpandedVersions,
    }
  });

  const newModelFiles = Promise.all(promises);

  return newModelFiles;
};

export const getCurrentFileNameFromSelect = (selectedFile) => {
  let fileObject = { validFile: false };

  if (selectedFile) {
    // let xelem = document.getElementsByClassName('select__single-value')[0].firstChild.textContent;
    let xelemArr = selectedFile.label.split(' (');
    let currFileName = xelemArr[0];
    let currFileType = xelemArr[1].substring(0, xelemArr[1].length - 1);

    fileObject = { currFileName: currFileName, currFileType: currFileType, validFile: true };
  }

  return fileObject;
}


export const getFileNameAndExtension = (file) => {
  const fileNameAndExtension = file.name.split('.');
  const fileName = fileNameAndExtension[0];
  const fileExtension = fileNameAndExtension[1];

  return {
    fileName,
    fileExtension,
  }
}

export const validateFile = (fileName, fileExtension, dropdownFileName) => {
  let errorMessage = '';
  let isValid = true;

  if (!VALID_FILE_EXT.includes(`.${fileExtension}`)) {
    isValid = false;
    errorMessage = `Invalid file extension. Only ${VALID_FILE_EXT.join(', ')} files are supported.`;
  } 

  return {
    isValid,
    errorMessage,
  }
}