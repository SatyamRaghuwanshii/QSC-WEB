// File: frontend/qsc.js

document.addEventListener('DOMContentLoaded', () => {
    const materialTypeSelect = document.getElementById('materialType');
    const concreteInputs = document.getElementById('concreteInputs');
    const brickInputs = document.getElementById('brickInputs');
    const steelInputs = document.getElementById('steelInputs');
    const plasteringInputs = document.getElementById('plasteringInputs');
    const roofingInputs = document.getElementById('roofingInputs');
    const earthworkInputs = document.getElementById('earthworkInputs');
    const tankInputs = document.getElementById('tankInputs');

    const steelTypeSelect = document.getElementById('steelType');
    const steelBarsInputs = document.getElementById('steelBarsInputs');
    const steelStirrupsInputs = document.getElementById('steelStirrupsInputs');

    const plasteringMaterialTypeSelect = document.getElementById('plasteringMaterialType');
    const plasteringSubInputs = document.getElementById('plasteringSubInputs');
    const flooringSubInputs = document.getElementById('flooringSubInputs');
    const paintingSubInputs = document.getElementById('paintingSubInputs');
    
    const roofingTypeSelect = document.getElementById('roofingType');
    const rccSlabInputs = document.getElementById('rccSlabInputs');
    const trussRoofInputs = document.getElementById('trussRoofInputs');

    const tankShapeSelect = document.getElementById('tankShape');
    const rectangularTankInputs = document.getElementById('rectangularTankInputs');
    const cylindricalTankInputs = document.getElementById('cylindricalTankInputs');


    const calculateBtn = document.getElementById('calculateBtn');
    const resultsDiv = document.getElementById('results');

    const projectNameInput = document.getElementById('projectNameInput');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const saveMessageDiv = document.getElementById('saveMessage');

    const projectListSelect = document.getElementById('projectList');
    const loadProjectBtn = document.getElementById('loadProjectBtn');
    const refreshProjectsBtn = document.getElementById('refreshProjectsBtn');
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    const loadMessageDiv = document.getElementById('loadMessage');

    const projectCalculationsSection = document.getElementById('projectCalculationsSection');
    const projectCalculationsList = document.getElementById('projectCalculationsList');
    const currentProjectCalculationsCount = document.getElementById('currentProjectCalculationsCount');
    const addCalculationToProjectBtn = document.getElementById('addCalculationToProjectBtn');
    const clearCurrentFormBtn = document.getElementById('clearCurrentFormBtn');
    const startNewProjectBtn = document.getElementById('startNewProjectBtn');
    const calculationsListMessage = document.getElementById('calculationsListMessage');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const generatePDFReportBtn = document.getElementById('generatePDFReportBtn');

    let currentLoadedProjectName = null;
    let currentProjectData = { calculations: [] };
    let currentEditingCalculationId = null;

    const materialPrices = {
        'cement_bags': 400,
        'sand_m3': 2500,
        'aggregate_m3': 1800,
        'bricks_nos': 12,
        'steel_kg': 65,
        'tiles_m2': 400,
        'paint_Ltr': 350,
        'truss_roof_m2': 1000, 
        'earthwork_m3': 500, 
        'tank_volume_m3': 4000
    };

    function displayCalculationsListMessage(message, isSuccess) {
        calculationsListMessage.textContent = message;
        calculationsListMessage.className = 'message-area';
        if (isSuccess) {
            calculationsListMessage.classList.add('success');
        } else {
            calculationsListMessage.classList.add('error');
        }
        setTimeout(() => {
            calculationsListMessage.textContent = '';
            calculationsListMessage.className = 'message-area';
        }, 5000);
    }

    function showInputsForMaterial(selectedMaterial) {
        const allInputs = document.querySelectorAll('.material-inputs');
        allInputs.forEach(inputDiv => {
            inputDiv.classList.add('hidden');
        });

        if (selectedMaterial === 'concrete') {
            concreteInputs.classList.remove('hidden');
        } else if (selectedMaterial === 'bricks') {
            brickInputs.classList.remove('hidden');
        } else if (selectedMaterial === 'steel') {
            steelInputs.classList.remove('hidden');
            showSteelSubInputs(steelTypeSelect.value);
        } else if (selectedMaterial === 'plastering') {
            plasteringInputs.classList.remove('hidden');
            showPlasteringSubInputs(plasteringMaterialTypeSelect.value);
        } else if (selectedMaterial === 'roofing') {
            roofingInputs.classList.remove('hidden');
            showRoofingSubInputs(roofingTypeSelect.value);
        } else if (selectedMaterial === 'earthwork') {
            earthworkInputs.classList.remove('hidden');
        } else if (selectedMaterial === 'tank') {
            tankInputs.classList.remove('hidden');
            showTankSubInputs(tankShapeSelect.value);
        }
        resultsDiv.innerHTML = '';
        saveMessageDiv.innerHTML = '';
        loadMessageDiv.innerHTML = '';
        calculationsListMessage.innerHTML = '';
    }
    
    function showSteelSubInputs(selectedType) {
        steelBarsInputs.classList.add('hidden');
        steelStirrupsInputs.classList.add('hidden');
        if (selectedType === 'bars') {
            steelBarsInputs.classList.remove('hidden');
        } else if (selectedType === 'stirrups') {
            steelStirrupsInputs.classList.remove('hidden');
        }
    }

    function showPlasteringSubInputs(selectedType) {
        plasteringSubInputs.classList.add('hidden');
        flooringSubInputs.classList.add('hidden');
        paintingSubInputs.classList.add('hidden');
        if (selectedType === 'plastering') {
            plasteringSubInputs.classList.remove('hidden');
        } else if (selectedType === 'flooring') {
            flooringSubInputs.classList.remove('hidden');
        } else if (selectedType === 'painting') {
            paintingSubInputs.classList.remove('hidden');
        }
    }
    
    function showRoofingSubInputs(selectedType) {
        rccSlabInputs.classList.add('hidden');
        trussRoofInputs.classList.add('hidden');
        if (selectedType === 'rcc_slab') {
            rccSlabInputs.classList.remove('hidden');
        } else if (selectedType === 'truss_roof') {
            trussRoofInputs.classList.remove('hidden');
        }
    }
    
    function showTankSubInputs(selectedShape) {
        rectangularTankInputs.classList.add('hidden');
        cylindricalTankInputs.classList.add('hidden');
        if (selectedShape === 'rectangular') {
            rectangularTankInputs.classList.remove('hidden');
        } else if (selectedShape === 'cylindrical') {
            cylindricalTankInputs.classList.remove('hidden');
        }
    }


    function displayProjectCalculations() {
        projectCalculationsList.innerHTML = '';
        currentProjectCalculationsCount.textContent = currentProjectData.calculations.length;

        if (currentProjectData.calculations.length === 0) {
            projectCalculationsList.innerHTML = '<p>No calculations added yet for this project.</p>';
            return;
        }

        currentProjectData.calculations.forEach(calc => {
            const calcItem = document.createElement('div');
            calcItem.className = 'calculation-item';
            if (currentEditingCalculationId === calc._id) {
                calcItem.classList.add('selected');
            }
            if (calc._id) {
                calcItem.dataset.id = calc._id;
            } else {
                console.warn("Calculation item missing _id:", calc);
            }

            const calcName = calc.name || 'Untitled Calculation';
            const calcType = calc.type || 'unknown';

            let summaryText = ``;
            if (calcType === 'concrete') {
                summaryText = `Vol: ${calc.calculated.wetVolume.toFixed(2)} m³ | Cement: ${calc.calculated.cementBags.toFixed(1)} bags`;
            } else if (calcType === 'bricks') {
                summaryText = `Bricks: ${calc.calculated.totalBricks} Nos. | Cement: ${calc.calculated.cementMortarBags} bags`;
            } else if (calcType === 'steel') {
                 summaryText = `Steel: ${calc.calculated.totalWeight.toFixed(2)} kg`;
            } else if (calcType === 'plastering') {
                if (calc.plasteringMaterialType === 'plastering') {
                     summaryText = `Area: ${calc.surfaceArea.toFixed(2)} m² | Cement: ${calc.calculated.cementBags.toFixed(1)} bags`;
                } else if (calc.plasteringMaterialType === 'flooring') {
                    summaryText = `Area: ${calc.surfaceArea.toFixed(2)} m² | Tiles: ${calc.calculated.tilesNeeded} pcs`;
                } else if (calc.plasteringMaterialType === 'painting') {
                    summaryText = `Area: ${calc.surfaceArea.toFixed(2)} m² | Paint: ${calc.calculated.paintNeeded.toFixed(2)} Ltr`;
                }
            } else if (calcType === 'roofing') {
                 if (calc.roofingType === 'rcc_slab') {
                     summaryText = `RCC Slab: ${calc.calculated.wetVolume.toFixed(2)} m³`;
                 } else if (calc.roofingType === 'truss_roof') {
                     summaryText = `Truss Roof Area: ${calc.trussArea.toFixed(2)} m²`;
                 }
            } else if (calcType === 'earthwork') {
                summaryText = `Volume: ${calc.calculated.totalVolume.toFixed(2)} m³`;
            } else if (calc.type === 'tank') {
                summaryText = `Volume: ${calc.calculated.volume.toFixed(2)} m³`;
            }

            calcItem.innerHTML = `
                <div class="calculation-item-info">
                    <strong>${calcName}</strong> (${calcType})<br>
                    ${summaryText}
                </div>
                <div class="calculation-item-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;

            projectCalculationsList.appendChild(calcItem);
        });

        projectCalculationsList.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const calcId = event.target.closest('.calculation-item').dataset.id;
                editCalculation(calcId);
            });
        });

        projectCalculationsList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const calcId = event.target.closest('.calculation-item').dataset.id;
                deleteCalculation(calcId);
            });
        });
    }

    showInputsForMaterial(materialTypeSelect.value);


    function calculateConcrete(data) {
        const length = data?.length || parseFloat(document.getElementById('length').value);
        const width = data?.width || parseFloat(document.getElementById('width').value);
        const height = data?.height || parseFloat(document.getElementById('height').value);
        const concreteMixInput = data?.concreteMix || document.getElementById('concreteMix').value;
        const wasteFactor = data?.wasteFactor || parseFloat(document.getElementById('wasteFactor').value) || 0;
    
        if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter valid positive dimensions for Concrete (Length, Width, Height).</p>';
            return null;
        }
        if (wasteFactor < 0 || wasteFactor > 100) {
            resultsDiv.innerHTML = '<p class="error-message">Waste factor must be between 0 and 100.</p>';
            return null;
        }
    
        const mixParts = concreteMixInput.split(':').map(part => parseFloat(part.trim()));
        if (mixParts.length !== 3 || mixParts.some(isNaN) || mixParts.some(part => part <= 0)) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter a valid concrete mix ratio (e.g., 1:2:4).</p>';
            return null;
        }
    
        const [cementPart, sandPart, aggregatePart] = mixParts;
        const sumOfParts = cementPart + sandPart + aggregatePart;
    
        const wetVolume = length * width * height;
        const dryVolume = wetVolume * 1.54;
    
        const cementVolume = (cementPart / sumOfParts) * dryVolume;
        const sandVolume = (sandPart / sumOfParts) * dryVolume;
        const aggregateVolume = (aggregatePart / sumOfParts) * dryVolume;
    
        const cementInKg = cementVolume * 1440;
        let cementBagsInitial = cementInKg / 50;
    
        const actualWetVolume = wetVolume * (1 + wasteFactor / 100);
        const actualDryVolume = dryVolume * (1 + wasteFactor / 100);
        const actualCementVolume = cementVolume * (1 + wasteFactor / 100);
        const actualSandVolume = sandVolume * (1 + wasteFactor / 100);
        const actualAggregateVolume = aggregateVolume * (1 + wasteFactor / 100);
        const actualCementBags = cementBagsInitial * (1 + wasteFactor / 100);
    
        return {
            type: 'concrete',
            name: data?.name || 'Concrete Calculation',
            length: length,
            width: width,
            height: height,
            wasteFactor: wasteFactor,
            concreteMix: concreteMixInput,
            calculated: {
                wetVolume: actualWetVolume,
                dryVolume: actualDryVolume,
                cementVolume: actualCementVolume,
                sandVolume: actualSandVolume,
                aggregateVolume: actualAggregateVolume,
                cementBags: actualCementBags,
            }
        };
    }
    
    function calculateBricks(data) {
        const wallLength = data?.wallLength || parseFloat(document.getElementById('brickWallLength').value);
        const wallHeight = data?.wallHeight || parseFloat(document.getElementById('brickWallHeight').value);
        const wallThickness = data?.wallThickness || parseFloat(document.getElementById('brickWallThickness').value);
        const mortarMixInput = data?.mortarMix || document.getElementById('mortarMix').value;
        const brickSizeLength = data?.brickSizeLength || parseFloat(document.getElementById('brickSizeLength').value);
        const brickSizeWidth = data?.brickSizeWidth || parseFloat(document.getElementById('brickSizeWidth').value);
        const brickSizeHeight = data?.brickSizeHeight || parseFloat(document.getElementById('brickSizeHeight').value);
        const mortarJointThickness = data?.mortarJointThickness || parseFloat(document.getElementById('mortarJointThickness').value);
        const wasteFactor = data?.wasteFactor || parseFloat(document.getElementById('brickWasteFactor').value) || 0;

        if (isNaN(wallLength) || isNaN(wallHeight) || isNaN(wallThickness) || wallLength <= 0 || wallHeight <= 0 || wallThickness <= 0) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter valid positive wall dimensions (Length, Height, Thickness).</p>';
            return null;
        }
        if (isNaN(brickSizeLength) || isNaN(brickSizeWidth) || isNaN(brickSizeHeight) || brickSizeLength <= 0 || brickSizeWidth <= 0 || brickSizeHeight <= 0) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter valid positive brick dimensions.</p>';
            return null;
        }
        if (isNaN(mortarJointThickness) || mortarJointThickness < 0) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter a valid mortar joint thickness (0 or positive).</p>';
            return null;
        }
        if (wasteFactor < 0 || wasteFactor > 100) {
            resultsDiv.innerHTML = '<p class="error-message">Waste factor must be between 0 and 100.</p>';
            return null;
        }

        const mortarParts = mortarMixInput.split(':').map(part => parseFloat(part.trim()));
        if (mortarParts.length !== 2 || mortarParts.some(isNaN) || mortarParts.some(part => part <= 0)) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter a valid mortar mix ratio (e.g., 1:4 Cement:Sand).</p>';
            return null;
        }
        const [cementMortarPart, sandMortarPart] = mortarParts;
        const sumOfMortarParts = cementMortarPart + sandMortarPart;

        const wallVolume = wallLength * wallHeight * wallThickness;

        const effectiveBrickLength = brickSizeLength + mortarJointThickness;
        const effectiveBrickHeight = brickSizeHeight + mortarJointThickness;
        const bricksPerSqMeter = 1 / (effectiveBrickLength * effectiveBrickHeight);

        let layersInThickness = Math.round(wallThickness / (brickSizeWidth + mortarJointThickness));
        if (layersInThickness === 0) layersInThickness = 1;

        const totalBricksWithoutWaste = bricksPerSqMeter * wallLength * wallHeight * layersInThickness;
        const actualBricksRequired = totalBricksWithoutWaste * (1 + wasteFactor / 100);

        const totalVolumeOfBricks = actualBricksRequired * brickSizeLength * brickSizeWidth * brickSizeHeight;
        const totalMortarVolumeWet = wallVolume - (totalVolumeOfBricks / (1 + wasteFactor / 100));
        const totalMortarVolumeWetWithWaste = totalMortarVolumeWet * (1 + wasteFactor / 100);
        const dryMortarVolume = totalMortarVolumeWetWithWaste * 1.33;

        const cementMortarVolume = (cementMortarPart / sumOfMortarParts) * dryMortarVolume;
        const sandMortarVolume = (sandMortarPart / sumOfMortarParts) * dryMortarVolume;
        const cementMortarBags = (cementMortarVolume * 1440) / 50;

        return {
            type: 'bricks',
            name: data?.name || 'Brickwork Calculation',
            wallLength: wallLength,
            wallHeight: wallHeight,
            wallThickness: wallThickness,
            wasteFactor: wasteFactor,
            mortarMix: mortarMixInput,
            brickSizeLength: brickSizeLength,
            brickSizeWidth: brickSizeWidth,
            brickSizeHeight: brickSizeHeight,
            mortarJointThickness: mortarJointThickness,
            calculated: {
                totalBricks: Math.ceil(actualBricksRequired),
                totalMortarWetVolume: totalMortarVolumeWetWithWaste,
                cementMortarVolume: cementMortarVolume,
                sandMortarVolume: sandMortarVolume,
                cementMortarBags: Math.ceil(cementMortarBags)
            }
        };
    }

    // New Calculation Functions
    function calculateSteel(data) {
        const steelType = data?.steelType || document.getElementById('steelType').value;
        const wasteFactor = data?.wasteFactor || parseFloat(document.getElementById('steelWasteFactor').value) || 0;
        let totalWeight = 0;
        
        if (steelType === 'bars') {
            const diameter = data?.steelBarDiameter || parseFloat(document.getElementById('steelBarDiameter').value);
            const length = data?.steelBarLength || parseFloat(document.getElementById('steelBarLength').value);
            const quantity = data?.steelBarQuantity || parseInt(document.getElementById('steelBarQuantity').value, 10);
            
            if (isNaN(diameter) || isNaN(length) || isNaN(quantity) || diameter <= 0 || length <= 0 || quantity <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter valid positive values for bar diameter, length, and quantity.</p>';
                return null;
            }
            const weightPerMeter = (diameter * diameter) / 162;
            const totalLength = length * quantity;
            totalWeight = totalLength * weightPerMeter;
        } else if (steelType === 'stirrups') {
            const diameter = data?.steelStirrupDiameter || parseFloat(document.getElementById('steelStirrupDiameter').value);
            const legLength = data?.steelStirrupLength || parseFloat(document.getElementById('steelStirrupLength').value);
            const quantity = data?.steelStirrupQuantity || parseInt(document.getElementById('steelStirrupQuantity').value, 10);
            
            if (isNaN(diameter) || isNaN(legLength) || isNaN(quantity) || diameter <= 0 || legLength <= 0 || quantity <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter valid positive values for stirrup diameter, leg length, and quantity.</p>';
                return null;
            }
            const weightPerMeter = (diameter * diameter) / 162;
            const totalLength = legLength * quantity;
            totalWeight = totalLength * weightPerMeter;
        }
        
        const actualWeight = totalWeight * (1 + wasteFactor / 100);

        return {
            type: 'steel',
            name: data?.name || 'Steel Reinforcement',
            steelType: steelType,
            wasteFactor: wasteFactor,
            steelBarDiameter: data?.steelBarDiameter,
            steelBarLength: data?.steelBarLength,
            steelBarQuantity: data?.steelBarQuantity,
            steelStirrupDiameter: data?.steelStirrupDiameter,
            steelStirrupLength: data?.steelStirrupLength,
            steelStirrupQuantity: data?.steelStirrupQuantity,
            calculated: {
                totalWeight: actualWeight
            }
        };
    }

    function calculatePlastering(data) {
        const materialType = data?.plasteringMaterialType || document.getElementById('plasteringMaterialType').value;
        const surfaceArea = data?.surfaceArea || parseFloat(document.getElementById('surfaceArea').value);
        
        if (isNaN(surfaceArea) || surfaceArea <= 0) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter a valid positive surface area.</p>';
            return null;
        }

        let calculated = {};
        if (materialType === 'plastering') {
            const thickness = data?.plasteringThickness || parseFloat(document.getElementById('plasteringThickness').value);
            const mix = data?.plasteringMix || document.getElementById('plasteringMix').value;
            const wasteFactor = data?.plasteringWasteFactor || parseFloat(document.getElementById('plasteringWasteFactor').value) || 0;
            
            if (isNaN(thickness) || thickness <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter a valid plastering thickness.</p>';
                return null;
            }
            
            const dryVolume = (surfaceArea * (thickness / 1000)) * 1.33;
            const mixParts = mix.split(':').map(part => parseFloat(part.trim()));
            const sumOfParts = mixParts[0] + mixParts[1];
            
            const cementVolume = (mixParts[0] / sumOfParts) * dryVolume;
            const cementBags = (cementVolume * 1440) / 50;
            
            calculated.cementBags = cementBags * (1 + wasteFactor / 100);
            calculated.sandVolume = (mixParts[1] / sumOfParts) * dryVolume * (1 + wasteFactor / 100);
            
        } else if (materialType === 'flooring') {
            const tileArea = data?.tileArea || parseFloat(document.getElementById('tileArea').value);
            const wasteFactor = data?.flooringWasteFactor || parseFloat(document.getElementById('flooringWasteFactor').value) || 0;
            
            if (isNaN(tileArea) || tileArea <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter a valid tile area.</p>';
                return null;
            }
            
            const tilesNeeded = surfaceArea / tileArea;
            calculated.tilesNeeded = Math.ceil(tilesNeeded * (1 + wasteFactor / 100));
            
        } else if (materialType === 'painting') {
            const coverage = data?.paintCoverage || parseFloat(document.getElementById('paintCoverage').value);
            const coats = data?.paintCoats || parseFloat(document.getElementById('paintCoats').value);
            const wasteFactor = data?.paintingWasteFactor || parseFloat(document.getElementById('paintingWasteFactor').value) || 0;
            
            if (isNaN(coverage) || isNaN(coats) || coverage <= 0 || coats <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter valid positive values for paint coverage and coats.</p>';
                return null;
            }

            const paintNeeded = (surfaceArea / coverage) * coats;
            calculated.paintNeeded = paintNeeded * (1 + wasteFactor / 100);
        }

        return {
            type: 'plastering',
            name: data?.name || `${materialType} Calculation`,
            plasteringMaterialType: materialType,
            surfaceArea: surfaceArea,
            plasteringThickness: data?.plasteringThickness,
            plasteringMix: data?.plasteringMix,
            plasteringWasteFactor: data?.plasteringWasteFactor,
            tileArea: data?.tileArea,
            flooringWasteFactor: data?.flooringWasteFactor,
            paintCoverage: data?.paintCoverage,
            paintCoats: data?.paintCoats,
            paintingWasteFactor: data?.paintingWasteFactor,
            calculated: calculated
        };
    }

    function calculateRoofing(data) {
        const roofingType = data?.roofingType || document.getElementById('roofingType').value;
        let calculated = {};
        
        if (roofingType === 'rcc_slab') {
            const length = data?.rccLength || parseFloat(document.getElementById('rccLength').value);
            const width = data?.rccWidth || parseFloat(document.getElementById('rccWidth').value);
            const thickness = data?.rccThickness || parseFloat(document.getElementById('rccThickness').value);
            const mix = data?.rccMix || document.getElementById('rccMix').value;
            const wasteFactor = data?.rccWasteFactor || parseFloat(document.getElementById('rccWasteFactor').value) || 0;

            if (isNaN(length) || isNaN(width) || isNaN(thickness) || length <= 0 || width <= 0 || thickness <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter valid dimensions for RCC Slab.</p>';
                return null;
            }

            const concreteMixInput = mix;
            const mixParts = concreteMixInput.split(':').map(part => parseFloat(part.trim()));
            const sumOfParts = mixParts[0] + mixParts[1] + mixParts[2];
            const wetVolume = length * width * thickness;
            const dryVolume = wetVolume * 1.54;
            const cementVolume = (mixParts[0] / sumOfParts) * dryVolume;
            const sandVolume = (mixParts[1] / sumOfParts) * dryVolume;
            const aggregateVolume = (mixParts[2] / sumOfParts) * dryVolume;

            const cementBags = (cementVolume * 1440) / 50;

            calculated = {
                wetVolume: wetVolume * (1 + wasteFactor / 100),
                cementBags: cementBags * (1 + wasteFactor / 100),
                sandVolume: sandVolume * (1 + wasteFactor / 100),
                aggregateVolume: aggregateVolume * (1 + wasteFactor / 100)
            };
        } else if (roofingType === 'truss_roof') {
            const area = data?.trussArea || parseFloat(document.getElementById('trussArea').value);
            const material = data?.trussMaterial || document.getElementById('trussMaterial').value;
            const covering = data?.trussCovering || document.getElementById('trussCovering').value;

            if (isNaN(area) || area <= 0) {
                 resultsDiv.innerHTML = '<p class="error-message">Please enter a valid roof area.</p>';
                 return null;
            }
            calculated = { area: area, material: material, covering: covering };
        }

        return {
            type: 'roofing',
            name: data?.name || `${roofingType.replace('_', ' ')} Calculation`,
            roofingType: roofingType,
            rccLength: data?.rccLength,
            rccWidth: data?.rccWidth,
            rccThickness: data?.rccThickness,
            rccMix: data?.rccMix,
            rccWasteFactor: data?.rccWasteFactor,
            trussArea: data?.trussArea,
            trussMaterial: data?.trussMaterial,
            trussCovering: data?.trussCovering,
            calculated: calculated
        };
    }
    
    function calculateEarthwork(data) {
        const length = data?.earthLength || parseFloat(document.getElementById('earthLength').value);
        const width = data?.earthWidth || parseFloat(document.getElementById('earthWidth').value);
        const depth = data?.earthDepth || parseFloat(document.getElementById('earthDepth').value);
        
        if (isNaN(length) || isNaN(width) || isNaN(depth) || length <= 0 || width <= 0 || depth <= 0) {
            resultsDiv.innerHTML = '<p class="error-message">Please enter valid dimensions for Earthwork.</p>';
            return null;
        }

        const totalVolume = length * width * depth;

        return {
            type: 'earthwork',
            name: data?.name || 'Earthwork Calculation',
            earthLength: length,
            earthWidth: width,
            earthDepth: depth,
            calculated: {
                totalVolume: totalVolume
            }
        };
    }
    
    function calculateTank(data) {
        const shape = data?.tankShape || document.getElementById('tankShape').value;
        let volume = 0;
        
        if (shape === 'rectangular') {
            const length = data?.tankLength || parseFloat(document.getElementById('tankLength').value);
            const width = data?.tankWidth || parseFloat(document.getElementById('tankWidth').value);
            const height = data?.tankHeight || parseFloat(document.getElementById('tankHeight').value);
            
            if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter valid dimensions for a rectangular tank.</p>';
                return null;
            }

            volume = length * width * height;
        } else if (shape === 'cylindrical') {
            const diameter = data?.tankDiameter || parseFloat(document.getElementById('tankDiameter').value);
            const height = data?.tankCylHeight || parseFloat(document.getElementById('tankCylHeight').value);
            
            if (isNaN(diameter) || isNaN(height) || diameter <= 0 || height <= 0) {
                resultsDiv.innerHTML = '<p class="error-message">Please enter valid dimensions for a cylindrical tank.</p>';
                return null;
            }

            const radius = diameter / 2;
            volume = Math.PI * radius * radius * height;
        }

        return {
            type: 'tank',
            name: data?.name || 'Tank Volume',
            tankShape: shape,
            tankLength: data?.tankLength,
            tankWidth: data?.tankWidth,
            tankHeight: data?.tankHeight,
            tankDiameter: data?.tankDiameter,
            tankCylHeight: data?.tankCylHeight,
            calculated: {
                volume: volume
            }
        };
    }

    function collectCurrentCalculationData() {
        const selectedMaterial = materialTypeSelect.value;
        let calculationData = null;

        if (selectedMaterial === 'concrete') {
            calculationData = calculateConcrete();
        } else if (selectedMaterial === 'bricks') {
            calculationData = calculateBricks();
        } else if (selectedMaterial === 'steel') {
            calculationData = calculateSteel();
        } else if (selectedMaterial === 'plastering') {
            calculationData = calculatePlastering();
        } else if (selectedMaterial === 'roofing') {
            calculationData = calculateRoofing();
        } else if (selectedMaterial === 'earthwork') {
            calculationData = calculateEarthwork();
        } else if (selectedMaterial === 'tank') {
            calculationData = calculateTank();
        }


        if (calculationData) {
            if (currentEditingCalculationId) {
                calculationData._id = currentEditingCalculationId;
            } else {
                calculationData._id = 'temp_' + Date.now() + Math.random().toString(36).substring(2, 9);
            }
        }
        return calculationData;
    }

    function calculateAndAggregateResults(calculationsToProcess = []) {
        resultsDiv.innerHTML = '';
        
        let displayCalculations = calculationsToProcess;
        if (calculationsToProcess.length === 0) {
            const currentCalculation = collectCurrentCalculationData();
            if (currentCalculation) {
                displayCalculations = [currentCalculation];
            } else {
                resultsDiv.innerHTML = '<p class="error-message">Please correct input errors to see calculation results.</p>';
                return;
            }
        }
        
        displayCalculations = displayCalculations.filter(calc => {
            if (calc.type === 'concrete') {
                return calc.length > 0 && calc.width > 0 && calc.height > 0;
            } else if (calc.type === 'bricks') {
                return calc.wallLength > 0 && calc.wallHeight > 0 && calc.wallThickness > 0;
            } else if (calc.type === 'steel') {
                if (calc.steelType === 'bars') {
                    return calc.steelBarDiameter > 0 && calc.steelBarLength > 0 && calc.steelBarQuantity > 0;
                } else if (calc.steelType === 'stirrups') {
                     return calc.steelStirrupDiameter > 0 && calc.steelStirrupLength > 0 && calc.steelStirrupQuantity > 0;
                }
            } else if (calc.type === 'plastering') {
                 return calc.surfaceArea > 0;
            } else if (calc.type === 'roofing') {
                if (calc.roofingType === 'rcc_slab') {
                    return calc.rccLength > 0 && calc.rccWidth > 0 && calc.rccThickness > 0;
                } else if (calc.roofingType === 'truss_roof') {
                    return calc.trussArea > 0;
                }
            } else if (calc.type === 'earthwork') {
                return calc.earthLength > 0 && calc.earthWidth > 0 && calc.earthDepth > 0;
            } else if (calc.type === 'tank') {
                if (calc.tankShape === 'rectangular') {
                    return calc.tankLength > 0 && calc.tankWidth > 0 && calc.tankHeight > 0;
                } else if (calc.tankShape === 'cylindrical') {
                    return calc.tankDiameter > 0 && calc.tankCylHeight > 0;
                }
            }
            return false;
        });

        if (displayCalculations.length === 0) {
            resultsDiv.innerHTML = '<p class="error-message">No valid calculations to display. Please correct inputs.</p>';
            return;
        }

        let totalCementBags = 0;
        let totalSandM3 = 0;
        let totalAggregateM3 = 0;
        let totalBricksNos = 0;
        let totalSteelKg = 0;
        let totalTilesNos = 0;
        let totalPaintLtr = 0;
        let totalEarthworkM3 = 0;
        let totalTankVolumeM3 = 0;
        let totalTrussRoofArea = 0;

        let totalEstimatedCost = 0;

        let individualResultsHtml = '<h2>Individual Calculation Results</h2>';
        individualResultsHtml += '<div class="individual-calculations-list">';

        displayCalculations.forEach((calc, index) => {
            individualResultsHtml += `<div class="calculation-detail">`;
            individualResultsHtml += `<h4>${calc.name || 'Untitled Calculation'} (${calc.type})</h4>`;
            if (calc.wasteFactor) {
                individualResultsHtml += `<p>Waste: ${calc.wasteFactor || 0}%</p>`;
            }

            let calculatedData = calc.calculated;
            if (!calculatedData) {
                 if (calc.type === 'concrete') {
                     calculatedData = calculateConcrete(calc)?.calculated;
                 } else if (calc.type === 'bricks') {
                     calculatedData = calculateBricks(calc)?.calculated;
                 } else if (calc.type === 'steel') {
                     calculatedData = calculateSteel(calc)?.calculated;
                 } else if (calc.type === 'plastering') {
                     calculatedData = calculatePlastering(calc)?.calculated;
                 } else if (calc.type === 'roofing') {
                     calculatedData = calculateRoofing(calc)?.calculated;
                 } else if (calc.type === 'earthwork') {
                     calculatedData = calculateEarthwork(calc)?.calculated;
                 } else if (calc.type === 'tank') {
                     calculatedData = calculateTank(calc)?.calculated;
                 }
                 calc.calculated = calculatedData;
             }

            if (calc.type === 'concrete' && calculatedData) {
                const c = calculatedData;
                individualResultsHtml += `<p><strong>Wet Concrete Volume:</strong> ${c.wetVolume.toFixed(2)} m³</p>`;
                individualResultsHtml += `<p><strong>Cement:</strong> ${c.cementVolume.toFixed(2)} m³ (~ ${c.cementBags.toFixed(1)} bags)</p>`;
                individualResultsHtml += `<p><strong>Sand:</strong> ${c.sandVolume.toFixed(2)} m³</p>`;
                individualResultsHtml += `<p><strong>Aggregate:</strong> ${c.aggregateVolume.toFixed(2)} m³</p>`;

                totalCementBags += c.cementBags;
                totalSandM3 += c.sandVolume;
                totalAggregateM3 += c.aggregateVolume;

            } else if (calc.type === 'bricks' && calculatedData) {
                const b = calculatedData;
                individualResultsHtml += `<p><strong>Total Bricks:</strong> ${b.totalBricks} Nos.</p>`;
                individualResultsHtml += `<p><strong>Total Mortar (Wet):</strong> ${b.totalMortarWetVolume.toFixed(3)} m³</p>`;
                individualResultsHtml += `<p><strong>Cement for Mortar:</strong> ${b.cementMortarVolume.toFixed(3)} m³ (~ ${b.cementMortarBags} bags)</p>`;
                individualResultsHtml += `<p><strong>Sand for Mortar:</strong> ${b.sandMortarVolume.toFixed(3)} m³</p>`;

                totalBricksNos += b.totalBricks;
                totalCementBags += b.cementMortarBags;
                totalSandM3 += b.sandMortarVolume;

            } else if (calc.type === 'steel' && calculatedData) {
                const s = calculatedData;
                individualResultsHtml += `<p><strong>Total Steel Weight:</strong> ${s.totalWeight.toFixed(2)} kg</p>`;
                totalSteelKg += s.totalWeight;
                
            } else if (calc.type === 'plastering' && calculatedData) {
                const p = calculatedData;
                if (calc.plasteringMaterialType === 'plastering') {
                    individualResultsHtml += `<p><strong>Plastering Area:</strong> ${calc.surfaceArea.toFixed(2)} m²</p>`;
                    individualResultsHtml += `<p><strong>Cement:</strong> ${p.cementBags.toFixed(1)} bags</p>`;
                    individualResultsHtml += `<p><strong>Sand:</strong> ${p.sandVolume.toFixed(2)} m³</p>`;
                    totalCementBags += p.cementBags;
                    totalSandM3 += p.sandVolume;
                } else if (calc.plasteringMaterialType === 'flooring') {
                    individualResultsHtml += `<p><strong>Flooring Area:</strong> ${calc.surfaceArea.toFixed(2)} m²</p>`;
                    individualResultsHtml += `<p><strong>Tiles:</strong> ${p.tilesNeeded} pcs</p>`;
                    totalTilesNos += p.tilesNeeded;
                } else if (calc.plasteringMaterialType === 'painting') {
                    individualResultsHtml += `<p><strong>Painting Area:</strong> ${calc.surfaceArea.toFixed(2)} m²</p>`;
                    individualResultsHtml += `<p><strong>Paint:</strong> ${p.paintNeeded.toFixed(2)} Ltr</p>`;
                    totalPaintLtr += p.paintNeeded;
                }

            } else if (calc.type === 'roofing' && calculatedData) {
                const r = calculatedData;
                if (calc.roofingType === 'rcc_slab') {
                    individualResultsHtml += `<p><strong>RCC Slab Volume:</strong> ${r.wetVolume.toFixed(2)} m³</p>`;
                    individualResultsHtml += `<p><strong>Cement:</strong> ${r.cementBags.toFixed(1)} bags</p>`;
                    doc.text(`    - Sand: ${r.sandVolume ? r.sandVolume.toFixed(2) : 'N/A'} m³`);
                    doc.text(`    - Aggregate: ${r.aggregateVolume ? r.aggregateVolume.toFixed(2) : 'N/A'} m³`);
                    totalCementBags += r.cementBags;
                    totalSandM3 += r.sandVolume;
                    totalAggregateM3 += r.aggregateVolume;
                } else if (calc.roofingType === 'truss_roof') {
                    individualResultsHtml += `<p><strong>Truss Roof Area:</strong> ${r.area.toFixed(2)} m²</p>`;
                    individualResultsHtml += `<p><strong>Material:</strong> ${r.material} with ${r.covering} covering</p>`;
                    totalTrussRoofArea += r.area;
                }
            } else if (calc.type === 'earthwork' && calculatedData) {
                const e = calculatedData;
                individualResultsHtml += `<p><strong>Excavation Volume:</strong> ${e.totalVolume.toFixed(2)} m³</p>`;
                totalEarthworkM3 += e.totalVolume;

            } else if (calc.type === 'tank' && calculatedData) {
                const t = calculatedData;
                individualResultsHtml += `<p><strong>Tank Volume:</strong> ${t.volume.toFixed(2)} m³</p>`;
                individualResultsHtml += `<p>Volume in Liters: ${(t.volume * 1000).toFixed(2)} Ltr</p>`;
                totalTankVolumeM3 += t.volume;
            }
            individualResultsHtml += `</div>`;
        });
        individualResultsHtml += `</div>`;

        totalEstimatedCost += totalCementBags * materialPrices.cement_bags;
        totalEstimatedCost += totalSandM3 * materialPrices.sand_m3;
        totalEstimatedCost += totalAggregateM3 * materialPrices.aggregate_m3;
        totalEstimatedCost += totalBricksNos * materialPrices.bricks_nos;
        totalEstimatedCost += totalSteelKg * materialPrices.steel_kg;
        totalEstimatedCost += totalTilesNos * materialPrices.tiles_m2;
        totalEstimatedCost += totalPaintLtr * materialPrices.paint_Ltr;
        totalEstimatedCost += totalTrussRoofArea * materialPrices.truss_roof_m2;
        totalEstimatedCost += totalEarthworkM3 * materialPrices.earthwork_m3;
        totalEstimatedCost += totalTankVolumeM3 * materialPrices.tank_volume_m3;


        let summaryHtml = `
            <h2>Project Material Summary & Cost Estimate</h2>
            <div class="summary-box">
                <p><strong>Total Cement:</strong> ${totalCementBags.toFixed(1)} bags</p>
                <p><strong>Total Sand:</strong> ${totalSandM3.toFixed(2)} m³</p>
                <p><strong>Total Aggregate:</strong> ${totalAggregateM3.toFixed(2)} m³</p>
                <p><strong>Total Bricks:</strong> ${Math.ceil(totalBricksNos)} Nos.</p>
                <p><strong>Total Steel:</strong> ${totalSteelKg.toFixed(2)} kg</p>
                <p><strong>Total Tiles:</strong> ${totalTilesNos} pcs</p>
                <p><strong>Total Paint:</strong> ${totalPaintLtr.toFixed(2)} Ltr</p>
                <p><strong>Total Earthwork Volume:</strong> ${totalEarthworkM3.toFixed(2)} m³</p>
                <p><strong>Total Tank Volume:</strong> ${totalTankVolumeM3.toFixed(2)} m³</p>
                <h3>Estimated Total Cost: ₹ ${totalEstimatedCost.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p class="small-text"><em>(Based on current material prices. Always verify actual market rates.)</em></p>
            </div>
        `;

        resultsDiv.innerHTML = summaryHtml + individualResultsHtml;
    }


    function displaySaveMessage(message, isSuccess) {
        saveMessageDiv.textContent = message;
        saveMessageDiv.className = 'message-area';
        if (isSuccess) {
            saveMessageDiv.classList.add('success');
        } else {
            saveMessageDiv.classList.add('error');
        }
        setTimeout(() => {
            saveMessageDiv.textContent = '';
            saveMessageDiv.className = 'message-area';
        }, 5000);
    }


    async function saveProject() {
        saveMessageDiv.innerHTML = '';
        const projectName = projectNameInput.value.trim();
        if (!projectName) {
            displaySaveMessage('Please enter a project name before saving.', false);
            return;
        }

        currentProjectData.projectName = projectName;

        const dataToSend = { ...currentProjectData };
        dataToSend.calculations = dataToSend.calculations.map(calc => {
            const newCalc = { ...calc };
            if (typeof newCalc._id === 'string') {
                if (newCalc._id.startsWith('temp_') || newCalc._id.startsWith('plan_wall_') || newCalc._id.startsWith('plan_room_')) {
                    delete newCalc._id;
                }
            }
            return newCalc;
        });

        let response;
        let method;
        let url;

        if (currentLoadedProjectName && currentLoadedProjectName === projectName) {
            method = 'PUT';
            url = `http://localhost:5000/api/projects/${encodeURIComponent(projectName)}`;
        } else {
            method = 'POST';
            url = 'http://localhost:5000/api/projects';
        }

        try {
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (response.ok) {
                displaySaveMessage(`Project "${result.projectName}" ${method === 'POST' ? 'saved' : 'updated'} successfully!`, true);
                projectNameInput.value = result.projectName;
                currentLoadedProjectName = result.projectName;
                currentProjectData = { ...result };
                displayProjectCalculations();
                calculateAndAggregateResults(currentProjectData.calculations);
                await populateProjectList();
            } else {
                displaySaveMessage(`Error ${method === 'POST' ? 'saving' : 'updating'} project: ${result.message || 'Unknown error'}`, false);
            }
        } catch (error) {
            console.error('Network or fetch error:', error);
            displaySaveMessage(`Network error: Could not connect to server.`, false);
        }
    }


    function displayLoadMessage(message, isSuccess) {
        loadMessageDiv.textContent = message;
        loadMessageDiv.className = 'message-area';
        if (isSuccess) {
            loadMessageDiv.classList.add('success');
        } else {
            loadMessageDiv.classList.add('error');
        }
        setTimeout(() => {
            loadMessageDiv.textContent = '';
            loadMessageDiv.className = 'message-area';
        }, 5000);
    }


    async function populateProjectList() {
        const prevSelectedProject = projectListSelect.value;
        projectListSelect.innerHTML = '<option value="">-- Select a Project --</option>';
        loadMessageDiv.innerHTML = '';
        try {
            const response = await fetch('http://localhost:5000/api/projects');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const projects = await response.json();

            if (projects.length === 0) {
                displayLoadMessage('No projects saved yet.', false);
                return;
            }

            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.projectName;
                option.textContent = project.projectName;
                projectListSelect.appendChild(option);
            });
            if (prevSelectedProject && projects.some(p => p.projectName === prevSelectedProject)) {
                projectListSelect.value = prevSelectedProject;
            }
            displayLoadMessage(`Loaded ${projects.length} project(s) into dropdown.`, true);
        } catch (error) {
            console.error('Error fetching project list:', error);
            displayLoadMessage('Error fetching projects. Is the backend running?', false);
        }
    }

    async function loadSelectedProject() {
        const selectedProjectName = projectListSelect.value;
        if (!selectedProjectName) {
            displayLoadMessage('Please select a project to load.', false);
            return;
        }
        loadMessageDiv.innerHTML = '';

        try {
            const response = await fetch(`http://localhost:5000/api/projects?name=${encodeURIComponent(selectedProjectName)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const project = await response.json();

            if (!project) {
                displayLoadMessage(`Project "${selectedProjectName}" not found.`, false);
                return;
            }

            clearCalculatorInputs();
            projectNameInput.value = project.projectName;
            currentLoadedProjectName = project.projectName;
            currentProjectData = { ...project };
            projectCalculationsSection.classList.remove('hidden');

            displayLoadMessage(`Project "${project.projectName}" loaded successfully.`, true);

            if (project.calculations && project.calculations.length > 0) {
                editCalculation(project.calculations[0]._id);
            } else {
                displayLoadMessage(`Project "${project.projectName}" has no calculations. Start by adding one.`, false);
                currentEditingCalculationId = null;
            }

            displayProjectCalculations();
            calculateAndAggregateResults(currentProjectData.calculations);

        } catch (error) {
            console.error('Error loading project:', error);
            displayLoadMessage('Error loading project. Is the backend running?', false);
            currentLoadedProjectName = null;
            currentProjectData = { calculations: [] };
            projectCalculationsSection.classList.add('hidden');
        }
    }

    async function editCalculation(id) {
        const calculationToEdit = currentProjectData.calculations.find(calc => calc._id === id);
        if (!calculationToEdit) {
            displayCalculationsListMessage('Calculation not found for editing.', false);
            return;
        }

        clearCalculatorInputs();
        currentEditingCalculationId = id;

        materialTypeSelect.value = calculationToEdit.type;
        showInputsForMaterial(calculationToEdit.type);

        if (calculationToEdit.type === 'concrete') {
            document.getElementById('length').value = calculationToEdit.length || '';
            document.getElementById('width').value = calculationToEdit.width || '';
            document.getElementById('height').value = calculationToEdit.height || '';
            document.getElementById('concreteMix').value = calculationToEdit.concreteMix || '1:2:4';
            document.getElementById('wasteFactor').value = calculationToEdit.wasteFactor || 5;
        } else if (calculationToEdit.type === 'bricks') {
            document.getElementById('brickWallLength').value = calculationToEdit.wallLength || '';
            document.getElementById('brickWallHeight').value = calculationToEdit.wallHeight || '';
            document.getElementById('brickWallThickness').value = calculationToEdit.wallThickness || '';
            document.getElementById('mortarMix').value = calculationToEdit.mortarMix || '1:4';
            document.getElementById('brickSizeLength').value = calculationToEdit.brickSizeLength || 0.190;
            document.getElementById('brickSizeWidth').value = calculationToEdit.brickSizeWidth || 0.090;
            document.getElementById('brickSizeHeight').value = calculationToEdit.brickSizeHeight || 0.090;
            document.getElementById('mortarJointThickness').value = calculationToEdit.mortarJointThickness || 0.010;
            document.getElementById('brickWasteFactor').value = calculationToEdit.wasteFactor || 5;
        } else if (calculationToEdit.type === 'steel') {
            document.getElementById('steelType').value = calculationToEdit.steelType;
            showSteelSubInputs(calculationToEdit.steelType);
            if (calculationToEdit.steelType === 'bars') {
                 document.getElementById('steelBarDiameter').value = calculationToEdit.steelBarDiameter;
                 document.getElementById('steelBarLength').value = calculationToEdit.steelBarLength;
                 document.getElementById('steelBarQuantity').value = calculationToEdit.steelBarQuantity;
            } else if (calculationToEdit.steelType === 'stirrups') {
                 document.getElementById('steelStirrupDiameter').value = calculationToEdit.steelStirrupDiameter;
                 document.getElementById('steelStirrupLength').value = calculationToEdit.steelStirrupLength;
                 document.getElementById('steelStirrupQuantity').value = calculationToEdit.steelStirrupQuantity;
            }
            document.getElementById('steelWasteFactor').value = calculationToEdit.wasteFactor || 5;
        } else if (calculationToEdit.type === 'plastering') {
            document.getElementById('surfaceArea').value = calculationToEdit.surfaceArea;
            document.getElementById('plasteringMaterialType').value = calculationToEdit.plasteringMaterialType;
            showPlasteringSubInputs(calculationToEdit.plasteringMaterialType);
            if (calculationToEdit.plasteringMaterialType === 'plastering') {
                 document.getElementById('plasteringThickness').value = calculationToEdit.plasteringThickness;
                 document.getElementById('plasteringMix').value = calculationToEdit.plasteringMix;
                 document.getElementById('plasteringWasteFactor').value = calculationToEdit.wasteFactor;
            } else if (calculationToEdit.plasteringMaterialType === 'flooring') {
                 document.getElementById('tileArea').value = calculationToEdit.tileArea;
                 document.getElementById('flooringWasteFactor').value = calculationToEdit.wasteFactor;
            } else if (calculationToEdit.plasteringMaterialType === 'painting') {
                 document.getElementById('paintCoverage').value = calculationToEdit.paintCoverage;
                 document.getElementById('paintCoats').value = calculationToEdit.paintCoats;
                 document.getElementById('paintingWasteFactor').value = calculationToEdit.wasteFactor;
            }
        } else if (calculationToEdit.type === 'roofing') {
            document.getElementById('roofingType').value = calculationToEdit.roofingType;
            showRoofingSubInputs(calculationToEdit.roofingType);
            if (calculationToEdit.roofingType === 'rcc_slab') {
                 document.getElementById('rccLength').value = calculationToEdit.rccLength;
                 document.getElementById('rccWidth').value = calculationToEdit.rccWidth;
                 document.getElementById('rccThickness').value = calculationToEdit.rccThickness;
                 document.getElementById('rccMix').value = calculationToEdit.rccMix;
                 document.getElementById('rccWasteFactor').value = calculationToEdit.wasteFactor;
            } else if (calculationToEdit.roofingType === 'truss_roof') {
                 document.getElementById('trussArea').value = calculationToEdit.trussArea;
                 document.getElementById('trussMaterial').value = calculationToEdit.trussMaterial;
                 document.getElementById('trussCovering').value = calculationToEdit.trussCovering;
            }
        } else if (calculationToEdit.type === 'earthwork') {
            document.getElementById('earthLength').value = calculationToEdit.earthLength;
            document.getElementById('earthWidth').value = calculationToEdit.earthWidth;
            document.getElementById('earthDepth').value = calculationToEdit.earthDepth;
        } else if (calculationToEdit.type === 'tank') {
            document.getElementById('tankShape').value = calculationToEdit.tankShape;
            showTankSubInputs(calculationToEdit.tankShape);
            if (calculationToEdit.tankShape === 'rectangular') {
                 document.getElementById('tankLength').value = calculationToEdit.tankLength;
                 document.getElementById('tankWidth').value = calculationToedit.tankWidth;
                 document.getElementById('tankHeight').value = calculationToEdit.tankHeight;
            } else if (calculationToEdit.tankShape === 'cylindrical') {
                 document.getElementById('tankDiameter').value = calculationToEdit.tankDiameter;
                 document.getElementById('tankCylHeight').value = calculationToEdit.tankCylHeight;
            }
        }

        displayCalculationsListMessage(`Editing "${calculationToEdit.name || calculationToEdit.type}". Modify inputs, then click "Add Current to Project" to update it within the project.`, true);

        displayProjectCalculations();
    }

    async function deleteCalculation(id) {
        if (!confirm('Are you sure you want to delete this calculation? This action cannot be undone unless you cancel saving the project.')) {
            return;
        }
        const initialCount = currentProjectData.calculations.length;
        currentProjectData.calculations = currentProjectData.calculations.filter(calc => calc._id !== id);

        if (currentProjectData.calculations.length < initialCount) {
            displayCalculationsListMessage('Calculation deleted from project. Click "Save Current Project" to confirm changes in database.', true);
            displayProjectCalculations();

            if (currentEditingCalculationId === id) {
                clearCalculatorInputs();
            }
            calculateAndAggregateResults(currentProjectData.calculations);
        } else {
            displayCalculationsListMessage('Calculation not found for deletion.', false);
        }
    }


    function clearCalculatorInputs() {
        document.getElementById('length').value = '';
        document.getElementById('width').value = '';
        document.getElementById('height').value = '';
        document.getElementById('concreteMix').value = '1:2:4';
        document.getElementById('wasteFactor').value = 5;

        document.getElementById('brickWallLength').value = '';
        document.getElementById('brickWallHeight').value = '';
        document.getElementById('brickWallThickness').value = '';
        document.getElementById('mortarMix').value = '1:4';
        document.getElementById('brickSizeLength').value = 0.190;
        document.getElementById('brickSizeWidth').value = 0.090;
        document.getElementById('brickSizeHeight').value = 0.090;
        document.getElementById('mortarJointThickness').value = 0.010;
        document.getElementById('brickWasteFactor').value = 5;
        
        document.getElementById('steelBarDiameter').value = '';
        document.getElementById('steelBarLength').value = '';
        document.getElementById('steelBarQuantity').value = '';
        document.getElementById('steelStirrupDiameter').value = '';
        document.getElementById('steelStirrupLength').value = '';
        document.getElementById('steelStirrupQuantity').value = '';
        document.getElementById('steelWasteFactor').value = 5;
        
        document.getElementById('surfaceArea').value = '';
        document.getElementById('plasteringThickness').value = 12;
        document.getElementById('plasteringMix').value = '1:6';
        document.getElementById('plasteringWasteFactor').value = 10;
        document.getElementById('tileArea').value = 0.36;
        document.getElementById('flooringWasteFactor').value = 5;
        document.getElementById('paintCoverage').value = 10;
        document.getElementById('paintCoats').value = 2;
        document.getElementById('paintingWasteFactor').value = 5;
        
        document.getElementById('rccLength').value = '';
        document.getElementById('rccWidth').value = '';
        document.getElementById('rccThickness').value = '';
        document.getElementById('rccMix').value = '1:2:4';
        document.getElementById('rccWasteFactor').value = 5;
        document.getElementById('trussArea').value = '';
        document.getElementById('trussMaterial').value = 'steel';
        document.getElementById('trussCovering').value = 'tiles';

        document.getElementById('earthLength').value = '';
        document.getElementById('earthWidth').value = '';
        document.getElementById('earthDepth').value = '';

        document.getElementById('tankLength').value = '';
        document.getElementById('tankWidth').value = '';
        document.getElementById('tankHeight').value = '';
        document.getElementById('tankDiameter').value = '';
        document.getElementById('tankCylHeight').value = '';

        resultsDiv.innerHTML = '';
        currentEditingCalculationId = null;
        
        document.querySelectorAll('.calculation-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    calculateBtn.addEventListener('click', () => {
        if (currentProjectData.calculations.length > 0) {
            calculateAndAggregateResults(currentProjectData.calculations);
        } else {
            const selectedMaterial = materialTypeSelect.value;
            let currentCalculation = null;

            if (selectedMaterial === 'concrete') {
                currentCalculation = calculateConcrete();
            } else if (selectedMaterial === 'bricks') {
                currentCalculation = calculateBricks();
            } else if (selectedMaterial === 'steel') {
                currentCalculation = calculateSteel();
            } else if (selectedMaterial === 'plastering') {
                currentCalculation = calculatePlastering();
            } else if (selectedMaterial === 'roofing') {
                currentCalculation = calculateRoofing();
            } else if (selectedMaterial === 'earthwork') {
                currentCalculation = calculateEarthwork();
            } else if (selectedMaterial === 'tank') {
                currentCalculation = calculateTank();
            }

            if (currentCalculation) {
                calculateAndAggregateResults([currentCalculation]);
            } else {
                resultsDiv.innerHTML = '<p class="error-message">Please correct input errors to see calculation results.</p>';
            }
        }
    });

    materialTypeSelect.addEventListener('change', (event) => {
        showInputsForMaterial(event.target.value);
    });
    
    steelTypeSelect.addEventListener('change', (event) => {
        showSteelSubInputs(event.target.value);
    });
    
    plasteringMaterialTypeSelect.addEventListener('change', (event) => {
        showPlasteringSubInputs(event.target.value);
    });
    
    roofingTypeSelect.addEventListener('change', (event) => {
        showRoofingSubInputs(event.target.value);
    });

    tankShapeSelect.addEventListener('change', (event) => {
        showTankSubInputs(event.target.value);
    });

    saveProjectBtn.addEventListener('click', saveProject);

    loadProjectBtn.addEventListener('click', loadSelectedProject);

    refreshProjectsBtn.addEventListener('click', populateProjectList);

    deleteProjectBtn.addEventListener('click', async () => {
        const selectedProjectToDelete = projectListSelect.value;
        if (!selectedProjectToDelete) {
            displayLoadMessage('Please select a project to delete from the list.', false);
            return;
        }

        if (!confirm(`Are you sure you want to delete the project "${selectedProjectToDelete}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${encodeURIComponent(selectedProjectToDelete)}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                displayLoadMessage(`Project "${result.deletedProjectName}" deleted successfully.`, true);
                if (currentLoadedProjectName === selectedProjectToDelete) {
                    clearCalculatorInputs();
                    projectNameInput.value = '';
                    currentLoadedProjectName = null;
                    currentProjectData = { calculations: [] };
                    projectCalculationsSection.classList.add('hidden');
                }
                
                projectListSelect.value = '';
                await populateProjectList();
                
            } else {
                displayLoadMessage(`Error deleting project: ${result.message || 'Unknown error'}`, false);
            }
        } catch (error) {
            console.error('Network or fetch error during project deletion:', error);
            displayLoadMessage(`Network error: Could not connect to server for deletion.`, false);
        }
    });

    addCalculationToProjectBtn.addEventListener('click', () => {
        if (!currentProjectData.projectName || currentProjectData.projectName.trim() === '') {
            displayCalculationsListMessage('Please enter a project name in the "Save Project" section first.', false);
            return;
        }

        const newCalc = collectCurrentCalculationData();
        if (newCalc) {
            if (currentEditingCalculationId) {
                const index = currentProjectData.calculations.findIndex(calc => calc._id === currentEditingCalculationId);
                if (index !== -1) {
                    currentProjectData.calculations[index] = newCalc;
                    displayCalculationsListMessage('Calculation updated in project. Click "Save Project" to save changes to database.', true);
                } else {
                    currentProjectData.calculations.push(newCalc);
                    displayCalculationsListMessage('Calculation added as new (ID not found for edit).', true);
                }
            } else {
                currentProjectData.calculations.push(newCalc);
                displayCalculationsListMessage(`New calculation "${newCalc.name || newCalc.type}" added to project. Click "Save Project" to save changes to database.`, true);
            }
            clearCalculatorInputs();
            displayProjectCalculations();
            calculateAndAggregateResults(currentProjectData.calculations);
        } else {
            displayCalculationsListMessage('Cannot add: invalid calculation inputs. Please correct.', false);
        }
    });

    clearCurrentFormBtn.addEventListener('click', () => {
        clearCalculatorInputs();
        showInputsForMaterial(materialTypeSelect.value);
        displayCalculationsListMessage('Form cleared. Ready for a new calculation.', true);
    });

    startNewProjectBtn.addEventListener('click', () => {
        clearCalculatorInputs();
        projectNameInput.value = '';
        currentLoadedProjectName = null;
        currentProjectData = { calculations: [] };
        projectCalculationsSection.classList.add('hidden');
        showInputsForMaterial(materialTypeSelect.value);
        displaySaveMessage('All project data cleared. Ready to create a brand new project.', true);
        displayProjectCalculations();
    });

    projectNameInput.addEventListener('input', () => {
        const inputName = projectNameInput.value.trim();

        if (inputName !== '') {
            projectCalculationsSection.classList.remove('hidden');

            if (!currentLoadedProjectName && (!currentProjectData.projectName || currentProjectData.projectName.trim() === '')) {
                currentProjectData = { projectName: inputName, calculations: [] };
                displayCalculationsListMessage('Project name entered. Add your first calculation!', true);
            } else if (currentLoadedProjectName && currentLoadedProjectName !== inputName) {
                displayCalculationsListMessage('Note: Changing project name will save as a NEW project unless you rename back.', false);
                currentProjectData.projectName = inputName;
            } else if (currentLoadedProjectName && currentLoadedProjectName === inputName) {
                 displayCalculationsListMessage('', false);
                 currentProjectData.projectName = inputName;
            } else if (!currentLoadedProjectName && currentProjectData.projectName !== inputName) {
                currentProjectData.projectName = inputName;
                displayCalculationsListMessage('Project name changed for new project.', true);
            }

        } else {
            if (!currentLoadedProjectName) {
                projectCalculationsSection.classList.add('hidden');
                currentProjectData = { calculations: [] };
            }
            displayCalculationsListMessage('Enter a project name.', false);
        }
        displayProjectCalculations();
    });

    generateReportBtn.addEventListener('click', async () => {
        if (!currentProjectData.projectName || currentProjectData.calculations.length === 0) {
            displaySaveMessage('Load or create a project with calculations first to generate a report.', false);
            return;
        }

        const reportData = {
            projectName: currentProjectData.projectName,
            description: currentProjectData.description,
            calculations: currentProjectData.calculations
        };

        try {
            const response = await fetch('http://localhost:5000/api/reports/csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${currentProjectData.projectName.replace(/[^a-z0-9]/gi, '_')}_Material_Report.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                displaySaveMessage('Report generated and download initiated!', true);
            } else {
                const errorResult = await response.json();
                displaySaveMessage(`Error generating report: ${errorResult.message || 'Unknown error'}`, false);
            }
        } catch (error) {
            console.error('Network or fetch error during report generation:', error);
            displaySaveMessage('Network error: Could not connect to server for report generation.', false);
        }
    });

    generatePDFReportBtn.addEventListener('click', async () => {
        if (!currentProjectData.projectName || currentProjectData.calculations.length === 0) {
            displaySaveMessage('Load or create a project with calculations first to generate a PDF report.', false);
            return;
        }

        const reportData = {
            projectName: currentProjectData.projectName,
            description: currentProjectData.description,
            calculations: currentProjectData.calculations
        };

        try {
            const response = await fetch('http://localhost:5000/api/reports/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${currentProjectData.projectName.replace(/[^a-z0-9]/gi, '_')}_Material_Report.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                displaySaveMessage('PDF Report generated and download initiated!', true);
            } else {
                const errorResult = await response.json();
                displaySaveMessage(`Error generating PDF report: ${errorResult.message || 'Unknown error'}`, false);
            }
        } catch (error) {
            console.error('Network or fetch error during PDF report generation:', error);
            displaySaveMessage('Network error: Could not connect to server for PDF report generation.', false);
        }
    });

    function loadExportedPlanElements() {
        const exportedPlanElementsJSON = sessionStorage.getItem('exportedPlanElements');
        if (exportedPlanElementsJSON) {
            try {
                const elements = JSON.parse(exportedPlanElementsJSON);
                sessionStorage.removeItem('exportedPlanElements');

                if (elements.length > 0) {
                    clearCalculatorInputs();
                    projectNameInput.value = 'New Plan Project - ' + Date.now();
                    currentLoadedProjectName = null;
                    currentProjectData = { projectName: projectNameInput.value, calculations: [] };
                    
                    const newCalculations = [];
                    let plotAreaCalculation = null;

                    elements.forEach(element => {
                        if (element.type === 'bricks' && element.wallLength > 0.1) {
                            const wallCalculation = {
                                _id: 'plan_wall_' + Date.now(),
                                type: 'bricks',
                                name: `${element.name || element.type} - ${element.wallLength.toFixed(2)}m`,
                                wallLength: element.wallLength,
                                wallHeight: element.wallHeight,
                                wallThickness: element.wallThickness,
                                mortarMix: element.mortarMix,
                                brickSizeLength: element.brickSizeLength,
                                brickSizeWidth: element.brickSizeWidth,
                                brickSizeHeight: element.brickSizeHeight,
                                mortarJointThickness: element.mortarJointThickness,
                                wasteFactor: element.wasteFactor
                            };
                            const mockBrickCalc = calculateBricksForExport(wallCalculation);
                            if(mockBrickCalc) {
                                wallCalculation.calculated = mockBrickCalc.calculated;
                                newCalculations.push(wallCalculation);
                            }
                        } else if (element.type === 'concrete' && element.length > 0 && element.width > 0 && element.height > 0) {
                            const roomCalculation = {
                                _id: 'plan_room_' + Date.now(),
                                type: 'concrete',
                                name: `${element.name} - Flooring`,
                                length: element.length,
                                width: element.width,
                                height: element.height,
                                concreteMix: element.concreteMix,
                                wasteFactor: element.wasteFactor
                            };
                            const mockConcreteCalc = calculateConcreteForExport(roomCalculation);
                            if (mockConcreteCalc) {
                                roomCalculation.calculated = mockConcreteCalc.calculated;
                                newCalculations.push(roomCalculation);
                            }
                        }
                    });

                    currentProjectData.calculations = newCalculations;
                    
                    projectCalculationsSection.classList.remove('hidden');
                    displayProjectCalculations();
                    calculateAndAggregateResults(currentProjectData.calculations);
                    displaySaveMessage('Plan imported successfully! Review and Save Project.', true);
                } else {
                    displaySaveMessage('No elements found in exported plan data.', false);
                }
            } catch (error) {
                console.error('Error parsing exported plan elements:', error);
                displaySaveMessage('Error importing plan data.', false);
            }
        }
    }

    function calculateBricksForExport(data) {
        if (data.wallLength <= 0 || data.wallHeight <= 0 || data.wallThickness <= 0) {
            return null;
        }

        const wallLength = data.wallLength;
        const wallHeight = data.wallHeight;
        const wallThickness = data.wallThickness;
        const mortarMixInput = data.mortarMix;
        const brickSizeLength = data.brickSizeLength;
        const brickSizeWidth = data.brickSizeWidth;
        const brickSizeHeight = data.brickSizeHeight;
        const mortarJointThickness = data.mortarJointThickness;
        const wasteFactor = data.wasteFactor;

        const mortarParts = mortarMixInput.split(':').map(part => parseFloat(part.trim()));
        const [cementMortarPart, sandMortarPart] = mortarParts;
        const sumOfMortarParts = cementMortarPart + sandMortarPart;

        const wallVolume = wallLength * wallHeight * wallThickness;

        const effectiveBrickLength = brickSizeLength + mortarJointThickness;
        const effectiveBrickHeight = brickSizeHeight + mortarJointThickness;
        const bricksPerSqMeter = 1 / (effectiveBrickLength * effectiveBrickHeight);

        let layersInThickness = Math.round(wallThickness / (brickSizeWidth + mortarJointThickness));
        if (layersInThickness === 0) layersInThickness = 1;

        const totalBricksWithoutWaste = bricksPerSqMeter * wallLength * wallHeight * layersInThickness;
        const actualBricksRequired = totalBricksWithoutWaste * (1 + wasteFactor / 100);

        const totalVolumeOfBricks = actualBricksRequired * brickSizeLength * brickSizeWidth * brickSizeHeight;
        const totalMortarVolumeWet = wallVolume - (totalVolumeOfBricks / (1 + wasteFactor / 100));
        const totalMortarVolumeWetWithWaste = totalMortarVolumeWet * (1 + wasteFactor / 100);
        const dryMortarVolume = totalMortarVolumeWetWithWaste * 1.33;

        const cementMortarVolume = (cementMortarPart / sumOfMortarParts) * dryMortarVolume;
        const sandMortarVolume = (sandMortarPart / sumOfMortarParts) * dryMortarVolume;
        const cementMortarBags = (cementMortarVolume * 1440) / 50;

        return {
            calculated: {
                totalBricks: Math.ceil(actualBricksRequired),
                totalMortarWetVolume: totalMortarVolumeWetWithWaste,
                cementMortarVolume: cementMortarVolume,
                sandMortarVolume: sandMortarVolume,
                cementMortarBags: Math.ceil(cementMortarBags)
            }
        };
    }

    function calculateConcreteForExport(data) {
        if (data.length <= 0 || data.width <= 0 || data.height <= 0) {
            return null;
        }

        const length = data.length;
        const width = data.width;
        const height = data.height;
        const concreteMixInput = data.concreteMix;
        const wasteFactor = data.wasteFactor;

        const mixParts = concreteMixInput.split(':').map(part => parseFloat(part.trim()));
        const [cementPart, sandPart, aggregatePart] = mixParts;
        const sumOfParts = cementPart + sandPart + aggregatePart;

        const wetVolume = length * width * height;
        const dryVolume = wetVolume * 1.54;

        const cementVolume = (cementPart / sumOfParts) * dryVolume;
        const sandVolume = (sandPart / sumOfParts) * dryVolume;
        const aggregateVolume = (aggregatePart / sumOfParts) * dryVolume;

        const cementInKg = cementVolume * 1440;
        let cementBagsInitial = cementInKg / 50;

        const actualWetVolume = wetVolume * (1 + wasteFactor / 100);
        const actualDryVolume = dryVolume * (1 + wasteFactor / 100);
        const actualCementVolume = cementVolume * (1 + wasteFactor / 100);
        const actualSandVolume = sandVolume * (1 + wasteFactor / 100);
        const actualAggregateVolume = aggregateVolume * (1 + wasteFactor / 100);
        const actualCementBags = cementBagsInitial * (1 + wasteFactor / 100);

        return {
            calculated: {
                wetVolume: actualWetVolume,
                dryVolume: actualDryVolume,
                cementVolume: actualCementVolume,
                sandVolume: actualSandVolume,
                aggregateVolume: actualAggregateVolume,
                cementBags: actualCementBags,
            }
        };
    }

    // --- INITIAL LOAD ---
    populateProjectList();
    loadExportedPlanElements();
});