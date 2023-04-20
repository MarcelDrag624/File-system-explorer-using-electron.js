const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');

let addedRootDirs = {dirContent: []};
let locHistory = [];
let locHistoryIndex = 0;
let currentScopeDirs = [];
let currentScope = [];

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

                        fileContent.push({filename: contentElement, fileBirthtime});
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

                        fileContent.push({filename: contentElement, fileBirthtime});
                    }
                } catch (err) {}
            }
    
            contentSeparated = {dirContent, fileContent, locPath: newLocPath};
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
    currentScope = [locContent];
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
    currentScope = [locContent];
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
    currentScope = [locContent];
    
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
        currentScope.push(locContent);

        currentScopeDirs.push(selectedLocPath);
    } else {
        const locObjectToBeDeleted = currentScope.find(obj => obj.locPath == selectedLocPath);        
        const locObjectToBeDeletedIndex = currentScope.indexOf(locObjectToBeDeleted);
        currentScope.splice(locObjectToBeDeletedIndex, 1);

        const dirToBeDeletedIndex = currentScopeDirs.indexOf(selectedLocPath);
        currentScopeDirs.splice(dirToBeDeletedIndex, 1);
        
    }
    console.log(currentScope);
    return currentScope;
}

app.whenReady().then(() => {
    ipcMain.handle('chanel1', getRootDirs);
    ipcMain.handle('chanel2', getClickedDirContent);
    ipcMain.handle('chanel4', getPreviousDirContent);
    ipcMain.handle('chanel5', getNextDirContent);
    ipcMain.handle('chanel6', addSelectedDirToCurrentScope);
    createWindow();
})