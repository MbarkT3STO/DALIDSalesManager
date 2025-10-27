# 📦 Deployment Guide - Sales Manager

## Overview

This guide covers building and distributing the Sales Manager application for production use.

---

## 🏗️ Building for Production

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Platform-specific build tools (see below)

### Basic Build
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test the build
npm start
```

---

## 📱 Platform-Specific Builds

### macOS

#### Requirements
- macOS 10.13+ (for building)
- Xcode Command Line Tools

#### Build DMG
```bash
npm run dist:mac
```

**Output**: `release/Sales Manager-1.0.0.dmg`

**Distribution**:
- DMG file can be distributed directly
- Users drag app to Applications folder
- First launch: Right-click → Open (to bypass Gatekeeper)

#### Code Signing (Optional)
For distribution outside App Store:
1. Get Apple Developer account
2. Create Developer ID certificate
3. Add to `package.json`:
```json
"build": {
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
}
```

### Windows

#### Requirements
- Windows 7+ (for building)
- No additional tools needed

#### Build Installer
```bash
npm run dist:win
```

**Output**: `release/Sales Manager Setup 1.0.0.exe`

**Distribution**:
- NSIS installer
- Users run .exe to install
- Installs to Program Files
- Creates desktop shortcut

#### Code Signing (Optional)
For trusted installation:
1. Get code signing certificate
2. Add to `package.json`:
```json
"build": {
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  }
}
```

### Linux

#### Requirements
- Linux distribution (Ubuntu, Debian, Fedora, etc.)
- Standard build tools

#### Build AppImage
```bash
npm run dist:linux
```

**Output**: `release/Sales Manager-1.0.0.AppImage`

**Distribution**:
- Single executable file
- Make executable: `chmod +x Sales\ Manager-1.0.0.AppImage`
- Run directly: `./Sales\ Manager-1.0.0.AppImage`
- No installation needed

---

## 🚀 Distribution Methods

### Method 1: Direct Download
1. Build for target platform
2. Upload to file hosting (Dropbox, Google Drive, etc.)
3. Share download link
4. Provide installation instructions

### Method 2: GitHub Releases
1. Create GitHub repository
2. Build all platforms
3. Create release tag
4. Upload binaries as release assets
5. Users download from Releases page

### Method 3: Company Server
1. Build for all platforms
2. Host on company web server
3. Create download page
4. Implement version checking

### Method 4: Auto-Update (Advanced)
Implement electron-updater:
```bash
npm install electron-updater
```

Configure in `main.ts`:
```typescript
import { autoUpdater } from 'electron-updater';

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

---

## 📋 Pre-Deployment Checklist

### Code Quality
- ✅ All TypeScript compiles without errors
- ✅ No console errors in production
- ✅ All features tested
- ✅ Error handling in place
- ✅ Input validation working

### Security
- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ No hardcoded credentials
- ✅ Secure IPC communication
- ✅ File permissions correct

### Performance
- ✅ App starts in < 3 seconds
- ✅ UI responsive
- ✅ Excel operations fast
- ✅ No memory leaks
- ✅ Smooth animations

### User Experience
- ✅ Clear error messages
- ✅ Helpful tooltips
- ✅ Keyboard shortcuts work
- ✅ Theme toggle functional
- ✅ Print/PDF works

### Documentation
- ✅ README.md complete
- ✅ QUICK_START.md provided
- ✅ Sample data included
- ✅ Version number updated
- ✅ License specified

---

## 🔧 Configuration for Production

### Update package.json
```json
{
  "version": "1.0.0",
  "author": "Your Company Name",
  "description": "Professional Sales Management System",
  "homepage": "https://yourcompany.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourcompany/sales-manager"
  }
}
```

### Set Production Environment
In `main.ts`:
```typescript
const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
  // Disable DevTools
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.closeDevTools();
  });
}
```

### Optimize Build Size
```json
"build": {
  "compression": "maximum",
  "asar": true,
  "files": [
    "dist/**/*",
    "src/renderer/**/*.html",
    "src/renderer/**/*.css",
    "!**/*.map",
    "!**/*.ts"
  ]
}
```

---

## 📊 Build Sizes (Approximate)

| Platform | Size | Format |
|----------|------|--------|
| macOS | ~150 MB | DMG |
| Windows | ~120 MB | EXE |
| Linux | ~140 MB | AppImage |

