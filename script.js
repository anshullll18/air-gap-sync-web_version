
      // Global variables
      let currentMode = "send";
      let currentScanMode = "manual";
      let selectedFile = null;
      let processedData = null;
      let qrChunks = [];
      let currentChunkIndex = 0;
      let collectedChunks = [];
      let stream = null;

      // Mode switching
      function switchMode(mode) {
        currentMode = mode;
        document
          .querySelectorAll(".mode-btn")
          .forEach((btn) => btn.classList.remove("active"));
        document
          .querySelector(`[onclick="switchMode('${mode}')"]`)
          .classList.add("active");

        document
          .querySelectorAll(".section")
          .forEach((section) => section.classList.remove("active"));
        document.getElementById(`${mode}-section`).classList.add("active");
      }

      function setScanMode(mode) {
        currentScanMode = mode;
        document
          .querySelectorAll(".scan-btn")
          .forEach((btn) => btn.classList.remove("active"));
        document
          .querySelector(`[onclick="setScanMode('${mode}')"]`)
          .classList.add("active");

        document
          .querySelectorAll(".scan-method")
          .forEach((method) => (method.style.display = "none"));
        document.getElementById(
          `${mode}-${mode === "manual" ? "input" : "scan"}`
        ).style.display = "block";
      }

      // File handling
      function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add("dragover");
      }

      function handleDragLeave(e) {
        e.currentTarget.classList.remove("dragover");
      }

      function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleFile(files[0]);
        }
      }

      function handleFileSelect(e) {
        if (e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      }

      function handleFile(file) {
        selectedFile = file;
        document.getElementById("fileName").textContent = file.name;
        document.getElementById("originalSize").textContent = formatBytes(
          file.size
        );
        document.getElementById("file-selected").style.display = "block";

        // Simulate compression calculation
        const estimatedCompressed = Math.floor(file.size * 0.7); // Rough estimate
        document.getElementById("compressedSize").textContent =
          formatBytes(estimatedCompressed);
        document.getElementById("compressionRatio").textContent =
          Math.floor((1 - estimatedCompressed / file.size) * 100) + "%";
      }

      function formatBytes(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      }

      // File processing
      async function processFile() {
        if (!selectedFile || !document.getElementById("sendPassword").value) {
          alert("Please select a file and enter a password");
          return;
        }

        const password = document.getElementById("sendPassword").value;

        try {
          // Read file
          const fileBuffer = await selectedFile.arrayBuffer();
          const fileData = new Uint8Array(fileBuffer);

          // Real compression using pako
          const compressed = pako.deflate(fileData);
          document.getElementById("compressedSize").textContent = formatBytes(
            compressed.length
          );
          document.getElementById("compressionRatio").textContent =
            Math.floor((1 - compressed.length / fileData.length) * 100) + "%";

          // Real encryption using Web Crypto API
          const encrypted = await encryptData(compressed, password);

          // Generate QR chunks
          generateQRChunks(encrypted);

          document.getElementById("qr-display-section").style.display = "block";
        } catch (error) {
          alert("Error processing file: " + error.message);
        }
      }

      async function encryptData(data, password) {
        // Generate key from password
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const keyData = await crypto.subtle.digest("SHA-256", passwordData);
        const key = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "AES-GCM" },
          false,
          ["encrypt"]
        );

        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt
        const encrypted = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          key,
          data
        );

        // Combine IV and encrypted data
        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), iv.length);

        return result;
      }

      async function decryptData(encryptedData, password) {
        // Extract IV (first 12 bytes)
        const iv = encryptedData.slice(0, 12);
        const data = encryptedData.slice(12);

        // Generate key from password
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const keyData = await crypto.subtle.digest("SHA-256", passwordData);
        const key = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          key,
          data
        );

        return new Uint8Array(decrypted);
      }

      function generateQRChunks(data) {
        const chunkSize = 1000; // bytes per QR code
        const chunks = [];

        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          const base64Chunk = btoa(String.fromCharCode.apply(null, chunk));
          chunks.push(base64Chunk);
        }

        qrChunks = chunks;
        currentChunkIndex = 0;
        document.getElementById("totalChunks").textContent = chunks.length;

        displayCurrentChunk();
      }

      function displayCurrentChunk() {
        if (qrChunks.length === 0) return;

        const chunk = qrChunks[currentChunkIndex];
        document.getElementById("currentChunk").textContent =
          currentChunkIndex + 1;

        // Generate actual QR code
        const qrContainer = document.getElementById("qrCode");
        qrContainer.innerHTML = ""; // Clear previous QR code

        new QRCode(qrContainer, {
          text: chunk,
          width: 256,
          height: 256,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });

        document.getElementById("base64Display").textContent = chunk;

        // Update progress
        const progress = ((currentChunkIndex + 1) / qrChunks.length) * 100;
        document.getElementById("qrProgress").style.width = progress + "%";

        // Update navigation buttons
        document.getElementById("prevBtn").disabled = currentChunkIndex === 0;
        document.getElementById("nextBtn").disabled =
          currentChunkIndex === qrChunks.length - 1;
      }

      function prevChunk() {
        if (currentChunkIndex > 0) {
          currentChunkIndex--;
          displayCurrentChunk();
        }
      }

      function nextChunk() {
        if (currentChunkIndex < qrChunks.length - 1) {
          currentChunkIndex++;
          displayCurrentChunk();
        }
      }

      // Receive functionality
      function addChunk() {
        const input = document.getElementById("qrInput").value.trim();
        if (!input) return;

        try {
          // Validate base64
          atob(input);

          collectedChunks.push(input);
          updateChunksList();
          document.getElementById("qrInput").value = "";

          if (collectedChunks.length > 0) {
            document.getElementById("decryptBtn").disabled = false;
          }
        } catch (error) {
          alert("Invalid base64 data");
        }
      }

      function updateChunksList() {
        document.getElementById("chunksCollected").textContent =
          collectedChunks.length;
        const list = document.getElementById("chunksList");
        list.innerHTML = collectedChunks
          .map(
            (chunk, index) =>
              `<div style="margin: 0.5rem 0; padding: 0.5rem; background: #e9ecef; border-radius: 4px;">
                    Chunk ${index + 1}: ${chunk.length} chars
                    <button onclick="removeChunk(${index})" style="margin-left: 1rem; padding: 0.2rem 0.5rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
                </div>`
          )
          .join("");
      }

      function removeChunk(index) {
        collectedChunks.splice(index, 1);
        updateChunksList();

        if (collectedChunks.length === 0) {
          document.getElementById("decryptBtn").disabled = true;
        }
      }

      function logReceive(message, type = "info") {
        const log = document.getElementById("receiveLog");
        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
      }

      async function decryptAndSave() {
        const password = document.getElementById("receivePassword").value;
        if (!password) {
          alert("Please enter the decryption password");
          return;
        }

        if (collectedChunks.length === 0) {
          alert("No chunks collected");
          return;
        }

        try {
          logReceive("Starting decryption...", "info");

          // Combine all chunks
          let combinedData = "";
          for (const chunk of collectedChunks) {
            combinedData += chunk;
          }

          // Decode from base64
          const encryptedData = Uint8Array.from(atob(combinedData), (c) =>
            c.charCodeAt(0)
          );
          logReceive(`Combined data: ${encryptedData.length} bytes`, "success");

          // Decrypt
          logReceive("Decrypting...", "info");
          const decrypted = await decryptData(encryptedData, password);

          // Decompress
          logReceive("Decompressing...", "info");
          const decompressed = pako.inflate(decrypted);

          logReceive(
            `Decryption successful: ${decompressed.length} bytes`,
            "success"
          );

          // Create download
          const blob = new Blob([decompressed]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "received_file";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          logReceive("File saved successfully!", "success");
        } catch (error) {
          logReceive(`Error: ${error.message}`, "error");
        }
      }

      // Camera functionality
      async function startCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          const video = document.getElementById("video");
          video.srcObject = stream;
          video.play();

          // Start QR code scanning
          scanQRCode();
        } catch (error) {
          alert("Error accessing camera: " + error.message);
        }
      }

      function stopCamera() {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          stream = null;
          document.getElementById("video").srcObject = null;
        }
      }

      function captureQR() {
        const video = document.getElementById("video");
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          try {
            // Validate base64
            atob(code.data);

            // Add chunk if it's not already collected
            if (!collectedChunks.includes(code.data)) {
              collectedChunks.push(code.data);
              updateChunksList();
              logReceive(`QR code captured successfully!`, "success");

              if (collectedChunks.length > 0) {
                document.getElementById("decryptBtn").disabled = false;
              }
            } else {
              logReceive("QR code already collected", "info");
            }
          } catch (error) {
            logReceive(`Invalid QR code data: ${error.message}`, "error");
          }
        } else {
          logReceive("No QR code found in frame", "error");
        }
      }

      function scanQRCode() {
        const video = document.getElementById("video");
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        function scan() {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: "dontInvert",
              }
            );

            if (code) {
              // Found a QR code
              try {
                // Validate base64
                atob(code.data);

                // Add chunk if it's not already collected
                if (!collectedChunks.includes(code.data)) {
                  collectedChunks.push(code.data);
                  updateChunksList();
                  logReceive(`QR code scanned successfully!`, "success");

                  if (collectedChunks.length > 0) {
                    document.getElementById("decryptBtn").disabled = false;
                  }
                }
              } catch (error) {
                logReceive(`Invalid QR code data: ${error.message}`, "error");
              }
            }
          }

          if (stream) {
            requestAnimationFrame(scan);
          }
        }

        scan();
      }

      function scanImageFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
          const img = new Image();
          img.onload = function () {
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: "dontInvert",
              }
            );

            if (code) {
              try {
                // Validate base64
                atob(code.data);

                // Add chunk if it's not already collected
                if (!collectedChunks.includes(code.data)) {
                  collectedChunks.push(code.data);
                  updateChunksList();
                  logReceive(`QR code scanned successfully!`, "success");

                  if (collectedChunks.length > 0) {
                    document.getElementById("decryptBtn").disabled = false;
                  }
                }
              } catch (error) {
                logReceive(`Invalid QR code data: ${error.message}`, "error");
              }
            } else {
              logReceive("No QR code found in image", "error");
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      // Add USB export functionality
      async function exportToUSB() {
        if (!selectedFile) {
          alert("Please select a file first");
          return;
        }

        try {
          // Create a directory handle
          const dirHandle = await window.showDirectoryPicker();

          // Create a file in the selected directory
          const fileHandle = await dirHandle.getFileHandle(selectedFile.name, {
            create: true,
          });
          const writable = await fileHandle.createWritable();

          // Write the file
          await writable.write(selectedFile);
          await writable.close();

          alert("File exported to USB successfully!");
        } catch (error) {
          alert("Error exporting to USB: " + error.message);
        }
      }

      // Add USB import functionality
      async function importFromUSB() {
        try {
          // Show file picker
          const [fileHandle] = await window.showOpenFilePicker();
          const file = await fileHandle.getFile();

          // Handle the file
          handleFile(file);

          alert("File imported from USB successfully!");
        } catch (error) {
          alert("Error importing from USB: " + error.message);
        }
      }

      // Initialize
      document.addEventListener("DOMContentLoaded", function () {
        logReceive("AirGap Sync ready", "success");
      });