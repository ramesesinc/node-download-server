const path = require('path');
const fs = require('fs');

const isDirectory = dirPath => {
    return fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
}

const isFileEqualExtension = (fileName, extension) => {
    if (!extension) return false;
    let extName = extension.toLowerCase()
    extName = extName.startsWith(".") ? extName : "." + extName;
    
    return path.extname(fileName) === extName;
}

const findFiles = (dirPath, name, extension, fileList) => {
    if (!isDirectory(dirPath)) {
        return;
    }
    
    fs.readdirSync(dirPath)
        .forEach(file => {
            const fileName = path.join(dirPath, file);
            if (isDirectory(fileName)) {
                const fileName = path.join(dirPath, file)
                findFiles(fileName, name, extension, fileList);
            } else {
                if (name && file.toLowerCase() === name.toLowerCase()) {
                    fileList.push({dir: dirPath, file: file});
                } else if (extension && isFileEqualExtension(fileName, extension)) {
                    fileList.push({dir: dirPath, file: file});
                }
            }
      });
}

const findFilesByExt = (dirName, ext) => {
    const files = [];
    findFiles(dirName, null, ext, files);
    return files;
}

const findFilesByName = (dirName, name) => {
    const files = [];
    findFiles(dirName, name, null, files);
    return files;
}

module.exports = {
    findFilesByName: findFilesByName,
    findFilesByExt: findFilesByExt,
    isDirectory: isDirectory,
}