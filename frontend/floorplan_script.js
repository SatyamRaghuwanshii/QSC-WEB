document.addEventListener('DOMContentLoaded', () => {
    const designerCanvas = document.getElementById('designerCanvas');
    const ctx = designerCanvas.getContext('2d');
    const designerCanvasContainer = document.getElementById('designerCanvasContainer');

    const drawWallToolBtn = document.getElementById('drawWallTool');
    const selectToolBtn = document.getElementById('selectTool');
    const createRoomToolBtn = document.getElementById('createRoomTool');
    const addDoorToolBtn = document.getElementById('addDoorTool');
    const addWindowToolBtn = document.getElementById('addWindowTool');
    const roomNameContainer = document.getElementById('roomNameContainer');
    const roomNameInput = document.getElementById('roomNameInput');
    const deleteBtn = document.getElementById('deleteBtn');
    const copyBtn = document.getElementById('copyBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const wallThicknessInput = document.getElementById('wallThickness');
    const coordinatesDisplay = document.getElementById('coordinatesDisplay');
    const statusMessage = document.getElementById('statusMessage');
    const exportToQSCBtn = document.getElementById('exportToQSCBtn');
    const drawnElementsCount = document.getElementById('drawnElementsCount');
    const drawnElementsList = document.getElementById('drawnElementsList');
    
    const roomTemplatesSection = document.getElementById('roomTemplatesSection');
    const templateItems = document.querySelectorAll('.template-item');

    // --- Configuration Constants ---
    const PIXELS_PER_METER = 30;
    const GRID_SIZE = 1;
    const SELECT_TOLERANCE_M = 0.5;
    const COPY_OFFSET_M = 1;

    // --- Global State ---
    let currentMode = 'DRAW_WALL';
    let isDrawing = false;
    let isDragging = false;
    let isPanning = false;
    let startPoint = null;
    let endPoint = null;
    let dragStart = null;
    let panStart = null;
    let drawnElements = [];
    let selectedElement = null;

    let view = {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0
    };

    let selectedRoomIdForDetails = null;

    // History state for undo/redo
    let history = [[]];
    let historyIndex = 0;

    function saveState() {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(JSON.parse(JSON.stringify(drawnElements)));
        historyIndex = history.length - 1;
    }

    function loadState(index) {
        if (index >= 0 && index < history.length) {
            historyIndex = index;
            drawnElements = JSON.parse(JSON.stringify(history[historyIndex]));
            selectedElement = null;
            selectedRoomIdForDetails = null;
            updateUIForSelection();
        }
    }

    function undo() {
        if (historyIndex > 0) {
            loadState(historyIndex - 1);
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            loadState(historyIndex + 1);
        }
    }

    // --- Helper Functions ---
    function getMeterCoords(x, y) {
        const rect = designerCanvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        return {
            x: (canvasX - view.offsetX) / (PIXELS_PER_METER * view.scale),
            y: (canvasY - view.offsetY) / (PIXELS_PER_METER * view.scale)
        };
    }

    function snapToGrid(x, y) {
        return {
            x: Math.round(x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(y / GRID_SIZE) * GRID_SIZE
        };
    }

    function getDistance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    function generateId(prefix = 'el') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // --- Drawing & Rendering Functions ---
    function drawGrid() {
        const rect = designerCanvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;

        const gridSizePx = GRID_SIZE * PIXELS_PER_METER * view.scale;

        const startX = view.offsetX;
        const startY = view.offsetY;

        for (let y = startY % gridSizePx; y < canvasHeight; y += gridSizePx) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }

        for (let x = startX % gridSizePx; x < canvasWidth; x += gridSizePx) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
    }

    function drawText(text, xPx, yPx, color, font = '14px Arial', align = 'center', baseline = 'middle') {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(text, xPx, yPx);
    }

    function drawRoom(room, isSelected = false) {
        ctx.save();
        const xPx = room.x * PIXELS_PER_METER;
        const yPx = room.y * PIXELS_PER_METER;
        const widthPx = room.width * PIXELS_PER_METER;
        const heightPx = room.height * PIXELS_PER_METER;

        ctx.fillStyle = isSelected ? 'rgba(63, 81, 181, 0.4)' : 'rgba(240, 240, 240, 0.7)';
        ctx.fillRect(xPx, yPx, widthPx, heightPx);
        ctx.strokeStyle = isSelected ? '#3f51b5' : '#888';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(xPx, yPx, widthPx, heightPx);

        const centerX = xPx + widthPx / 2;
        const centerY = yPx + heightPx / 2;
        const area = (room.width * room.height).toFixed(2);
        drawText(`${room.name}`, centerX, centerY - 15, isSelected ? '#3f51b5' : '#444', '16px Arial');
        drawText(`${area} m²`, centerX, centerY + 15, isSelected ? '#3f51b5' : '#444', '14px Arial');

        ctx.restore();
    }

    function drawWall(wall, isSelected = false) {
        if (getDistance({x: wall.x1, y: wall.y1}, {x: wall.x2, y: wall.y2}) === 0) {
            return;
        }
        
        const wallThicknessPx = wall.thickness * PIXELS_PER_METER;
        const halfThickness = wallThicknessPx / 2;

        const dx = (wall.x2 - wall.x1) * PIXELS_PER_METER;
        const dy = (wall.y2 - wall.y1) * PIXELS_PER_METER;
        const angle = Math.atan2(dy, dx);
        const wallLengthPx = Math.sqrt(dx ** 2 + dy ** 2);

        ctx.save();
        ctx.translate(wall.x1 * PIXELS_PER_METER, wall.y1 * PIXELS_PER_METER);
        ctx.rotate(angle);

        ctx.fillStyle = isSelected ? '#3f51b5' : '#444';
        ctx.strokeStyle = isSelected ? '#3f51b5' : '#333';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.fillRect(0, -halfThickness, wallLengthPx, wallThicknessPx);
        ctx.strokeRect(0, -halfThickness, wallLengthPx, wallThicknessPx);

        const lengthM = getDistance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }).toFixed(2);
        drawText(`${lengthM}m`, wallLengthPx / 2, -halfThickness - 10, isSelected ? '#3f51b5' : '#555');

        ctx.restore();
    }

    function isPointInRoom(meterX, meterY, room) {
        return drawnElements.some(el => el.type === 'wall' && el.parent === room.id && isPointInWall(meterX, meterY, el));
    }

    function isPointInWall(meterX, meterY, wall) {
        const x1 = wall.x1;
        const y1 = wall.y1;
        const x2 = wall.x2;
        const y2 = wall.y2;
        const thickness = wall.thickness;
        const tolerance = thickness / 2 + SELECT_TOLERANCE_M;

        const lineLength = getDistance({ x: x1, y: y1 }, { x: x2, y: y2 });
        if (lineLength === 0) return false;

        const t = ((meterX - x1) * (x2 - x1) + (meterY - y1) * (y2 - y1)) / (lineLength ** 2);
        const clampedT = Math.max(0, Math.min(1, t));

        const closestPointX = x1 + clampedT * (x2 - x1);
        const closestPointY = y1 + clampedT * (y2 - y1);

        const distanceSq = (meterX - closestPointX) ** 2 + (meterY - closestPointY) ** 2;

        return distanceSq <= tolerance ** 2;
    }

    function selectElement(meterX, meterY) {
        selectedElement = null;
        selectedRoomIdForDetails = null;
        for (let i = drawnElements.length - 1; i >= 0; i--) {
            const element = drawnElements[i];
            if (element.type === 'room' && isPointInRoom(meterX, meterY, element)) {
                selectedElement = element;
                selectedRoomIdForDetails = element.id;
                break;
            }
            if (element.type === 'wall' && !element.parent && isPointInWall(meterX, meterY, element)) {
                selectedElement = element;
                break;
            }
        }
        updateUIForSelection();
    }

    function updateUIForSelection() {
        if (selectedElement) {
            deleteBtn.style.display = 'block';
            copyBtn.style.display = 'block';
            rotateBtn.style.display = (selectedElement.type === 'wall' && !selectedElement.parent) ? 'block' : 'none';
            statusMessage.textContent = 'Element selected. Drag to move.';
            if (selectedElement.type === 'room') {
                roomNameContainer.classList.remove('hidden');
                roomNameInput.value = selectedElement.name;
            } else {
                roomNameContainer.classList.add('hidden');
                roomNameInput.value = '';
            }
        } else {
            deleteBtn.style.display = 'none';
            copyBtn.style.display = 'none';
            rotateBtn.style.display = 'none';
            roomNameContainer.classList.add('hidden');
            roomNameInput.value = '';
            statusMessage.textContent = 'Ready to select/move.';
        }
        updateDrawnElementsList();
        render();
    }

    function updateDrawnElementsList() {
        drawnElementsList.innerHTML = '';
        const totalVisibleElements = drawnElements.filter(el => el.type === 'room' || (el.type === 'wall' && !el.parent)).length;
        drawnElementsCount.textContent = totalVisibleElements;

        if (drawnElements.length === 0) {
            drawnElementsList.innerHTML = '<p>No elements drawn yet.</p>';
            return;
        }

        const listContent = document.createElement('div');
        const standaloneElements = drawnElements.filter(el => !el.parent && el.type !== 'wall');
        const standaloneWalls = drawnElements.filter(el => el.type === 'wall' && !el.parent);

        standaloneElements.filter(el => el.type === 'room').forEach(room => {
            const roomGroup = document.createElement('div');
            const area = (room.width * room.height).toFixed(2);
            roomGroup.innerHTML = `
                <div class="drawn-element-item group-header ${room === selectedElement ? 'selected' : ''}" data-id="${room.id}" data-type="room">
                    <strong>${room.name}</strong> (${area} m²)
                </div>
            `;
            listContent.appendChild(roomGroup);

            if (selectedRoomIdForDetails === room.id) {
                const wallList = document.createElement('div');
                wallList.className = 'group-content';
                const wallsOfRoom = drawnElements.filter(el => el.type === 'wall' && el.parent === room.id);
                wallsOfRoom.forEach(wall => {
                    const wallItem = document.createElement('div');
                    wallItem.className = `drawn-element-item`;
                    const lengthM = getDistance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }).toFixed(2);
                    wallItem.textContent = `Wall: ${lengthM}m`;
                    wallList.appendChild(wallItem);
                });
                listContent.appendChild(wallList);
            }
        });

        standaloneWalls.forEach(wall => {
            const wallItem = document.createElement('div');
            wallItem.className = `drawn-element-item ${wall === selectedElement ? 'selected' : ''}`;
            wallItem.dataset.id = wall.id;
            wallItem.dataset.type = 'wall';
            const lengthM = getDistance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }).toFixed(2);
            wallItem.textContent = `Wall: ${lengthM}m`;
            listContent.appendChild(wallItem);
        });

        drawnElementsList.innerHTML = '';
        drawnElementsList.appendChild(listContent);

        drawnElementsList.querySelectorAll('.drawn-element-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type;

                const elementToSelect = drawnElements.find(el => el.id === id);

                if (elementToSelect) {
                    selectedElement = elementToSelect;
                    selectedRoomIdForDetails = (type === 'room') ? id : null;
                } else {
                    selectedElement = null;
                    selectedRoomIdForDetails = null;
                }
                updateUIForSelection();
            });
        });
    }

    function render() {
        const rect = designerCanvasContainer.getBoundingClientRect();
        designerCanvas.width = rect.width;
        designerCanvas.height = rect.height;

        ctx.clearRect(0, 0, designerCanvas.width, designerCanvas.height);

        ctx.save();
        ctx.translate(view.offsetX, view.offsetY);
        ctx.scale(view.scale, view.scale);

        drawGrid();

        const elementsToDraw = drawnElements.slice();
        elementsToDraw.forEach(element => {
            const isHighlighted = (selectedElement && element.id === selectedElement.id) ||
                                  (selectedElement && selectedElement.type === 'room' && element.parent === selectedElement.id);

            if (element.type === 'wall') {
                drawWall(element, isHighlighted);
            } else if (element.type === 'room') {
                drawRoom(element, isHighlighted);
            }
        });

        if (isDrawing && startPoint && endPoint) {
            if (currentMode === 'DRAW_WALL') {
                const tempWall = {
                    x1: startPoint.x,
                    y1: startPoint.y,
                    x2: endPoint.x,
                    y2: endPoint.y,
                    thickness: parseFloat(wallThicknessInput.value)
                };
                ctx.globalAlpha = 0.5;
                drawWall(tempWall, true);
                ctx.globalAlpha = 1.0;
            } else if (currentMode === 'CREATE_ROOM') {
                const thickness = parseFloat(wallThicknessInput.value);
                const tempRoom = {
                    x: Math.min(startPoint.x, endPoint.x),
                    y: Math.min(startPoint.y, endPoint.y),
                    width: Math.abs(endPoint.x - startPoint.x),
                    height: Math.abs(endPoint.y - startPoint.y),
                    name: roomNameInput.value || 'New Room'
                };
                ctx.globalAlpha = 0.5;
                drawRoom(tempRoom, true);
                
                ctx.fillStyle = '#3f51b5';
                const halfThickness = thickness / 2 * PIXELS_PER_METER;

                ctx.fillRect(tempRoom.x * PIXELS_PER_METER, tempRoom.y * PIXELS_PER_METER - halfThickness, tempRoom.width * PIXELS_PER_METER, thickness * PIXELS_PER_METER);
                ctx.fillRect(tempRoom.x * PIXELS_PER_METER, (tempRoom.y + tempRoom.height) * PIXELS_PER_METER - halfThickness, tempRoom.width * PIXELS_PER_METER, thickness * PIXELS_PER_METER);
                ctx.fillRect(tempRoom.x * PIXELS_PER_METER - halfThickness, tempRoom.y * PIXELS_PER_METER, thickness * PIXELS_PER_METER, tempRoom.height * PIXELS_PER_METER);
                ctx.fillRect((tempRoom.x + tempRoom.width) * PIXELS_PER_METER - halfThickness, tempRoom.y * PIXELS_PER_METER, thickness * PIXELS_PER_METER, tempRoom.height * PIXELS_PER_METER);
                ctx.globalAlpha = 1.0;
            }
        }
        ctx.restore();
    }

    function exportToQSC() {
        if (drawnElements.length === 0) {
            statusMessage.textContent = 'Please draw some walls or rooms to export.';
            return;
        }

        const exportableData = [];
        const rooms = drawnElements.filter(el => el.type === 'room');
        const standaloneWalls = drawnElements.filter(el => el.type === 'wall' && el.parent === undefined);

        // Process rooms first
        rooms.forEach(room => {
            const roomArea = room.width * room.height;
            // Only export floor area if it's a valid size
            if (roomArea > 0.1) {
                exportableData.push({
                    type: 'concrete',
                    name: `${room.name} (Floor)`,
                    length: room.width,
                    width: room.height,
                    height: 0.15,
                    concreteMix: '1:2:4',
                    wasteFactor: 5
                });
            }
        });

        // Process all walls (both standalone and part of rooms)
        drawnElements.forEach(element => {
            if (element.type === 'wall') {
                const wallLength = getDistance({ x: element.x1, y: element.y1 }, { x: element.x2, y: element.y2 });
                // Only export walls that have a valid length
                if (wallLength > 0.1) {
                    const wallThickness = element.thickness;
                    exportableData.push({
                        type: 'bricks',
                        name: element.parent ? `${drawnElements.find(el => el.id === element.parent).name} - Wall` : `Standalone Wall`,
                        wallLength: wallLength,
                        wallHeight: 3.0,
                        wallThickness: wallThickness,
                        mortarMix: '1:4',
                        wasteFactor: 5
                    });
                }
            }
        });

        sessionStorage.setItem('exportedPlanElements', JSON.stringify(exportableData));
        
        window.location.href = 'qsc.html';
    }

    // --- Event Handlers for Canvas Interactions ---
    designerCanvas.addEventListener('mousedown', (e) => {
        const meterCoords = getMeterCoords(e.clientX, e.clientY);
        const snappedCoords = snapToGrid(meterCoords.x, meterCoords.y);

        if (e.button === 0) {
            if (currentMode === 'DRAW_WALL' || currentMode === 'CREATE_ROOM') {
                isDrawing = true;
                startPoint = snappedCoords;
                endPoint = { ...startPoint };
                render();
            } else if (currentMode === 'SELECT') {
                selectElement(meterCoords.x, meterCoords.y);
                if (selectedElement) {
                    isDragging = true;
                    dragStart = meterCoords;
                    if (selectedElement.type === 'room') {
                        selectedElement.initialCoords = { x: selectedElement.x, y: selectedElement.y };
                        drawnElements.filter(el => el.parent === selectedElement.id).forEach(wall => {
                            wall.initialCoords = { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 };
                        });
                    } else {
                        selectedElement.initialCoords = { x1: selectedElement.x1, y1: selectedElement.y1, x2: selectedElement.x2, y2: selectedElement.y2 };
                    }
                }
            }
        } else if (e.button === 2) {
            isPanning = true;
            panStart = { x: e.clientX, y: e.clientY };
            designerCanvas.style.cursor = 'grabbing';
        }
    });

    designerCanvas.addEventListener('mousemove', (e) => {
        const meterCoords = getMeterCoords(e.clientX, e.clientY);
        coordinatesDisplay.textContent = `X: ${meterCoords.x.toFixed(2)}m, Y: ${meterCoords.y.toFixed(2)}m`;

        if (isDrawing) {
            endPoint = snapToGrid(meterCoords.x, meterCoords.y);
            render();
        } else if (currentMode === 'SELECT' && isDragging && selectedElement) {
            const dragDx = meterCoords.x - dragStart.x;
            const dragDy = meterCoords.y - dragStart.y;

            if (selectedElement.type === 'wall') {
                selectedElement.x1 = selectedElement.initialCoords.x1 + dragDx;
                selectedElement.y1 = selectedElement.initialCoords.y1 + dragDy;
                selectedElement.x2 = selectedElement.initialCoords.x2 + dragDx;
                selectedElement.y2 = selectedElement.initialCoords.y2 + dragDy;
            } else if (selectedElement.type === 'room') {
                selectedElement.x = selectedElement.initialCoords.x + dragDx;
                selectedElement.y = selectedElement.initialCoords.y + dragDy;

                drawnElements.filter(el => el.parent === selectedElement.id).forEach(wall => {
                    wall.x1 = wall.initialCoords.x1 + dragDx;
                    wall.y1 = wall.initialCoords.y1 + dragDy;
                    wall.x2 = wall.initialCoords.x2 + dragDx;
                    wall.y2 = wall.initialCoords.y2 + dragDy;
                });
            }

            render();
        } else if (isPanning) {
            const panDx = e.clientX - panStart.x;
            const panDy = e.clientY - panStart.y;
            view.offsetX += panDx;
            view.offsetY += panDy;
            panStart = { x: e.clientX, y: e.clientY };
            render();
        }
    });

    designerCanvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            if (isDrawing && startPoint && endPoint) {
                const wallLength = getDistance(startPoint, endPoint);
                if (currentMode === 'DRAW_WALL' && wallLength > 0.1) {
                    drawnElements.push({
                        id: generateId('wall'),
                        type: 'wall',
                        x1: startPoint.x,
                        y1: startPoint.y,
                        x2: endPoint.x,
                        y2: endPoint.y,
                        thickness: parseFloat(wallThicknessInput.value)
                    });
                    saveState();
                } else if (currentMode === 'CREATE_ROOM') {
                    const roomWidth = Math.abs(endPoint.x - startPoint.x);
                    const roomHeight = Math.abs(endPoint.y - startPoint.y);
                    if (roomWidth > 0.1 && roomHeight > 0.1) {
                        const thickness = parseFloat(wallThicknessInput.value);
                        const minX = Math.min(startPoint.x, endPoint.x);
                        const minY = Math.min(startPoint.y, endPoint.y);
                        const roomName = roomNameInput.value || 'New Room';
                        const roomId = generateId('room');

                        drawnElements.push({
                            id: roomId,
                            type: 'room',
                            x: minX,
                            y: minY,
                            width: roomWidth,
                            height: roomHeight,
                            name: roomName
                        });

                        const walls = [
                            { id: generateId('wall'), type: 'wall', parent: roomId, x1: minX, y1: minY, x2: minX + roomWidth, y2: minY, thickness: thickness },
                            { id: generateId('wall'), type: 'wall', parent: roomId, x1: minX, y1: minY + roomHeight, x2: minX + roomWidth, y2: minY + roomHeight, thickness: thickness },
                            { id: generateId('wall'), type: 'wall', parent: roomId, x1: minX, y1: minY, x2: minX, y2: minY + roomHeight, thickness: thickness },
                            { id: generateId('wall'), type: 'wall', parent: roomId, x1: minX + roomWidth, y1: minY, x2: minX + roomWidth, y2: minY + roomHeight, thickness: thickness }
                        ];
                        drawnElements.push(...walls);
                        saveState();
                    }
                }
                isDrawing = false;
                startPoint = null;
                endPoint = null;
                updateUIForSelection();
            } else if (currentMode === 'SELECT' && isDragging) {
                isDragging = false;
                dragStart = null;
                if (selectedElement) {
                    if (selectedElement.initialCoords) {
                       saveState();
                    }
                    if (selectedElement.type === 'room') {
                        selectedElement.initialCoords = null;
                        drawnElements.filter(el => el.parent === selectedElement.id).forEach(wall => {
                            wall.initialCoords = null;
                        });
                    } else {
                        selectedElement.initialCoords = null;
                    }
                }
                render();
            }
        } else if (e.button === 2) {
            if (isPanning) {
                isPanning = false;
                panStart = null;
                designerCanvas.style.cursor = 'grab';
                render();
            }
        }
    });

    designerCanvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    designerCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const oldScale = view.scale;

        if (e.deltaY < 0) {
            view.scale += zoomIntensity;
        } else {
            view.scale -= zoomIntensity;
        }

        view.scale = Math.max(0.1, Math.min(view.scale, 5.0));

        const scaleChange = view.scale / oldScale;
        view.offsetX = e.offsetX - (e.offsetX - view.offsetX) * scaleChange;
        view.offsetY = e.offsetY - (e.offsetY - view.offsetY) * scaleChange;

        render();
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if (e.key === 'Z' && e.shiftKey) {
                e.preventDefault();
                redo();
            }
        }

        switch (e.key.toLowerCase()) {
            case 'w':
                setMode('DRAW_WALL');
                break;
            case 's':
                setMode('SELECT');
                break;
            case 'r':
                setMode('CREATE_ROOM');
                break;
            case 'd':
                if (selectedElement) {
                    deleteBtn.click();
                }
                break;
            case 'c':
                if (selectedElement) {
                    copyBtn.click();
                }
                break;
        }
    });

    // --- UI Button Event Listeners ---
    function setMode(mode) {
        currentMode = mode;
        [drawWallToolBtn, selectToolBtn, createRoomToolBtn, addDoorToolBtn, addWindowToolBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        if (roomTemplatesSection) {
            roomTemplatesSection.classList.add('hidden');
        }

        if (mode === 'DRAW_WALL') {
            drawWallToolBtn.classList.add('active');
            statusMessage.textContent = 'Ready to draw walls.';
            designerCanvas.style.cursor = 'crosshair';
        } else if (mode === 'SELECT') {
            selectToolBtn.classList.add('active');
            statusMessage.textContent = 'Ready to select/move.';
            designerCanvas.style.cursor = 'grab';
        } else if (mode === 'CREATE_ROOM') {
            createRoomToolBtn.classList.add('active');
            statusMessage.textContent = 'Click and drag to create a new room, or select a template.';
            designerCanvas.style.cursor = 'crosshair';
            if (roomTemplatesSection) {
                roomTemplatesSection.classList.remove('hidden');
            }
        }

        selectedElement = null;
        selectedRoomIdForDetails = null;
        updateUIForSelection();
    }

    drawWallToolBtn.addEventListener('click', () => setMode('DRAW_WALL'));
    selectToolBtn.addEventListener('click', () => setMode('SELECT'));
    createRoomToolBtn.addEventListener('click', () => setMode('CREATE_ROOM'));
    addDoorToolBtn.addEventListener('click', () => {
        statusMessage.textContent = 'Door placement not yet implemented.';
    });
    addWindowToolBtn.addEventListener('click', () => {
        statusMessage.textContent = 'Window placement not yet implemented.';
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedElement) {
            if (selectedElement.type === 'room') {
                drawnElements = drawnElements.filter(el => el.parent !== selectedElement.id && el.id !== selectedElement.id);
            } else {
                drawnElements = drawnElements.filter(el => el.id !== selectedElement.id);
            }
            selectedElement = null;
            selectedRoomIdForDetails = null;
            statusMessage.textContent = 'Element deleted.';
            saveState();
            updateUIForSelection();
        }
    });

    copyBtn.addEventListener('click', () => {
        if (selectedElement) {
            const offset = COPY_OFFSET_M;
            let copiedElements = [];
            let copiedElementId;

            if (selectedElement.type === 'wall') {
                copiedElements.push({ ...selectedElement, id: generateId('wall'), parent: selectedElement.parent, x1: selectedElement.x1 + offset, y1: selectedElement.y1 + offset, x2: selectedElement.x2 + offset, y2: selectedElement.y2 + offset });
            } else if (selectedElement.type === 'room') {
                const newRoomId = generateId('room');
                copiedElements.push({ ...selectedElement, id: newRoomId, x: selectedElement.x + offset, y: selectedElement.y + offset });

                const wallsToCopy = drawnElements.filter(el => el.parent === selectedElement.id);
                wallsToCopy.forEach(wall => {
                    copiedElements.push({ ...wall, id: generateId('wall'), parent: newRoomId, x1: wall.x1 + offset, y1: wall.y1 + offset, x2: wall.x2 + offset, y2: wall.y2 + offset });
                });
            }

            drawnElements.push(...copiedElements);
            selectedElement = copiedElements.find(el => el.type === selectedElement.type);
            selectedRoomIdForDetails = (selectedElement.type === 'room') ? selectedElement.id : null;
            statusMessage.textContent = 'Element copied.';
            saveState();
            updateUIForSelection();
        }
    });

    rotateBtn.addEventListener('click', () => {
        if (selectedElement && selectedElement.type === 'wall') {
            const wall = selectedElement;
            const center = { x: (wall.x1 + wall.x2) / 2, y: (wall.y1 + wall.y2) / 2 };
            const angle = Math.PI / 2;

            const rotatedX1 = center.x + (wall.x1 - center.x) * Math.cos(angle) - (wall.y1 - center.y) * Math.sin(angle);
            const rotatedY1 = center.y + (wall.x1 - center.x) * Math.sin(angle) + (wall.y1 - center.y) * Math.cos(angle);

            const rotatedX2 = center.x + (wall.x2 - center.x) * Math.cos(angle) - (wall.y2 - center.y) * Math.sin(angle);
            const rotatedY2 = center.y + (wall.x2 - center.x) * Math.sin(angle) + (wall.y2 - center.y) * Math.cos(angle);

            wall.x1 = rotatedX1;
            wall.y1 = rotatedY1;
            wall.x2 = rotatedX2;
            wall.y2 = rotatedY2;

            statusMessage.textContent = 'Element rotated by 90 degrees.';
            saveState();
            updateUIForSelection();
        }
    });
    
    templateItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const templateName = item.dataset.templateName;
            const width = parseFloat(item.dataset.width);
            const height = parseFloat(item.dataset.height);
            
            if (width <= 0 || height <= 0) {
                statusMessage.textContent = 'Error: Invalid template dimensions.';
                return;
            }

            const thickness = parseFloat(wallThicknessInput.value);
            const roomId = generateId('room');

            const canvasRect = designerCanvas.getBoundingClientRect();
            const centerX = (canvasRect.width / 2) / (PIXELS_PER_METER * view.scale);
            const centerY = (canvasRect.height / 2) / (PIXELS_PER_METER * view.scale);
            
            const startX = centerX - width / 2;
            const startY = centerY - height / 2;
            
            drawnElements.push({
                id: roomId,
                type: 'room',
                x: startX,
                y: startY,
                width: width,
                height: height,
                name: templateName
            });

            const walls = [
                { id: generateId('wall'), type: 'wall', parent: roomId, x1: startX, y1: startY, x2: startX + width, y2: startY, thickness: thickness },
                { id: generateId('wall'), type: 'wall', parent: roomId, x1: startX, y1: startY + height, x2: startX + width, y2: startY + height, thickness: thickness },
                { id: generateId('wall'), type: 'wall', parent: roomId, x1: startX, y1: startY, x2: startX, y2: startY + height, thickness: thickness },
                { id: generateId('wall'), type: 'wall', parent: roomId, x1: startX + width, y1: startY, x2: startX + width, y2: startY + height, thickness: thickness }
            ];
            drawnElements.push(...walls);
            saveState();

            selectedElement = drawnElements.find(el => el.id === roomId);
            selectedRoomIdForDetails = roomId;
            updateUIForSelection();
        });
    });

    roomNameInput.addEventListener('input', () => {
        if (selectedElement && selectedElement.type === 'room') {
            selectedElement.name = roomNameInput.value || 'New Room';
            updateDrawnElementsList();
            render();
        }
    });

    exportToQSCBtn.addEventListener('click', exportToQSC);

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target === designerCanvasContainer) {
                render();
            }
        }
    });
    resizeObserver.observe(designerCanvasContainer);

    updateUIForSelection();
    render();
});