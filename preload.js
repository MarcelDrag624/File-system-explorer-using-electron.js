const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    callWithIpcGetRootDirs: () => ipcRenderer.invoke('chanel1'),
    callWithIpcGetClickedDirContent: (clickedDirName, justFiles) => ipcRenderer.invoke('chanel2', clickedDirName, justFiles),
    callWithIpcUpdateNavigationMode: (locHistoryIndex, locHistoryLength) => ipcRenderer.on('chanel3', locHistoryIndex, locHistoryLength),
    callWithIpcGetPreviousDirContent: () => ipcRenderer.invoke('chanel4'),
    callWithIpcGetNextDirContent: () => ipcRenderer.invoke('chanel5'),
    callWithIpcAddSelectedDirToCurrentScope: (clickedDirName, justFiles) => ipcRenderer.invoke('chanel6', clickedDirName, justFiles),
})