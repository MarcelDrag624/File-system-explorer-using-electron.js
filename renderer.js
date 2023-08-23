const dirsDiv = document.getElementById('dirsDiv');
const filesDiv = document.getElementById('filesDiv');
const backButton = document.getElementById('backButton');
const addDirButton = document.getElementById('addDirButton');
const forwardButton = document.getElementById('forwardButton');
const sortingBar = document.getElementById('sortingBar');
// const currentScopeMonitor = document.getElementById('currentScopeMonitor');
const filesTable = document.getElementById('filesTable');
const filesTableBody = document.getElementById('filesTableBody');
const dirsTable = document.getElementById('dirsTable');
const dirsTableBody = document.getElementById('dirsTableBody');
const currentScopeMonitorTable = document.getElementById('currentScopeMonitorTable');
const currentScopeMonitorTableBody = document.getElementById('currentScopeMonitorTableBody');
const filenameHeader = document.getElementById('filenameHeader');
const creationTimeHeader = document.getElementById('creationTimeHeader');
const lastAccessTimeHeader = document.getElementById('lastAccessTimeHeader');

let locHistoryIndex = 0;
let locHistory = [];
let scrollHistory = [];
let selectedDirs = [];
let currentScope;
let hiddenDirs = [];

// When sortingState == 0 fileDivs are in original order, when == 1 they're sorted alphabetically
// and when == 2 they're sorted in reversed alphabetical order
let alphabeticalSortingState = 0;

function removeDisplayedContent(targetsToBeDeleted = 'everything') {
    if (targetsToBeDeleted == 'everything') {
        while (dirsTableBody.rows.length >= 1) {
            dirsTableBody.deleteRow(0);
        }

        while (filesTableBody.rows.length >= 1) {
            filesTableBody.deleteRow(0);
        }

    } else {
        while (targetsToBeDeleted.rows.length >= 1) {
            targetsToBeDeleted.deleteRow(0);
        }
    }
}

function createAllLocObjects(targetDiv, objNamesArray, hiddenDirs) {
    for (let objName of objNamesArray) {
        createLocObject(targetDiv, objName, hiddenDirs);
    }
}

function createLocObject(targetDiv, objName, hiddenDirs) {
    if (locHistoryIndex > 0) {
        if (targetDiv == dirsDiv) {
            encapsulatedCreateLocObject(objName, targetDiv);
        } else if (targetDiv == filesDiv) {
            if (!hiddenDirs.some(dir => dir == objName.parentPath)) {
                encapsulatedCreateLocObject(objName, targetDiv);
            }
        }
    } else {
        if (targetDiv == dirsDiv) {
            encapsulatedCreateLocObject(objName, targetDiv);
        } else if (targetDiv == filesDiv) {
            if (!hiddenDirs.some(dir => dir == objName.parentPath)) {
                encapsulatedCreateLocObject(objName, targetDiv);
            }
        }
    }
}

function encapsulatedCreateLocObject(objName, targetDiv) {
    if (targetDiv == dirsDiv) {

        let row = dirsTableBody.insertRow(dirsTableBody.rows.length);
        let dirnameCell = row.insertCell();

        dirnameCell.innerText = objName;

        dirnameCell.addEventListener('dblclick', async (event) => {

            hiddenDirs = [];

            rememberScrollHeight();
        
            event.stopPropagation();
        
            const target = event.target;
            const clickedDirName = target.innerText;
        
            if (!event.ctrlKey) {
                removeDisplayedContent();
        
                const acquiredData = await window.electronAPI.callWithIpcGetClickedDirContent(clickedDirName);
                const locHistoryData = acquiredData.locHistoryData;
                currentScope = acquiredData.currentScope;
                locHistoryIndex = locHistoryData.locHistoryIndex;
                
                createAllLocObjects(dirsDiv, currentScope.dirContent, hiddenDirs);
                createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs);
            }
        })

    } else {
        let row = filesTableBody.insertRow(filesTableBody.rows.length);
        let filenameCell = row.insertCell();
        let creationTimeCell = row.insertCell();
        let lastAccessTimeCell = row.insertCell();

        filenameCell.innerText = objName.filename;
        creationTimeCell.innerText = new Date(objName.fileBirthtime).toLocaleDateString();
        lastAccessTimeCell.innerText = new Date(objName.fileLastAccessTime).toLocaleDateString();

        row.addEventListener('dblclick', () => {
            window.electronAPI.runFile(objName.parentPath + '\\' + objName.filename);
        })
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

function rememberScrollHeight() {
    scrollHistory.splice(locHistoryIndex, scrollHistory.length - locHistoryIndex);
    scrollHistory.push(dirsDiv.scrollTop);
}

function remindScrollHeight() {
    dirsDiv.scrollTop = scrollHistory[locHistoryIndex];
}

window.electronAPI.callWithIpcUpdateNavigationMode((event, locHistoryIndex, locHistoryLength) => {
    if (locHistoryIndex > 0) {

        if (locHistoryIndex == locHistoryLength) {
            addDirButton.disabled = true;
            backButton.disabled = false;
            forwardButton.disabled = true;

        } else {
            addDirButton.disabled = true;
            backButton.disabled = false;
            forwardButton.disabled = false;
        }
    } else {
            addDirButton.disabled = false;
            backButton.disabled = true;
            forwardButton.disabled = false;
    }
})

addDirButton.addEventListener('click', async (event) => {
    event.stopPropagation();

    const rootDir = await window.electronAPI.callWithIpcGetRootDirs();

    if (rootDir != undefined) {
        createLocObject(dirsDiv, rootDir, rootDir);
    }
})

// dirsDiv.addEventListener('dblclick', async (event) => {
//     rememberScrollHeight();

//     event.stopPropagation();

//     const target = event.target;
//     const clickedDirName = target.innerText;

//     if (target !== event.currentTarget && !event.ctrlKey) {
//         removeDisplayedContent();

//         const acquiredData = await window.electronAPI.callWithIpcGetClickedDirContent(clickedDirName);
//         const locHistoryData = acquiredData.locHistoryData;
//         currentScope = acquiredData.currentScope;
//         locHistoryIndex = locHistoryData.locHistoryIndex;
        
//         createAllLocObjects(dirsDiv, currentScope.dirContent, hiddenDirs);
//         createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs);
//     }
// })

backButton.addEventListener('click', async (event) => {
    event.stopPropagation();

    removeDisplayedContent();

    hiddenDirs = [];

    const acquiredData = await window.electronAPI.callWithIpcGetPreviousDirContent();
    const locHistoryData = acquiredData.locHistoryData;
    currentScope = acquiredData.currentScope;
    locHistoryIndex = locHistoryData.locHistoryIndex;

        if (locHistoryIndex > 0) {
            createAllLocObjects(dirsDiv, currentScope.dirContent, hiddenDirs);
            createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs);  

        } else {
            createAllLocObjects(dirsDiv, currentScope.dirContent, hiddenDirs);
        }
    remindScrollHeight();
})

forwardButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    
    removeDisplayedContent();

    hiddenDirs = [];
    
    const acquiredData = await window.electronAPI.callWithIpcGetNextDirContent();
    const locHistoryData = acquiredData.locHistoryData;
    currentScope = acquiredData.currentScope;
    const newLocPath = acquiredData.newLocPath;
    locHistoryIndex = locHistoryData.locHistoryIndex;
    
    createAllLocObjects(dirsDiv, currentScope.dirContent, hiddenDirs);
    createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs); 

    remindScrollHeight();
})

dirsDiv.addEventListener('click', async (event) => {
    event.stopPropagation();

    const target = event.target;

    const currentScopeMonitorCells = currentScopeMonitorTable.getElementsByTagName('td');

    for (let cell of currentScopeMonitorCells) {
        if (target.innerText == cell.innerText) {

            for (let i = hiddenDirs.length - 1; i > -1; i--) {
                if (hiddenDirs[i] == cell.title) {
                    hiddenDirs.splice(i, 1);    
                }
            } 
        }
    }

    if (event.ctrlKey && target !== event.currentTarget) {

        removeDisplayedContent(filesTableBody);
    
        const justFiles = true;
        const receivedData = await window.electronAPI.callWithIpcAddSelectedDirToCurrentScope(target.innerText, justFiles);
        currentScope = receivedData.currentScope;
        const selectedDirPath = receivedData.selectedLocPath;

        createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs);   
    }
})

sortingBar.addEventListener('click', async () => {
    event.stopPropagation();
    const target = event.target;

    removeDisplayedContent(filesTableBody);

    currentScope = await window.electronAPI.callWithIpcUpdateSortingTypeAndSort(target.id);

    createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs);   
})

window.electronAPI.callWithIpcUpdateSortingIndicator((event, indicatorsObj) => {
    filenameHeader.innerText = indicatorsObj.filename.innerText;
    filenameHeader.style.fontWeight = indicatorsObj.filename.textWeight;

    creationTimeHeader.innerText = indicatorsObj.creationTime.innerText;
    creationTimeHeader.style.fontWeight = indicatorsObj.creationTime.textWeight;

    lastAccessTimeHeader.innerText = indicatorsObj.lastAccessTime.innerText;
    lastAccessTimeHeader.style.fontWeight = indicatorsObj.lastAccessTime.textWeight;
})

window.electronAPI.getCurrentScopeDirs((event, currentScopeDirs) => {
    removeDisplayedContent(currentScopeMonitorTableBody);

    for (let dir of currentScopeDirs) {
        let row = currentScopeMonitorTableBody.insertRow(currentScopeMonitorTableBody.rows.length);
        let dirnameCell = row.insertCell();
        let soloButtonCell = row.insertCell();
        let hideButtonCell = row.insertCell();

        dirnameCell.innerText = dir.name;
        dirnameCell.title = dir.path;

        hideButtonCell.innerText = 'hide';
        hideButtonCell.addEventListener('click', function () {
            const dirToBeHidden = this.parentNode.getElementsByTagName('td')[0].title;
            if (!hiddenDirs.some(dir => dir == dirToBeHidden)) {

                hiddenDirs.push(dirToBeHidden);

            } else {

                for (let i = hiddenDirs.length - 1; i > -1; i--) {
                    if (hiddenDirs[i] == dirToBeHidden) {
                        hiddenDirs.splice(i, 1);    
                    }
                }  
            }
            removeDisplayedContent(filesTableBody);
            createAllLocObjects(filesDiv, currentScope.fileContent, hiddenDirs);   
        })
    }
})



