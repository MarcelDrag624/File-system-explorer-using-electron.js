const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    callWithIpcGetRootDirs: () => ipcRenderer.invoke('chanel1'),
    callWithIpcGetLocContent: (newLocPath, justFiles) => ipcRenderer.invoke('chanel2', newLocPath, justFiles),
})