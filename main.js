const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const shell = require('electron').shell;

let addedRootDirs = {dirContent: []};
let locHistory = [];
let locHistoryIndex = 0;
let currentScopeDirs = [];
let currentScope = {fileContent: []};
let filenameSorting = 0;
let creationTimeSorting = 0;
let lastAccessTimeSorting = 0;

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    })
    mainWindow.loadFile('index.html');
}

async function getRootDirs() {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory']});
    if (canceled) {
        
        return;
    } else {
        if (filePaths[0] != null && !addedRootDirs.dirContent.includes(filePaths[0])) {
            addedRootDirs.dirContent.push(filePaths[0]);
            
            return filePaths[0];
        }
    }
}

function sortDisplayedData() {
        if (filenameSorting == 1) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename (a-z)', textWeight: 1000},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
            });

            currentScope.fileContent.sort((a,b) => a.filenameNoExt.localeCompare(b.filenameNoExt, undefined, {numeric: true}));

        } else if (filenameSorting == 2) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename (z-a)', textWeight: 1000},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
        });
            currentScope.fileContent.sort((a,b) => b.filenameNoExt.localeCompare(a.filenameNoExt, undefined, {numeric: true}));

        } else if (filenameSorting == 3) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
        });
            filenameSorting = 0; 

            currentScope.fileContent.sort((a,b) => a.filenameNoExt.localeCompare(b.filenameNoExt, undefined, {numeric: true}));
            
            // currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));
            currentScope.fileContent.sort((a,b) => {
                const file1OriginIndex = currentScopeDirs.findIndex(obj => obj.path == a.parentPath);
                const file2OriginIndex = currentScopeDirs.findIndex(obj => obj.path == b.parentPath);
                
                return file1OriginIndex - file2OriginIndex;
            });

        } else if (creationTimeSorting == 1) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time ▲', textWeight: 1000},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
        });
            currentScope.fileContent.sort((a,b) => a.fileBirthtime - b.fileBirthtime);

        } else if (creationTimeSorting == 2) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time ▼', textWeight: 1000},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
        });
            currentScope.fileContent.sort((a,b) => b.fileBirthtime - a.fileBirthtime);

        } else if (creationTimeSorting == 3) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
        });
            creationTimeSorting = 0; 
            
            currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));
            currentScope.fileContent.sort((a,b) => {
                const file1OriginIndex = currentScopeDirs.findIndex(obj => obj.path == a.parentPath);
                const file2OriginIndex = currentScopeDirs.findIndex(obj => obj.path == b.parentPath);
                
                return file1OriginIndex - file2OriginIndex;
            });
        } else if (lastAccessTimeSorting == 1) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time ▲', textWeight: 1000}
        });
            currentScope.fileContent.sort((a,b) => a.fileLastAccessTime - b.fileLastAccessTime);

        } else if (lastAccessTimeSorting == 2) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time ▼', textWeight: 1000}
        });
            currentScope.fileContent.sort((a,b) => b.fileLastAccessTime - a.fileLastAccessTime);

        } else if (lastAccessTimeSorting == 3) {
            mainWindow.webContents.send('chanel8', {
                filename: {innerText: 'Filename', textWeight: 100},
                creationTime: {innerText: 'Creation time', textWeight: 100},
                lastAccessTime: {innerText: 'Last access time', textWeight: 100}
        });
            lastAccessTimeSorting = 0; 
            
            currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));
            currentScope.fileContent.sort((a,b) => {
                const file1OriginIndex = currentScopeDirs.findIndex(obj => obj.path == a.parentPath);
                const file2OriginIndex = currentScopeDirs.findIndex(obj => obj.path == b.parentPath);
                
                return file1OriginIndex - file2OriginIndex;
            });
        }
}

