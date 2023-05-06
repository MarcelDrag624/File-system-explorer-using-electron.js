const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');

let addedRootDirs = {dirContent: []};
let locHistory = [];
let locHistoryIndex = 0;
let currentScopeDirs = [];
let currentScope = [];
let filenameSorting = 0;
let creationTimeSorting = 0;

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

function sortDisplayedData(targetId) {
        if (filenameSorting == 1) {
            mainWindow.webContents.send('chanel8', 'Filename (a-z)', 'Creation time');
            currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));

        } else if (filenameSorting == 2) {
            mainWindow.webContents.send('chanel8', 'Filename (z-a)', 'Creation time');
            currentScope.fileContent.sort((a,b) => b.filename.localeCompare(a.filename));

        } else if (filenameSorting == 3) {
            mainWindow.webContents.send('chanel8', 'Filename', 'Creation time');
            filenameSorting = 0; 
            
            currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));
            currentScope.fileContent.sort((a,b) => {
                const file1OriginIndex = currentScopeDirs.indexOf(a.origin);
                const file2OriginIndex = currentScopeDirs.indexOf(b.origin);
                return file1OriginIndex - file2OriginIndex;
            });

        } else if (creationTimeSorting == 1) {
            mainWindow.webContents.send('chanel8', 'Filename', 'Creation time (↑)');
            currentScope.fileContent.sort((a,b) => a.fileBirthtime - b.fileBirthtime);

        } else if (creationTimeSorting == 2) {
            mainWindow.webContents.send('chanel8', 'Filename', 'Creation time (↓)');
            currentScope.fileContent.sort((a,b) => b.fileBirthtime - a.fileBirthtime);

        } else if (creationTimeSorting == 3) {
            mainWindow.webContents.send('chanel8', 'Filename', 'Creation time');
            creationTimeSorting = 0; 
            
            currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));
            currentScope.fileContent.sort((a,b) => {
                const file1OriginIndex = currentScopeDirs.indexOf(a.origin);
                const file2OriginIndex = currentScopeDirs.indexOf(b.origin);
                return file1OriginIndex - file2OriginIndex;
            });
        }

    return currentScope
}

function updateSortingTypeAndSort(event, targetId) {
    if (targetId == 'sortByFilename') {
        if (currentScopeDirs.length == 1 && filenameSorting == 0) {
            creationTimeSorting = 0;
            filenameSorting += 2;
            console.log('1');
        } else {
            creationTimeSorting = 0;
            filenameSorting += 1; 
            console.log('2');   
        }

    } else if (targetId == 'sortByCreationTime') {
            filenameSorting = 0;
            creationTimeSorting += 1;   
            console.log('3');         
    }
    
    currentScope = sortDisplayedData(targetId);

    return currentScope
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
    let contentSeparated = [];
    
    if (locHistoryIndex == 0 && newLocPath == null) {
        contentSeparated = {dirContent: addedRootDirs.dirContent, fileContent: [], locPath: newLocPath};
        return contentSeparated;    

    } else {
        contentMixed = fs.readdirSync(newLocPath);

        if (justFiles) {
            for (let contentElement of contentMixed) {
                try {
                    let contentElementFsObject = fs.statSync(newLocPath+"\\"+contentElement);

                    if (contentElementFsObject.isFile()) {
                        
                        let fileBirthtime = contentElementFsObject.birthtimeMs;

                        fileContent.push({filename: contentElement, fileBirthtime, origin: newLocPath});
                    }
                } catch (err) {}
            }
    
            contentSeparated = {dirContent, fileContent, locPath: newLocPath};
            return contentSeparated;
            
        } else {
            for (let contentElement of contentMixed) {
                try {
                    let contentElementFsObject = fs.statSync(newLocPath+"\\"+contentElement);

                    if (contentElementFsObject.isDirectory()) {
                        dirContent.push(contentElement);
                    } else if (contentElementFsObject.isFile()) {

                        let fileBirthtime = contentElementFsObject.birthtimeMs;

                        fileContent.push({filename: contentElement, fileBirthtime, origin: newLocPath});
                    }
                } catch (err) {}
            }
    
            contentSeparated = {dirContent, fileContent};
            return contentSeparated;
        }
    }
}

