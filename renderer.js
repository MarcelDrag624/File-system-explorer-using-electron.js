const dirsDiv = document.getElementById('dirsDiv');
const filenamesDiv = document.getElementById('filenamesDiv');
const backButton = document.getElementById('backButton');
const addDirButton = document.getElementById('addDirButton');
const forwardButton = document.getElementById('forwardButton');
const sortByFilenameDiv = document.getElementById('sortByFilename');

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
    
        for (let child of dirsDivChildren) {
            child.remove();
        }

        for (let child of filenamesDivChildren) {
            child.remove();
        }
    } else {
        let targetChildren = Array.from(targetsToBeDeleted.children);

        for (let child of targetChildren) {
            child.remove();
        }
        // const selectorEncoded = encodeURIComponent(targetsToBeDeleted);
        // const fileDivsToBeDeleted = document.getElementsByClassName(selectorEncoded);
        // const fileDivsToBeDeletedArray = Array.from(fileDivsToBeDeleted);

        // for (let fileDiv of fileDivsToBeDeletedArray) {
        //     fileDiv.remove();
        // }
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
        } else if (targetDiv == filenamesDiv) {
            const cssSelector = selectorString;
            encapsulatedCreateLocObject(objName, cssSelector, "class", targetDiv);
        }
    } else {
        if (targetDiv == dirsDiv) {
            const cssSelector = objName;
            encapsulatedCreateLocObject(objName, cssSelector, "id", targetDiv);
        } else if (targetDiv == filenamesDiv) {
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

// function navigationWithButtons() {
//     if (locHistoryIndex > 0) {

//         if (locHistoryIndex == locHistory.length) {
//             addDirButton.disabled = true;
//             backButton.disabled = false;
//             forwardButton.disabled = true;

//             const newLocPath = locHistory.join('\\');

//             return newLocPath;

//         } else {
//             addDirButton.disabled = true;
//             backButton.disabled = false;
//             forwardButton.disabled = false;

//             const newLocPath = buildLocPath('fromCopy');

//             return newLocPath;
//         }

//     } else {
//             addDirButton.disabled = false;
//             backButton.disabled = true;
//             forwardButton.disabled = false;

//             return addedRootDirs;
//     }
// }

function rememberScrollHeight() {
    scrollHistory.splice(locHistoryIndex, scrollHistory.length - locHistoryIndex);
    scrollHistory.push(dirsDiv.scrollTop);
}

function remindScrollHeight() {
    dirsDiv.scrollTop = scrollHistory[locHistoryIndex];
}

// async function sortingFileDivs() {
//     if (selectedDirs.length == 1) {
//         if (alphabeticalSortingState == 0) {
//             // bez sortowania (kolejnosc plikow zgodna z kolejnoscia zaznaczania folderow)
//         } else if (alphabeticalSortingState == 1) {
//             // odwrotnie alfabetycznie
//         }
//     } else if (selectedDirs.length > 1) {
//         if (alphabeticalSortingState == 0) {
//             // bez sortowania (kolejnosc plikow zgodna z kolejnoscia zaznaczania folderow)            
//         } else if (alphabeticalSortingState == 1) {
//             // alfabetycznie
//         } else if (alphabeticalSortingState == 2) {
//             // odwrotnie alfabetycznie            
//         }
//     }
// }

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
        
        for (let loc of currentScope) {
            createAllLocObjects(dirsDiv, loc.dirContent, loc.locPath);
            createAllLocObjects(filenamesDiv, loc.fileContent, loc.locPath);    
        }

        // sortingFileDivs();
    }
})

backButton.addEventListener('click', async (event) => {
    event.stopPropagation();

    removeDisplayedContent();

    // locHistoryIndex -= 1;

    // if (locHistoryIndex > 0) {
    //     const newLocPath = navigationWithButtons();
    const acquiredData = await window.electronAPI.callWithIpcGetPreviousDirContent();
    const locHistoryData = acquiredData.locHistoryData;
    const currentScope = acquiredData.currentScope;
    locHistoryIndex = locHistoryData.locHistoryIndex;

        if (locHistoryIndex > 0) {
            for (let loc of currentScope) {
                createAllLocObjects(dirsDiv, loc.dirContent, loc.locPath);
                createAllLocObjects(filenamesDiv, loc.fileContent, loc.locPath);    
            }
        } else {
            for (let loc of currentScope) {
                createAllLocObjects(dirsDiv, loc.dirContent);
            }
        }

    //     createAllLocObjects(dirsDiv, currentScope.dirContent, newLocPath);
    //     createAllLocObjects(filenamesDiv, currentScope.fileContent, newLocPath);

    //     selectedDirs = [newLocPath];
    // } else {
    //     const currentScope = navigationWithButtons();

    //     createAllLocObjects(dirsDiv, currentScope.dirContent);

    //     selectedDirs = [];
    // }

    // sortingFileDivs();

    remindScrollHeight();
})

forwardButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    
    removeDisplayedContent();
    
    // locHistoryIndex += 1;

    // const newLocPath = navigationWithButtons();
    const acquiredData = await window.electronAPI.callWithIpcGetNextDirContent();
    const locHistoryData = acquiredData.locHistoryData;
    const currentScope = acquiredData.currentScope;
    locHistoryIndex = locHistoryData.locHistoryIndex;
    
    for (let loc of currentScope) {
        createAllLocObjects(dirsDiv, loc.dirContent, loc.locPath);
        createAllLocObjects(filenamesDiv, loc.fileContent, loc.locPath);        
    }

    // selectedDirs = [newLocPath];

    // sortingFileDivs();

    remindScrollHeight();
})

dirsDiv.addEventListener('click', async (event) => {
    event.stopPropagation();

    const target = event.target;

    if (event.ctrlKey && target !== event.currentTarget) {
        removeDisplayedContent(filenamesDiv);

        let selectedLocPath;
    
        // if (locHistoryIndex == 0) {
        //     selectedLocPath = target.innerText;
        // } else {
        //     selectedLocPath = buildLocPath('fromCopy');
        //     selectedLocPath += '\\' + target.innerText;
        // }   

        // if (!selectedDirs.includes(selectedLocPath)) {
            const justFiles = true;
            const currentScope = await window.electronAPI.callWithIpcAddSelectedDirToCurrentScope(target.innerText, justFiles);
            console.log(currentScope);
            for (let loc of currentScope) {
                createAllLocObjects(filenamesDiv, loc.fileContent, loc.locPath);        
            }
                //     selectedDirs.push(selectedLocPath);
        // } else {
        //     removeDisplayedContent(selectedLocPath);         
        //     const selectedLocPathIndex = selectedDirs.indexOf(selectedLocPath);
        //     selectedDirs.splice(selectedLocPathIndex, 1);
        // }

        // sortingFileDivs();
    }
})

sortByFilenameDiv.addEventListener('click', (event) => {
    event.stopPropagation();
    const target = event.target;

    if (selectedDirs.length == 1) {
        if(alphabeticalSortingState == 1) {
            alphabeticalSortingState = 2;
        } else {
            alphabeticalSortingState += 2;   
        }
    } else if (selectedDirs.length > 1) {
        alphabeticalSortingState += 1;
    }
    sortingFileDivs();
})