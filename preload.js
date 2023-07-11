const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    callWithIpcGetRootDirs: () => ipcRenderer.invoke('chanel1'),
    callWithIpcGetClickedDirContent: (clickedDirName, justFiles) => ipcRenderer.invoke('chanel2', clickedDirName, justFiles),
    callWithIpcUpdateNavigationMode: (locHistoryIndex, locHistoryLength) => ipcRenderer.on('chanel3', locHistoryIndex, locHistoryLength),
    callWithIpcGetPreviousDirContent: () => ipcRenderer.invoke('chanel4'),
    callWithIpcGetNextDirContent: () => ipcRenderer.invoke('chanel5'),
    callWithIpcAddSelectedDirToCurrentScope: (clickedDirName, justFiles) => ipcRenderer.invoke('chanel6', clickedDirName, justFiles),
    callWithIpcUpdateSortingTypeAndSort: (targetId) => ipcRenderer.invoke('chanel7', targetId),
    callWithIpcUpdateSortingIndicator: (indicatorsObj) => ipcRenderer.on('chanel8', indicatorsObj),
    getCurrentScopeDirs: (currentScopeDirs) => ipcRenderer.on('chanel9', currentScopeDirs),
    runFile: (filePath) => ipcRenderer.send('chanel10', filePath)
})