const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadFile('index.html')
}

async function getRootDirs() {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory']})
    if (canceled) {
        return
    } else {
        return filePaths[0]
    }
}

function getLocContent(event, newLocPath, justFiles = false) {
    contentMixed = fs.readdirSync(newLocPath)
    dirContent = []
    fileContent = []
    contentSeparated = []

    if (justFiles) {
        for (let contentElement of contentMixed) {
            try {
                if (fs.statSync(newLocPath+"\\"+contentElement).isFile()) {
                    fileContent.push(contentElement)
                }
            } catch (err) {}
        }

        contentSeparated = {dirContent, fileContent}
        return contentSeparated  
        
    } else {
        for (let contentElement of contentMixed) {
            try {
                if (fs.statSync(newLocPath+"\\"+contentElement).isDirectory()) {
                    dirContent.push(contentElement)
                } else if (fs.statSync(newLocPath+"\\"+contentElement).isFile()) {
                    fileContent.push(contentElement)
                }
            } catch (err) {}
        }

        contentSeparated = {dirContent, fileContent}
        return contentSeparated   

    }
}

app.whenReady().then(() => {
    ipcMain.handle('chanel1', getRootDirs)
    ipcMain.handle('chanel2', getLocContent)
    createWindow()
})