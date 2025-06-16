# 🔒 AirGap Sync
A secure file transfer tool designed for air-gapped systems using QR codes and encryption.

## 🌐 Access Options
- **Web Version**: https://air-gap-sync-web-version.onrender.com (works on mobile and desktop)
- **Offline Version**: Download the HTML file for completely offline operation

## Features
- **🔐 End-to-End Encryption**: Files are encrypted using AES-GCM encryption
- **📦 Compression**: Automatic file compression to reduce transfer size
- **📱 QR Code Transfer**: Break large files into QR code chunks for offline transfer
- **💾 USB Support**: Import/export files directly from USB drives
- **📷 Multiple Scan Methods**: Manual input, camera scanning, or image file upload
- **🔄 Progress Tracking**: Visual progress indicators for chunk transfer
- **📱 Mobile Friendly**: Fully responsive design works on smartphones and tablets

## How It Works
### Sending Files
1. Select a file (drag & drop or click to browse)
2. Enter an encryption password
3. Click "Encrypt & Generate QR Codes"
4. Display QR codes sequentially on the sending device
5. Alternatively, export directly to USB

### Receiving Files
1. Choose scan method:
   - **Manual**: Paste base64 data from QR codes
   - **Camera**: Use webcam to scan QR codes automatically
   - **File**: Upload QR code images
2. Collect all chunks in order
3. Enter the decryption password
4. Click "Decrypt & Save File"

## Security Features
- **AES-GCM Encryption**: Industry-standard encryption with authentication
- **Password-Based Key Derivation**: Uses SHA-256 for key generation
- **No Network Required**: Completely offline operation
- **Data Integrity**: Built-in verification to ensure data hasn't been tampered with

## Quick Start
1. **Web Access**: Visit https://air-gap-sync-web-version.onrender.com on any device
2. **Offline Access**: Save the `air-gap-sync.html` file to your device and open in browser
3. **No Installation Required**: Works completely offline - no server or internet needed

## Browser Requirements
- Modern browser with Web Crypto API support
- Camera access for QR scanning (optional)
- File System Access API for USB operations (Chrome/Edge)

## Usage Notes
- Larger files will generate more QR codes
- Ensure all chunks are collected before decryption
- Use strong passwords for better security
- QR codes contain base64-encoded encrypted data
- Camera scanning works best with good lighting and steady hands
- Mobile devices can scan QR codes using the rear camera for better precision

## File Support
- Any file type supported
- Automatic compression reduces transfer size
- Real-time compression ratio display
- File integrity preserved through encryption/decryption process