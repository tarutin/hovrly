const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Hovrly-win32-x64/'),
    authors: 'Alexey Tarutin',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    // outputDirectory: outPath,
    exe: 'Hovrly.exe',
    setupExe: 'HovrlyInstaller.exe',
    setupIcon: path.join(rootPath, 'app', 'static', 'icon.ico')
  })
}
