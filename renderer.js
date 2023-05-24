const dirsDiv = document.getElementById('dirsDiv');
const filenamesDiv = document.getElementById('filenamesDiv'); 
const creationTimesDiv = document.getElementById('creationTimesDiv'); 
const lastAccessTimesDiv = document.getElementById('lastAccessTimesDiv'); 
const backButton = document.getElementById('backButton');
const addDirButton = document.getElementById('addDirButton');
const forwardButton = document.getElementById('forwardButton');
const sortByFilenameDiv = document.getElementById('sortByFilename');
const sortingBar = document.getElementById('sortingBar');
const sortByFilename = document.getElementById('sortByFilename');
const sortByCreationTime = document.getElementById('sortByCreationTime');
const sortByLastAccessTime = document.getElementById('sortByLastAccessTime');


let locHistoryIndex = 0;
let locHistory = [];
let scrollHistory = [];
let selectedDirs = [];

// When sortingState == 0 fileDivs are in original order, when == 1 they're sorted alphabetically
// and when == 2 they're sorted in reversed alphabetical order
let alphabeticalSortingState = 0;

function removeDisplayedContent(targetsToBeDeleted = 'everything') {
    if (targetsToBeDeleted == 'everything') {
        const dirsDivChildren = Array.from(dirsDiv.children);
        const filenamesDivChildren = Array.from(filenamesDiv.children);
        const creationTimesDivChildren = Array.from(creationTimesDiv.children);
        const lastAccessTimesDivChildren = Array.from(lastAccessTimesDiv.children);
    
        for (let child of dirsDivChildren) {
            child.remove();
        }

        for (let child of filenamesDivChildren) {
            child.remove();
        }

        for (let child of creationTimesDivChildren) {
            child.remove();
        }

        for (let child of lastAccessTimesDivChildren) {
            child.remove();
        }

    } else {
        let targetChildren = Array.from(targetsToBeDeleted.children);

        for (let child of targetChildren) {
            child.remove();
        }
    }
}

function createAllLocObjects(targetDiv, objNamesArray) {
    for (let objName of objNamesArray) {
        createLocObject(targetDiv, objName);
    }
}

function createLocObject(targetDiv, objName) {
    if (locHistoryIndex > 0) {
        if (targetDiv == dirsDiv) {
            encapsulatedCreateLocObject(objName, targetDiv);
        } else if (targetDiv == filenamesDiv) {
            encapsulatedCreateLocObject(objName, targetDiv);
        }
    } else {
        if (targetDiv == dirsDiv) {
            encapsulatedCreateLocObject(objName, targetDiv);
        } else if (targetDiv == filenamesDiv) {
            encapsulatedCreateLocObject(objName, targetDiv);
        }
    }
}