function updateSortingTypeAndSort(event, targetId) {
    if (targetId == 'filenameHeader') {
        if (currentScopeDirs.length == 1 && filenameSorting == 0) {
            creationTimeSorting = 0;
            lastAccessTimeSorting = 0;
            filenameSorting += 2;
            // console.log('1');
        } else {
            creationTimeSorting = 0;
            lastAccessTimeSorting = 0;
            filenameSorting += 1; 
            // console.log('2');   
        }

    } else if (targetId == 'creationTimeHeader') {
            filenameSorting = 0;
            lastAccessTimeSorting = 0;
            creationTimeSorting += 1;   
            // console.log('3'); 

    } else if (targetId == 'lastAccessTimeHeader') {
        filenameSorting = 0;
        creationTimeSorting = 0;
        lastAccessTimeSorting += 1;   
        // console.log('3');         
}
    sortDisplayedData();

    return currentScope;
}

function buildLocPath(useOriginalLocHistoryOrCopy = 'fromOriginal', newElement = null) {
    if (useOriginalLocHistoryOrCopy == 'fromCopy') {
        let locHistoryCopy = [...locHistory];
        locHistoryCopy.splice(locHistoryIndex, locHistoryCopy.length - locHistoryIndex);
        
        const newLocPath = locHistoryCopy.join('\\');
    
        return newLocPath;

    } else if (useOriginalLocHistoryOrCopy == 'fromOriginal') {
        locHistory.splice(locHistoryIndex, locHistory.length - locHistoryIndex);
        locHistory.push(newElement);
        
        const newLocPath = locHistory.join('\\');

        return newLocPath;
    }
}

function getLocContent(newLocPath = null, justFiles = false) {

    let dirContent = [];
    let fileContent = [];
    
    if (locHistoryIndex == 0 && newLocPath == null) {
        return {dirContent: addedRootDirs.dirContent, fileContent: [], locPath: newLocPath};    

    } else {
        contentMixed = fs.readdirSync(newLocPath);

        if (justFiles) {
            for (let contentElement of contentMixed) {
                try {
                    let contentElementFsObject = fs.statSync(newLocPath+"\\"+contentElement);

                    if (contentElementFsObject.isFile()) {
                        
                        let fileBirthtime = contentElementFsObject.birthtimeMs;

                        let fileLastAccessTime = contentElementFsObject.atimeMs;

                        // console.log(fs.filename(newLocPath+"\\"+contentElement));
                        let extension = path.extname(newLocPath+"\\"+contentElement);
                        let filenameNoExt = path.basename(newLocPath+"\\"+contentElement, extension);

                        // for (let i = contentElement.length; i >=0; i--) {
                        //     if (contentElement[i] == '.') {
                        //         filenameNoExt = contentElement.substring(0, i);
                        //     }
                        // }

                        fileContent.push({filename: contentElement, filenameNoExt, fileBirthtime,
                        fileLastAccessTime, parentPath: newLocPath});
                    }
                } catch (err) {}
            }
            fileContent.sort((a,b) => a.filenameNoExt.localeCompare(b.filenameNoExt, undefined, {numeric: true}));

            return {dirContent, fileContent, locPath: newLocPath};
            
        } else {
            for (let contentElement of contentMixed) {
                try {
                    let contentElementFsObject = fs.statSync(newLocPath+"\\"+contentElement);

                    if (contentElementFsObject.isDirectory()) {
                        dirContent.push(contentElement);
                    } else if (contentElementFsObject.isFile()) {

                        let fileBirthtime = contentElementFsObject.birthtimeMs;

                        let fileLastAccessTime = contentElementFsObject.atimeMs;

                        // console.log(fs.filename(newLocPath+"\\"+contentElement));

                        let extension = path.extname(newLocPath+"\\"+contentElement);
                        let filenameNoExt = path.basename(newLocPath+"\\"+contentElement, extension);

                        // for (let i = contentElement.length; i >=0; i--) {
                        //     if (contentElement[i] == '.') {
                        //         filenameNoExt = contentElement.substring(0, i);
                        //     }
                        // }

                        fileContent.push({filename: contentElement, filenameNoExt, fileBirthtime,
                        fileLastAccessTime, parentPath: newLocPath});

                        // fileContent.sort((a,b) => a.filenameNoExt.localeCompare(b.filenameNoExt, undefined, {numeric: true}));
                    }
                } catch (err) {}
            }
            fileContent.sort((a,b) => a.filenameNoExt.localeCompare(b.filenameNoExt, undefined, {numeric: true}));

            return {dirContent, fileContent};
        }
    }
}

