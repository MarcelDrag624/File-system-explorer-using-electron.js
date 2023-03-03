const dirsDiv = document.getElementById('dirsDiv');
const filesDiv = document.getElementById('filesDiv');
const backButton = document.getElementById('backButton');
const addDirButton = document.getElementById('addDirButton');
const forwardButton = document.getElementById('forwardButton');

let locHistoryIndex = 0;
let locHistory = [];
let addedRootDirs = {dirContent: []};
let scrollHistory = [];
let selectedDirs = [];

function removeDisplayedContent(targetsToBeDeleted = 'everything') {
    if (targetsToBeDeleted == 'everything') {
        const dirsDivChildren = Array.from(dirsDiv.children);
        const filesDivChildren = Array.from(filesDiv.children);
    
        for (let child of dirsDivChildren) {
            child.remove();
        }

        for (let child of filesDivChildren) {
            child.remove();
        }
    } else {
        const selectorEncoded = encodeURIComponent(targetsToBeDeleted);
        const fileDivsToBeDeleted = document.getElementsByClassName(selectorEncoded);
        const fileDivsToBeDeletedArray = Array.from(fileDivsToBeDeleted);
        console.log(fileDivsToBeDeletedArray);

        for (let fileDiv of fileDivsToBeDeletedArray) {
            fileDiv.remove();
        }
    }
}

function encapsulatedCreateLocObject(objName, cssSelector, targetAttribute, targetDiv) {
    const div = document.createElement('div');
    div.innerText = objName;
    const cssSelectorEncoded = encodeURIComponent(cssSelector);
    div.setAttribute(targetAttribute, cssSelectorEncoded);
    div.classList.add("locContentObject");
    targetDiv.append(div);
}

function createLocObject(targetDiv, objName, selectorString = null) {
    if (locHistoryIndex > 0) {
        if (targetDiv == dirsDiv) {
            const cssSelector = selectorString + '\\' + objName;
            encapsulatedCreateLocObject(objName, cssSelector, "id", targetDiv);
        } else if (targetDiv == filesDiv) {
            const cssSelector = selectorString;
            encapsulatedCreateLocObject(objName, cssSelector, "class", targetDiv);
        }
    } else {
        if (targetDiv == dirsDiv) {
            const cssSelector = objName;
            encapsulatedCreateLocObject(objName, cssSelector, "id", targetDiv);
        } else if (targetDiv == filesDiv) {
            const cssSelector = selectorString;
            encapsulatedCreateLocObject(objName, cssSelector, "class", targetDiv);
        }
    }
}

function createAllLocObjects(targetDiv, objNamesArray, selectorString = null) {
    for (let objName of objNamesArray) {
        createLocObject(targetDiv, objName, selectorString);
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

function navigationWithButtons() {
    if (locHistoryIndex > 0) {
        if (locHistoryIndex == locHistory.length) {
            
            addDirButton.disabled = true;
            backButton.disabled = false;
            forwardButton.disabled = true;

            const newLocPath = locHistory.join('\\');

            return newLocPath;
        } else {
            
            addDirButton.disabled = true;
            backButton.disabled = false;
            forwardButton.disabled = false;

            const newLocPath = buildLocPath('fromCopy');

            return newLocPath;
        }
    } else {

            addDirButton.disabled = false;
            backButton.disabled = true;
            forwardButton.disabled = false;

            return addedRootDirs;
    }
}

function rememberScrollHeight() {
    scrollHistory.splice(locHistoryIndex, scrollHistory.length - locHistoryIndex);
    scrollHistory.push(dirsDiv.scrollTop);
}

function remindScrollHeight() {
    dirsDiv.scrollTop = scrollHistory[locHistoryIndex];
}

addDirButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    const rootDir = await window.electronAPI.callWithIpcGetRootDirs();
    if (rootDir != null && !addedRootDirs.dirContent.includes(rootDir)) {
        addedRootDirs.dirContent.push(rootDir);
        createLocObject(dirsDiv, rootDir, rootDir);
    }
})

dirsDiv.addEventListener('dblclick', async (event) => {
    rememberScrollHeight();
    event.stopPropagation();
    
    const target = event.target;
    if (target !== event.currentTarget && !event.ctrlKey) {
        removeDisplayedContent();
        selectedDirs = [];

        if (locHistoryIndex == 0) {
            addDirButton.disabled = true;
            forwardButton.disabled = true;
            backButton.disabled = false;

            locHistory = [];
            locHistory.push(target.innerText);
            const newLocPath = target.innerText;
            locHistoryIndex += 1;


            const locContent = await window.electronAPI.callWithIpcGetLocContent(newLocPath);
            createAllLocObjects(dirsDiv, locContent.dirContent, newLocPath);
            createAllLocObjects(filesDiv, locContent.fileContent, newLocPath);

        } else if (locHistoryIndex > 0) {
            forwardButton.disabled = true;
            backButton.disabled = false;
    
            const newLocPath = buildLocPath('fromOriginal', target.innerText);
            locHistoryIndex += 1;
    
            const locContent = await window.electronAPI.callWithIpcGetLocContent(newLocPath);
    
            createAllLocObjects(dirsDiv, locContent.dirContent, newLocPath);
            createAllLocObjects(filesDiv, locContent.fileContent, newLocPath);
        }
    }
})

backButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    removeDisplayedContent();

    selectedDirs = [];

    locHistoryIndex -= 1;

    if (locHistoryIndex > 0) {
        const newLocPath = navigationWithButtons();
        const locContent = await window.electronAPI.callWithIpcGetLocContent(newLocPath);
        createAllLocObjects(dirsDiv, locContent.dirContent, newLocPath);
        createAllLocObjects(filesDiv, locContent.fileContent, newLocPath);
    } else {
        const locContent = navigationWithButtons();
        createAllLocObjects(dirsDiv, locContent.dirContent);
    }
    remindScrollHeight();
})

forwardButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    removeDisplayedContent();

    selectedDirs = [];
    locHistoryIndex += 1;

    const newLocPath = navigationWithButtons();
    const locContent = await window.electronAPI.callWithIpcGetLocContent(newLocPath);
    
    createAllLocObjects(dirsDiv, locContent.dirContent, newLocPath);
    createAllLocObjects(filesDiv, locContent.fileContent, newLocPath);
    
    remindScrollHeight();
})

dirsDiv.addEventListener('click', async (event) => {
    event.stopPropagation();
    const target = event.target;
    let selectedLocPath;

    if (event.ctrlKey && target !== event.currentTarget) {
        
        if (locHistoryIndex == 0) {
            selectedLocPath = target.innerText;
        } else {
            selectedLocPath = buildLocPath('fromCopy');
            selectedLocPath += '\\' + target.innerText;
        }   

        if (!selectedDirs.includes(selectedLocPath)) {
            const locContent = await window.electronAPI.callWithIpcGetLocContent(selectedLocPath);
            createAllLocObjects(filesDiv, locContent.fileContent, selectedLocPath);
            selectedDirs.push(selectedLocPath);
        } else {
            removeDisplayedContent(selectedLocPath);         
            const selectedLocPathIndex = selectedDirs.indexOf(selectedLocPath);
            selectedDirs.splice(selectedLocPathIndex, 1);
        }
    }
})