function encapsulatedCreateLocObject(objName, targetDiv) {
    if (targetDiv == dirsDiv) {
        const div = document.createElement('div');

        div.innerText = objName;
        
        dirsDiv.append(div);

    } else {
        const filenameDiv = document.createElement('div');
        const creationTimeDiv = document.createElement('div');
        const lastAccessTimeDiv = document.createElement('div');

        filenameDiv.innerText = objName.filename;
        filenameDiv.classList.add('filenameDiv');

        creationTimeDiv.innerText = new Date(objName.fileBirthtime).toLocaleDateString();

        lastAccessTimeDiv.innerText = new Date(objName.fileLastAccessTime).toLocaleDateString();

        filenamesDiv.append(filenameDiv);
        creationTimesDiv.append(creationTimeDiv);
        lastAccessTimesDiv.append(lastAccessTimeDiv);
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

async function sortingFileDivs() {
    if (alphabeticalSortingState == 1) {
        const filenameDivs = filenamesDiv.querySelectorAll('.locContentObject');
        const filenameDivsSorted = Array.from(filenameDivs).sort((a, b) => a.innerText.localeCompare(b.innerText));

        for (filenameDiv of filenameDivsSorted) {
            filenamesDiv.appendChild(filenameDiv);
        }

    } else if (alphabeticalSortingState == 2) {
        const filenameDivs = filenamesDiv.querySelectorAll('.locContentObject');
        const filenameDivsSorted = Array.from(filenameDivs).sort((a, b) => b.innerText.localeCompare(a.innerText));

        for (filenameDiv of filenameDivsSorted) {
            filenamesDiv.appendChild(filenameDiv);
        }

    } else {
        const filenameDivs = filenamesDiv.querySelectorAll('.locContentObject');
        alphabeticalSortingState = 0;
        
        for (filenameDiv of filenameDivs) {
            filenameDiv.remove();
        }

        for (dir of selectedDirs) {
            const currentScope = await window.electronAPI.callWithIpcGetLocContent(dir);

            createAllLocObjects(filenamesDiv, currentScope.fileContent, dir);
        }
    }
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

dirsDiv.addEventListener('dblclick', async (event) => {
    rememberScrollHeight();

    event.stopPropagation();

    const target = event.target;
    const clickedDirName = target.innerText;

    if (target !== event.currentTarget && !event.ctrlKey) {
        removeDisplayedContent();

        const acquiredData = await window.electronAPI.callWithIpcGetClickedDirContent(clickedDirName);
        const locHistoryData = acquiredData.locHistoryData;
        const currentScope = acquiredData.currentScope;
        locHistoryIndex = locHistoryData.locHistoryIndex;
        
        createAllLocObjects(dirsDiv, currentScope.dirContent);
        createAllLocObjects(filenamesDiv, currentScope.fileContent);
    }
})

backButton.addEventListener('click', async (event) => {
    event.stopPropagation();

    removeDisplayedContent();

    const acquiredData = await window.electronAPI.callWithIpcGetPreviousDirContent();
    const locHistoryData = acquiredData.locHistoryData;
    const currentScope = acquiredData.currentScope;
    locHistoryIndex = locHistoryData.locHistoryIndex;

        if (locHistoryIndex > 0) {
            createAllLocObjects(dirsDiv, currentScope.dirContent);
            createAllLocObjects(filenamesDiv, currentScope.fileContent);  

        } else {
            createAllLocObjects(dirsDiv, currentScope.dirContent);
        }
    remindScrollHeight();
})

forwardButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    
    removeDisplayedContent();
    
    const acquiredData = await window.electronAPI.callWithIpcGetNextDirContent();
    const locHistoryData = acquiredData.locHistoryData;
    const currentScope = acquiredData.currentScope;
    locHistoryIndex = locHistoryData.locHistoryIndex;
    
    createAllLocObjects(dirsDiv, currentScope.dirContent);
    createAllLocObjects(filenamesDiv, currentScope.fileContent); 

    remindScrollHeight();
})

dirsDiv.addEventListener('click', async (event) => {
    event.stopPropagation();

    const target = event.target;

    if (event.ctrlKey && target !== event.currentTarget) {
        removeDisplayedContent(filenamesDiv);
        removeDisplayedContent(creationTimesDiv);
        removeDisplayedContent(lastAccessTimesDiv);

        // let selectedLocPath;
    
        const justFiles = true;
        const receivedData = await window.electronAPI.callWithIpcAddSelectedDirToCurrentScope(target.innerText, justFiles);
        const currentScope = receivedData.currentScope;
        const selectedDirPath = receivedData.selectedLocPath;
        console.log(selectedDirPath);

        createAllLocObjects(filenamesDiv, currentScope.fileContent);   
    }
})

sortingBar.addEventListener('click', async () => {
    event.stopPropagation();
    const target = event.target;

    removeDisplayedContent(filenamesDiv);
    removeDisplayedContent(creationTimesDiv);
    removeDisplayedContent(lastAccessTimesDiv);

    currentScope = await window.electronAPI.callWithIpcUpdateSortingTypeAndSort(target.id);

    createAllLocObjects(filenamesDiv, currentScope.fileContent);   
})

window.electronAPI.callWithIpcUpdateSortingIndicator((event, indicator1, indicator2, indicator3) => {

    sortByFilename.innerText = indicator1;
    sortByCreationTime.innerText = indicator2;
    sortByLastAccessTime.innerText = indicator3;
})