function getClickedDirContent(event, clickedDirName) {
    let newLocPath;
    
    if (locHistoryIndex == 0) {
        locHistoryIndex += 1;
        locHistory = [];

        newLocPath = clickedDirName;
        locHistory.push(clickedDirName);

        mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);

    } else if (locHistoryIndex > 0) {
        newLocPath = buildLocPath('fromOriginal', clickedDirName);

        locHistoryIndex += 1;

        mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);
    }

    currentScopeDirs = [{path:newLocPath, name: clickedDirName}]

    const locContent = getLocContent(newLocPath);
    currentScope = locContent;
    locHistoryData = {locHistoryIndex, locHistoryLength: locHistory.length};

    sortDisplayedData();

    mainWindow.webContents.send('chanel9', currentScopeDirs);
    // console.log(locHistory, locHistoryIndex);
    return {locHistoryData, currentScope, newLocPath};
}

function getPreviousDirContent(event) {
    let newLocPath;
    let locContent;
    locHistoryIndex -= 1;
    mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);

    if (locHistoryIndex > 0) {
        newLocPath = buildLocPath('fromCopy');
        currentScopeDirs = [{path: newLocPath, name: locHistory[locHistoryIndex-1]}];
        locContent = getLocContent(newLocPath);

    } else {
        currentScopeDirs = [];
        locContent = getLocContent();
    }
    currentScope = locContent;
    locHistoryData = {locHistoryIndex, locHistoryLength: locHistory.length};

    sortDisplayedData();

    mainWindow.webContents.send('chanel9', currentScopeDirs);

    return {locHistoryData, currentScope, newLocPath};
}

function getNextDirContent(event) {
    let newLocPath;
    locHistoryIndex += 1;
    mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);

    if (locHistoryIndex == locHistory.length) {
        newLocPath = locHistory.join('\\');

    } else {
        newLocPath = buildLocPath('fromCopy');
    }
    currentScopeDirs = [{path: newLocPath, name: locHistory[locHistoryIndex-1]}];

    const locContent = getLocContent(newLocPath);
    currentScope = locContent;
    locHistoryData = {locHistoryIndex, locHistoryLength: locHistory.length};

    sortDisplayedData();  
    
    mainWindow.webContents.send('chanel9', currentScopeDirs);

    return {locHistoryData, currentScope, newLocPath};
}

function addSelectedDirToCurrentScope(event, clickedDirName, justFiles) {
    let selectedLocPath;

    if (locHistoryIndex == 0) {
        selectedLocPath = clickedDirName;
    } else {
        selectedLocPath = buildLocPath('fromCopy');
        selectedLocPath += '\\' + clickedDirName;
    }
    if (!currentScopeDirs.some(obj => obj.path == selectedLocPath)) {
        const locContent = getLocContent(selectedLocPath, justFiles);

        for (let file of locContent.fileContent) {
            currentScope.fileContent.push(file);
        }

        currentScopeDirs.push({path: selectedLocPath, name: clickedDirName});

    } else {

        for (let i = currentScope.fileContent.length - 1; i > -1; i--) {
            if (currentScope.fileContent[i].parentPath == selectedLocPath) {
                currentScope.fileContent.splice(i, 1);    
            }
        }
        let dirToBeDeletedIndex = currentScopeDirs.findIndex(obj => obj.path == selectedLocPath);
        currentScopeDirs.splice(dirToBeDeletedIndex, 1);            
    }
    sortDisplayedData();

    // console.log(currentScopeDirs);
    mainWindow.webContents.send('chanel9', currentScopeDirs);

    return {currentScope, selectedLocPath};
}

function runFile(event, filePath) {
    shell.openPath(filePath);
}

app.whenReady().then(() => {
    ipcMain.handle('chanel1', getRootDirs);
    ipcMain.handle('chanel2', getClickedDirContent);
    ipcMain.handle('chanel4', getPreviousDirContent);
    ipcMain.handle('chanel5', getNextDirContent);
    ipcMain.handle('chanel6', addSelectedDirToCurrentScope);
    ipcMain.handle('chanel7', updateSortingTypeAndSort);
    ipcMain.on('chanel10', runFile)
    createWindow();
})