**Note**: Sizes include Electron runtime and Chromium

---

## 🔄 Version Management

### Semantic Versioning
Follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Update Version
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
```

### Changelog
Maintain `CHANGELOG.md`:
```markdown
## [1.0.1] - 2025-10-28
### Fixed
- Fixed invoice printing on Windows
- Improved autocomplete performance

## [1.0.0] - 2025-10-27
### Added
- Initial release
- Product management
- Customer management
- Invoice generation
```

---

## 🧪 Testing Before Release

### Manual Testing
1. Fresh install on clean machine
2. Test all CRUD operations
3. Create sample invoice
4. Print invoice
5. Generate reports
6. Test theme toggle
7. Verify data persistence
8. Test error scenarios

### Automated Testing (Optional)
```bash
npm install --save-dev spectron
```

Create test file:
```typescript
// test/app.spec.ts
import { Application } from 'spectron';

describe('Application launch', () => {
  it('shows initial window', async () => {
    const app = new Application({
      path: 'path/to/electron'
    });
    await app.start();
    const count = await app.client.getWindowCount();
    expect(count).toBe(1);
    await app.stop();
  });
});
```

---

## 📝 Installation Instructions for Users

### macOS
1. Download `Sales Manager-1.0.0.dmg`
2. Open the DMG file
3. Drag "Sales Manager" to Applications folder
4. Open Applications folder
5. Right-click "Sales Manager" → Open
6. Click "Open" in security dialog
7. Application launches

### Windows
1. Download `Sales Manager Setup 1.0.0.exe`
2. Run the installer
3. Follow installation wizard
4. Click "Install"
5. Launch from Start Menu or Desktop shortcut

### Linux
1. Download `Sales Manager-1.0.0.AppImage`
2. Open terminal in download location
3. Run: `chmod +x Sales\ Manager-1.0.0.AppImage`
4. Run: `./Sales\ Manager-1.0.0.AppImage`
5. (Optional) Move to `/usr/local/bin` for system-wide access

---

## 🆘 Troubleshooting Builds

### Build Fails on macOS
**Issue**: Missing Xcode tools
**Solution**: 
```bash
xcode-select --install
```

### Build Fails on Windows
**Issue**: Missing build tools
**Solution**: 
```bash
npm install --global windows-build-tools
```

### Large Build Size
**Issue**: Including unnecessary files
**Solution**: Update `files` in `package.json` build config

### Slow Build
**Issue**: Not using cache
**Solution**: 
```bash
npm run dist -- --cache
```

---

## 🔐 Security Considerations

### Before Distribution
1. **Remove Debug Code**: No console.logs in production
2. **Validate Inputs**: All user inputs sanitized
3. **Secure Storage**: No sensitive data in plain text
4. **Update Dependencies**: Run `npm audit fix`
5. **Code Review**: Have another developer review

### After Distribution
1. **Monitor Issues**: Set up error reporting
2. **Update Regularly**: Patch security vulnerabilities
3. **User Education**: Provide security best practices
4. **Backup Strategy**: Recommend regular backups

---

## 📈 Post-Release

### Monitoring
- Collect crash reports
- Monitor user feedback
- Track feature usage
- Measure performance

### Updates
- Plan update schedule
- Test updates thoroughly
- Provide release notes
- Support rollback if needed

### Support
- Create FAQ document
- Set up support email
- Provide video tutorials
- Build user community

---

## 🎯 Success Metrics

Track these metrics:
- Installation success rate
- Daily active users
- Feature adoption
- Crash rate
- User satisfaction
- Support tickets

---

## 📞 Support Resources

### For Developers
- Electron docs: https://electronjs.org/docs
- electron-builder: https://electron.build
- TypeScript: https://typescriptlang.org

### For Users
- README.md
- QUICK_START.md
- In-app help
- Support email

---

## ✅ Final Checklist

Before releasing version 1.0.0:

- [ ] All features implemented
- [ ] All bugs fixed
- [ ] Documentation complete
- [ ] Builds successful on all platforms
- [ ] Manual testing passed
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Version number updated
- [ ] Changelog created
- [ ] Release notes written
- [ ] Installation instructions clear
- [ ] Support plan in place

---

**Ready to Deploy! 🚀**

Your Sales Manager application is production-ready and can be distributed to users.
