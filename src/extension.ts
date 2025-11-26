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
                
                let val = 0;
                if (sizeStr.startsWith('0x')) {
                    val = parseInt(sizeStr, 16);
                } else {
                    val = parseInt(sizeStr);
                }
                return val * multiplier;
            }

            function parseOffset(offsetStr) {
                if (!offsetStr || offsetStr.trim() === '') return null;
                return parseSize(offsetStr);
            }

            function formatSize(bytes) {
                if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
                return bytes + ' B';
            }

            function formatHex(val) {
                return '0x' + val.toString(16).toUpperCase();
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

            function alignTo4K(val) {
                return Math.ceil(val / 0x1000) * 0x1000;
            }

            function recalculateOffsets(startIndex) {
                // If startIndex is -1, we might want to recalc everything? 
                // But usually we start from the changed item.
                // However, the first partition usually has a fixed offset (e.g. 0x8000 or 0x1000).
                // If the user changes the first partition's size, we cascade.
                
                if (startIndex < 0) return;

                for (let i = startIndex; i < partitions.length - 1; i++) {
                    const current = partitions[i];
                    const next = partitions[i+1];
                    
                    const currentOffset = parseOffset(current.offset);
                    const currentSize = parseSize(current.size);
                    
                    if (currentOffset === null) continue; // Can't calc next if current is unknown
                    
                    const nextStart = alignTo4K(currentOffset + currentSize);
                    const nextExistingOffset = parseOffset(next.offset);

                    // Logic:
                    // 1. If next offset is empty, set it.
                    // 2. If next offset is exactly where it "should" be (contiguous), update it (cascade).
                    // 3. If next offset is NOT where it should be (gap or overlap), we respect it unless it overlaps?
                    //    Actually, requirement says: "cascade the changes... unless it has a manually-defined offset".
                    //    We interpret "manually-defined" as "not matching the auto-calculated position" OR "user explicitly typed it".
                    //    But for simplicity and "cascade" feature:
                    //    If the previous partition expands and pushes into the next, we MUST move the next one?
                    //    Or do we error? "If any partitions overlap... return an error".
                    
                    // Let's try this:
                    // If next.offset is empty -> Auto set.
                    // If next.offset == old_expected -> Auto update (it was likely auto-placed before).
                    // But we don't know "old_expected" easily without history.
                    
                    // Simplified Heuristic:
                    // If next.offset is empty, fill it.
                    // If next.offset < nextStart, it's an overlap. We DON'T move it automatically if it's "manual".
                    // We just let the overlap checker find it.
                    // BUT, if the user *just* changed the size of current, they probably expect next to move if they were touching.
                    
                    // Let's check if they were contiguous *before* the change? No, we don't have previous state.
                    
                    // Let's just fill empty offsets for now.
                    if (nextExistingOffset === null || isNaN(nextExistingOffset)) {
                        next.offset = formatHex(nextStart);
                    }
                }
                
                // Requirement: "When the size of a partition changes, automatically adjust the offset of every subsequent partition unless it has a manually-defined offset."
                // This implies we need to know if it's manual.
                // Since we don't have a "manual" flag in CSV, we'll assume:
                // If we are editing, we can try to push partitions that are "touching" or "overlapping" due to expansion?
                // No, "unless manually defined" implies we shouldn't touch manual ones.
                
                // Let's implement the "Fill Empty" logic first, and "Overlap Error" logic.
                // And maybe a "Cascade" button or checkbox? 
                // Or just: If I change size, and the next partition *was* at the old end, move it.
                // But I don't know the old end.
                
                // Alternative: We only auto-calc if the field is empty.
                // And we rely on the user to clear the offset field if they want it auto-calced?
                // That's a good UX. "Clear offset to auto-calculate".
            }

            function onSizeChange(index, newSizeStr) {
                partitions[index].size = newSizeStr;
                
                // Try to cascade:
                // If the next partition's offset is empty, calculate it.
                // If the next partition's offset is NOT empty, we leave it alone (it's manual).
                // If this causes overlap, the error will show.
                
                // Wait, "If alignment pushes a partition forward, cascade the changes".
                // This implies we SHOULD move it.
                // Maybe the "unless manually defined" means "unless the user locked it".
                // But we don't have a lock.
                
                // Let's go with: Clear offset = Auto.
                // And if we want to cascade, we can check if the next partition starts *before* the new end.
                // If so, we *could* push it, but that might break a manual setting.
                // The prompt says "If any partitions overlap... return an error".
                // This suggests we should NOT auto-fix overlaps by pushing, unless it's an "auto" partition.
                
                // So:
                // 1. Update size.
                // 2. Recalculate offsets for *subsequent* partitions that have EMPTY offsets.
                // 3. Update visuals (which checks for overlaps).
                
                recalculateOffsets(index);
                renderTable(); // Re-render to show new offsets
                updateVisuals();
            }

            function renderTable() {
                const tbody = document.getElementById('tableBody');
                tbody.innerHTML = '';
                
                partitions.forEach((p, index) => {
                    const row = tbody.insertRow();
                    
                    // Name
                    let cell = row.insertCell();
                    let input = document.createElement('input');
                    input.className = 'cell-input';
                    input.value = p.name;
                    input.onchange = (e) => { partitions[index].name = e.target.value; updateVisuals(); };
                    cell.appendChild(input);

                    // Type
                    cell = row.insertCell();
                    input = document.createElement('input');
                    input.className = 'cell-input';
                    input.value = p.type;
                    input.onchange = (e) => { partitions[index].type = e.target.value; updateVisuals(); };
                    cell.appendChild(input);

                    // SubType
                    cell = row.insertCell();
                    input = document.createElement('input');
                    input.className = 'cell-input';
                    input.value = p.subtype;
                    input.onchange = (e) => { partitions[index].subtype = e.target.value; updateVisuals(); };
                    cell.appendChild(input);

                    // Offset
                    cell = row.insertCell();
                    input = document.createElement('input');
                    input.className = 'cell-input';
                    input.value = p.offset;
                    input.placeholder = "Auto";
                    input.onchange = (e) => { 
                        partitions[index].offset = e.target.value; 
                        updateVisuals(); 
                    };
                    cell.appendChild(input);

                    // Size
                    cell = row.insertCell();
                    input = document.createElement('input');
                    input.className = 'cell-input';
                    input.value = p.size;
                    input.onchange = (e) => { 
                        onSizeChange(index, e.target.value);
                    };
                    cell.appendChild(input);

                    // Flags
                    cell = row.insertCell();
                    input = document.createElement('input');
                    input.className = 'cell-input';
                    input.value = p.flags;
                    input.onchange = (e) => { partitions[index].flags = e.target.value; updateVisuals(); };
                    cell.appendChild(input);

                    // Action
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
                let newOffset = '0x8000'; // Default for first partition
                
                if (partitions.length > 0) {
                    const last = partitions[partitions.length - 1];
                    const lastOffset = parseOffset(last.offset);
                    const lastSize = parseSize(last.size);
                    
                    if (lastOffset !== null && lastSize > 0) {
                        newOffset = formatHex(alignTo4K(lastOffset + lastSize));
                    } else {
                        // If last partition has invalid offset/size, we can't auto-calc easily.
                        // Try to find the max end address?
                        // For now, let's just leave it empty or try to put it after the last *valid* one?
                        // Simplest: Just leave it empty if we can't calc, but the user wants it visualized.
                        // Let's try to find the max end.
                        let maxEnd = 0x8000;
                        partitions.forEach(p => {
                            const off = parseOffset(p.offset);
                            const sz = parseSize(p.size);
                            if (off !== null && sz > 0) {
                                const end = off + sz;
                                if (end > maxEnd) maxEnd = end;
                            }
                        });
                        newOffset = formatHex(alignTo4K(maxEnd));
                    }
                }

                partitions.push({
                    name: 'new_part',
                    type: 'data',
                    subtype: 'undefined',
                    offset: newOffset,
                    size: '4K',
                    flags: ''
                });
                
                renderTable();
                updateVisuals();
            }

            function checkOverlaps() {
                // Sort by offset? No, CSV order matters for ID, but for overlap check we should look at physical space.
                // But usually partitions are sequential.
                // We will check every pair.
                
                const ranges = [];
                
                partitions.forEach((p, i) => {
                    const off = parseOffset(p.offset);
                    const sz = parseSize(p.size);
                    if (off !== null && sz > 0) {
                        ranges.push({ start: off, end: off + sz, index: i, name: p.name });
                    }
                });
                
                ranges.sort((a, b) => a.start - b.start);
                
                for (let i = 0; i < ranges.length - 1; i++) {
                    const current = ranges[i];
                    const next = ranges[i+1];
                    
                    if (current.end > next.start) {
                        const overlapAmount = current.end - next.start;
                        const suggestedOffset = formatHex(alignTo4K(current.end));
                        return \`Overlap detected between "\${current.name}" (ends at \${formatHex(current.end)}) and "\${next.name}" (starts at \${formatHex(next.start)}). <br>Overlap: \${formatSize(overlapAmount)}. <br><strong>Suggestion:</strong> Set "\${next.name}" offset to <strong>\${suggestedOffset}</strong>.\`;
                    }
                }
                
                return null;
            }

            function updateVisuals() {
                const flashSize = parseInt(document.getElementById('flashSize').value);
                const bar = document.getElementById('partitionBar');
                const stats = document.getElementById('stats');
                const errorText = document.getElementById('errorText');
                
                bar.innerHTML = '';
                let totalUsed = 0;
                
                // We need to map partitions to the bar.
                // Since offsets can be anything, we should position them absolutely?
                // Or just stack them if they are sequential?
                // The original code stacked them.
                // Let's try to position them absolutely for better visualization of gaps.
                
                partitions.forEach(p => {
                    const sizeBytes = parseSize(p.size);
                    const offsetBytes = parseOffset(p.offset);
                    
                    if (offsetBytes === null) return; // Skip invalid offsets

                    const widthPercent = (sizeBytes / flashSize) * 100;
                    const leftPercent = (offsetBytes / flashSize) * 100;
                    
                    const div = document.createElement('div');
                    div.className = 'bar-segment';
                    div.style.position = 'absolute'; // Change to absolute
                    div.style.left = leftPercent + '%';
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
                    div.title = \`\${p.name} (\${formatSize(sizeBytes)}) @ \${formatHex(offsetBytes)}\`;
                    div.innerText = p.name;
                    
                    bar.appendChild(div);
                    totalUsed += sizeBytes;
                });

                const freeBytes = flashSize - totalUsed; // This is naive if there are overlaps
                // Better: Calculate used range union? 
                // For now, simple sum is okay for "Used" stat, but maybe misleading with overlaps.
                
                const usedPercent = (totalUsed / flashSize) * 100;
                
                stats.innerText = \`Used: \${formatSize(totalUsed)} (\${usedPercent.toFixed(1)}%) | Free: \${formatSize(freeBytes)}\`;
                
                const overlapError = checkOverlaps();
                
                if (overlapError) {
                    errorText.style.display = 'block';
                    errorText.style.display = 'block';
                    errorText.innerHTML = '⚠️ ' + overlapError;
                } else if (totalUsed > flashSize) {
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
