import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('espPartitionEditor.open', async () => {

            // Step ❶ Ask user to select partition.csv
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: "Select partition.csv",
                filters: { "CSV Files": ["csv"] }
            });

            if (!fileUri || fileUri.length === 0) {
                vscode.window.showErrorMessage("No file selected");
                return;
            }

            // Read CSV file contents
            const fileData = await vscode.workspace.fs.readFile(fileUri[0]);
            const csvText = Buffer.from(fileData).toString("utf8");

            // Create webview
            const panel = vscode.window.createWebviewPanel(
                'espPartitionEditor',
                'ESP32 Partition Editor',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            // Send CSV text to webview after load
            panel.webview.onDidReceiveMessage(async (msg) => {
                if (msg.command === "saveFile") {
                    const newCsv = msg.data;
                    await vscode.workspace.fs.writeFile(fileUri[0], Buffer.from(newCsv, "utf8"));
                    vscode.window.showInformationMessage("partition.csv saved!");
                }
                if (msg.command === "showError") {
                    vscode.window.showErrorMessage(msg.text);
                }
            });

            panel.webview.html = getWebviewContent(csvText);
        })
    );
}

function getWebviewContent(csvText: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ESP Partition Editor</title>
        <style>
            :root {
                --vscode-font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                --vscode-editor-background: #1e1e1e;
                --vscode-editor-foreground: #d4d4d4;
                --vscode-button-background: #0e639c;
                --vscode-button-foreground: #ffffff;
                --vscode-button-hoverBackground: #1177bb;
                --vscode-input-background: #3c3c3c;
                --vscode-input-foreground: #cccccc;
                --vscode-input-border: #3c3c3c;
            }

            body {
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 20px;
            }

            h2 {
                margin-bottom: 20px;
            }

            .controls {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                align-items: center;
            }

            .control-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            label {
                font-size: 12px;
                font-weight: bold;
            }

            select, input {
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 5px;
                border-radius: 3px;
            }

            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 3px;
            }

            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            button.danger {
                background-color: #d32f2f;
            }
            
            button.danger:hover {
                background-color: #b71c1c;
            }

            .visual-container {
                margin-bottom: 30px;
                background: #2d2d2d;
                padding: 15px;
                border-radius: 5px;
            }

            .bar-container {
                display: flex;
                height: 40px;
                width: 100%;
                background: #333;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .bar-segment {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: white;
                overflow: hidden;
                white-space: nowrap;
                transition: width 0.3s ease;
                position: relative;
            }
            
            .bar-segment:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #000;
                padding: 4px 8px;
                border-radius: 4px;
                z-index: 10;
                white-space: nowrap;
            }

            .legend {
                display: flex;
                gap: 15px;
                margin-top: 10px;
                font-size: 12px;
                flex-wrap: wrap;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .color-box {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }

            th, td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #333;
            }

            th {
                background-color: #252526;
            }

            input.cell-input {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid transparent;
                background: transparent;
                color: inherit;
            }

            input.cell-input:focus {
                border-color: var(--vscode-button-background);
                background: var(--vscode-input-background);
            }

            .actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
            }

            .stats {
                margin-top: 10px;
                font-size: 13px;
                color: #aaa;
            }

            .error-text {
                color: #f48771;
                margin-top: 5px;
                font-size: 12px;
                display: none;
            }
        </style>
    </head>
    <body>
        <h2>ESP Partition Editor</h2>

        <div class="controls">
            <div class="control-group">
                <label>Flash Size</label>
                <select id="flashSize" onchange="updateVisuals()">
                    <option value="4194304">4 MB</option>
                    <option value="8388608">8 MB</option>
                    <option value="16777216">16 MB</option>
                    <option value="33554432">32 MB</option>
                </select>
            </div>
            <div class="control-group">
                <label>Chip Model</label>
                <select id="chipModel">
                    <option value="esp32">ESP32</option>
                    <option value="esp32s2">ESP32-S2</option>
                    <option value="esp32c3">ESP32-C3</option>
                    <option value="esp32s3">ESP32-S3</option>
                </select>
            </div>
        </div>

        <div class="visual-container">
            <div class="bar-container" id="partitionBar"></div>
            <div class="legend" id="legend"></div>
            <div class="stats" id="stats"></div>
            <div class="error-text" id="errorText"></div>
        </div>

        <table id="partitionTable">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>SubType</th>
                    <th>Offset</th>
                    <th>Size</th>
                    <th>Flags</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="tableBody"></tbody>
        </table>

        <div class="actions">
            <button onclick="addRow()">+ Add Partition</button>
            <button id="saveBtn">Save Changes</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const csvData = \`${csvText.replace(/`/g, "\\`")}\`;
            
            let partitions = [];
            
            // Colors for different partition types
            const TYPE_COLORS = {
                'app': '#4caf50',
                'data': '#2196f3',
                'nvs': '#ff9800',
                'phy': '#9c27b0',
                'factory': '#009688',
                'other': '#607d8b'
            };

            function parseSize(sizeStr) {
                if (!sizeStr) return 0;
                sizeStr = sizeStr.toString().trim().toLowerCase();
                let multiplier = 1;
                if (sizeStr.endsWith('k')) {
                    multiplier = 1024;
                    sizeStr = sizeStr.slice(0, -1);
                } else if (sizeStr.endsWith('m')) {
                    multiplier = 1024 * 1024;
                    sizeStr = sizeStr.slice(0, -1);
                }
                
                if (sizeStr.startsWith('0x')) {
                    return parseInt(sizeStr, 16) * multiplier;
                }
                return parseInt(sizeStr) * multiplier;
            }

            function formatSize(bytes) {
                if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
                return bytes + ' B';
            }

            function parseCSV() {
                const lines = csvData.split('\\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
                partitions = lines.map(line => {
                    const cols = line.split(',').map(c => c.trim());
                    return {
                        name: cols[0] || '',
                        type: cols[1] || '',
                        subtype: cols[2] || '',
                        offset: cols[3] || '',
                        size: cols[4] || '',
                        flags: cols[5] || ''
                    };
                });
                renderTable();
                updateVisuals();
            }

            function renderTable() {
                const tbody = document.getElementById('tableBody');
                tbody.innerHTML = '';
                
                partitions.forEach((p, index) => {
                    const row = tbody.insertRow();
                    
                    ['name', 'type', 'subtype', 'offset', 'size', 'flags'].forEach(field => {
                        const cell = row.insertCell();
                        const input = document.createElement('input');
                        input.className = 'cell-input';
                        input.value = p[field];
                        input.onchange = (e) => {
                            partitions[index][field] = e.target.value;
                            updateVisuals();
                        };
                        cell.appendChild(input);
                    });

                    const actionCell = row.insertCell();
                    const delBtn = document.createElement('button');
                    delBtn.innerText = '×';
                    delBtn.className = 'danger';
                    delBtn.style.padding = '4px 8px';
                    delBtn.onclick = () => {
                        partitions.splice(index, 1);
                        renderTable();
                        updateVisuals();
                    };
                    actionCell.appendChild(delBtn);
                });
            }

            function addRow() {
                partitions.push({
                    name: 'new_part',
                    type: 'data',
                    subtype: 'undefined',
                    offset: '',
                    size: '4K',
                    flags: ''
                });
                renderTable();
                updateVisuals();
            }

            function updateVisuals() {
                const flashSize = parseInt(document.getElementById('flashSize').value);
                const bar = document.getElementById('partitionBar');
                const stats = document.getElementById('stats');
                const errorText = document.getElementById('errorText');
                
                bar.innerHTML = '';
                let totalUsed = 0;
                let currentOffset = 0x8000; // Default start offset for ESP32 (usually 0x8000 or 0x1000 depending on bootloader)
                
                // Sort partitions by offset if possible, or just assume sequential for now?
                // Actually, let's just map them as they are, but calculate sizes.
                
                partitions.forEach(p => {
                    const sizeBytes = parseSize(p.size);
                    const widthPercent = (sizeBytes / flashSize) * 100;
                    
                    const div = document.createElement('div');
                    div.className = 'bar-segment';
                    div.style.width = widthPercent + '%';
                    
                    // Determine color
                    let color = TYPE_COLORS['other'];
                    if (p.type === 'app') color = TYPE_COLORS['app'];
                    if (p.type === 'data') {
                        if (p.name === 'nvs') color = TYPE_COLORS['nvs'];
                        else if (p.name === 'phy_init') color = TYPE_COLORS['phy'];
                        else color = TYPE_COLORS['data'];
                    }
                    
                    div.style.backgroundColor = color;
                    div.title = \`\${p.name} (\${formatSize(sizeBytes)})\`;
                    div.innerText = p.name;
                    
                    bar.appendChild(div);
                    totalUsed += sizeBytes;
                });

                const freeBytes = flashSize - totalUsed;
                const usedPercent = (totalUsed / flashSize) * 100;
                
                stats.innerText = \`Used: \${formatSize(totalUsed)} (\${usedPercent.toFixed(1)}%) | Free: \${formatSize(freeBytes)}\`;
                
                if (totalUsed > flashSize) {
                    errorText.style.display = 'block';
                    errorText.innerText = \`⚠️ Warning: Total partition size exceeds flash size by \${formatSize(totalUsed - flashSize)}!\`;
                } else {
                    errorText.style.display = 'none';
                }
            }

            document.getElementById('saveBtn').onclick = () => {
                let output = "# Name,   Type, SubType, Offset,  Size, Flags\\n";
                partitions.forEach(p => {
                    output += \`\${p.name}, \${p.type}, \${p.subtype}, \${p.offset}, \${p.size}, \${p.flags}\\n\`;
                });
                vscode.postMessage({ command: "saveFile", data: output });
            };

            // Initialize
            parseCSV();
        </script>
    </body>
    </html>`;
}