function getClickedDirContent(event, clickedDirName) {
    let newLocPath;
    
    if (locHistoryIndex == 0) {
        locHistoryIndex += 1;
        locHistory = [];
        newLocPath = clickedDirName;
        currentScopeDirs = [clickedDirName];

        locHistory.push(clickedDirName);

        mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);

    } else if (locHistoryIndex > 0) {
        newLocPath = buildLocPath('fromOriginal', clickedDirName);

        locHistoryIndex += 1;
        currentScopeDirs = [clickedDirName];

        mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);
    }
    const locContent = getLocContent(newLocPath);
    currentScope = locContent;
    sortDisplayedData();
    // console.log(currentScope);
    locHistoryData = {locHistoryIndex, locHistoryLength: locHistory.length};
    dataToBeTransferred = {locHistoryData, currentScope};
    return dataToBeTransferred;
}

function getPreviousDirContent(event) {
    let locContent;
    locHistoryIndex -= 1;
    mainWindow.webContents.send('chanel3', locHistoryIndex, locHistory.length);

    if (locHistoryIndex > 0) {
        newLocPath = buildLocPath('fromCopy');
        currentScopeDirs = [newLocPath];
        locContent = getLocContent(newLocPath);

    } else {
        currentScopeDirs = [];
        locContent = getLocContent();
    }
    currentScope = locContent;
    sortDisplayedData();
    locHistoryData = {locHistoryIndex, locHistoryLength: locHistory.length};
    dataToBeTransferred = {locHistoryData, currentScope};
    return dataToBeTransferred;
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
    currentScopeDirs = [newLocPath];

    const locContent = getLocContent(newLocPath);
    currentScope = locContent;
    sortDisplayedData();
    locHistoryData = {locHistoryIndex, locHistoryLength: locHistory.length};
    dataToBeTransferred = {locHistoryData, currentScope};
    return dataToBeTransferred;
}

function addSelectedDirToCurrentScope(event, clickedDirName, justFiles) {
    let selectedLocPath;

    if (locHistoryIndex == 0) {
        selectedLocPath = clickedDirName;
    } else {
        selectedLocPath = buildLocPath('fromCopy');
        selectedLocPath += '\\' + clickedDirName;
    }   
    if (!currentScopeDirs.includes(selectedLocPath)) {
        const locContent = getLocContent(selectedLocPath, justFiles);

        for (let file of locContent.fileContent) {
            currentScope.fileContent.push(file);
        }

        currentScopeDirs.push(selectedLocPath);

    } else {

        for (let i = currentScope.fileContent.length - 1; i > -1; i--) {
            if (currentScope.fileContent[i].origin == selectedLocPath) {
                currentScope.fileContent.splice(i, 1);    
            }
        }
        const dirToBeDeletedIndex = currentScopeDirs.indexOf(selectedLocPath);
        currentScopeDirs.splice(dirToBeDeletedIndex, 1);        
    }
    sortDisplayedData();
    // currentScope.fileContent.sort((a,b) => a.fileBirthtime - b.fileBirthtime);
    // currentScope.fileContent.sort((a,b) => a.filename.localeCompare(b.filename));
    // console.log(currentScope);

    return currentScope;
}

app.whenReady().then(() => {
    ipcMain.handle('chanel1', getRootDirs);
    ipcMain.handle('chanel2', getClickedDirContent);
    ipcMain.handle('chanel4', getPreviousDirContent);
    ipcMain.handle('chanel5', getNextDirContent);
    ipcMain.handle('chanel6', addSelectedDirToCurrentScope);
    ipcMain.handle('chanel7', updateSortingTypeAndSort);
    createWindow();
})