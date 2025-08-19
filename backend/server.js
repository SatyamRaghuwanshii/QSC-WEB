// File: backend/server.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');

const Project = require('./models/Project');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qsc_app';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend API is working!' });
});

app.post('/api/projects', async (req, res) => {
    try {
        const { projectName, description, calculations } = req.body;

        if (!projectName || !calculations) {
            return res.status(400).json({ message: 'Project name and calculations are required.' });
        }

        const newProject = new Project({
            projectName,
            description,
            calculations
        });

        const savedProject = await newProject.save();
        res.status(201).json(savedProject);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A project with this name already exists. Please choose a different name.' });
        }
        console.error('Error saving project:', error);
        res.status(500).json({ message: 'Error saving project', error: error.message });
    }
});

app.get('/api/projects', async (req, res) => {
    try {
        const { name } = req.query;

        let projects;
        if (name) {
            projects = await Project.findOne({ projectName: name });
            if (!projects) {
                return res.status(404).json({ message: `Project with name "${name}" not found.` });
            }
        } else {
            projects = await Project.find({});
        }

        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
});

app.put('/api/projects/:projectName', async (req, res) => {
    try {
        const { projectName } = req.params;
        const { description, calculations } = req.body;

        if (!calculations) {
            return res.status(400).json({ message: 'Calculations data is required for update.' });
        }

        const updatedProject = await Project.findOneAndUpdate(
            { projectName: projectName },
            { description, calculations, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        res.status(200).json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
});

app.delete('/api/projects/:projectName', async (req, res) => {
    try {
        const { projectName } = req.params;

        const deletedProject = await Project.findOneAndDelete({ projectName: projectName });

        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        res.status(200).json({ message: 'Project deleted successfully', deletedProjectName: deletedProject.projectName });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
});

app.post('/api/reports/csv', (req, res) => {
    try {
        const { projectName, calculations } = req.body;

        if (!projectName || !calculations || calculations.length === 0) {
            return res.status(400).json({ message: 'Project name and calculations are required for report generation.' });
        }

        let csvContent = 'Project Name,Material Type,Item Name,Length (m),Width (m),Height (m),Thickness (m),Area (sqm),Calculated Bricks (Nos),Calculated Cement (bags),Calculated Sand (m3),Calculated Aggregate (m3),Calculated Wet Volume (m3),Calculated Steel (kg),Calculated Tiles (pcs),Calculated Paint (Ltr),Calculated Earthwork Vol (m3),Calculated Tank Vol (m3),Waste Factor (%)\n';

        calculations.forEach(calc => {
            const wasteFactor = calc.wasteFactor || 0;
            let calculatedBricks = '';
            let calculatedCementBags = '';
            let calculatedSandM3 = '';
            let calculatedAggregateM3 = '';
            let calculatedWetVolumeM3 = '';
            let calculatedSteelKg = '';
            let calculatedTiles = '';
            let calculatedPaint = '';
            let calculatedEarthworkVol = '';
            let calculatedTankVol = '';
            let area = '';

            if (calc.calculated) {
                if (calc.type === 'bricks') {
                    calculatedBricks = calc.calculated.totalBricks ? calc.calculated.totalBricks.toFixed(0) : '';
                    calculatedCementBags = calc.calculated.cementMortarBags ? calc.calculated.cementMortarBags.toFixed(1) : '';
                    calculatedSandM3 = calc.calculated.sandMortarVolume ? calc.calculated.sandMortarVolume.toFixed(2) : '';
                } else if (calc.type === 'concrete' || (calc.type === 'roofing' && calc.roofingType === 'rcc_slab')) {
                    calculatedCementBags = calc.calculated.cementBags ? calc.calculated.cementBags.toFixed(1) : '';
                    calculatedSandM3 = calc.calculated.sandVolume ? calc.calculated.sandVolume.toFixed(2) : '';
                    calculatedAggregateM3 = calc.calculated.aggregateVolume ? calc.calculated.aggregateVolume.toFixed(2) : '';
                    calculatedWetVolumeM3 = calc.calculated.wetVolume ? calc.calculated.wetVolume.toFixed(2) : '';
                } else if (calc.type === 'steel') {
                    calculatedSteelKg = calc.calculated.totalWeight ? calc.calculated.totalWeight.toFixed(2) : '';
                } else if (calc.type === 'plastering' && calc.plasteringMaterialType === 'plastering') {
                    area = calc.surfaceArea ? calc.surfaceArea.toFixed(2) : '';
                    calculatedCementBags = calc.calculated.cementBags ? calc.calculated.cementBags.toFixed(1) : '';
                    calculatedSandM3 = calc.calculated.sandVolume ? calc.calculated.sandVolume.toFixed(2) : '';
                } else if (calc.type === 'plastering' && calc.plasteringMaterialType === 'flooring') {
                    area = calc.surfaceArea ? calc.surfaceArea.toFixed(2) : '';
                    calculatedTiles = calc.calculated.tilesNeeded ? calc.calculated.tilesNeeded : '';
                } else if (calc.type === 'plastering' && calc.plasteringMaterialType === 'painting') {
                    area = calc.surfaceArea ? calc.surfaceArea.toFixed(2) : '';
                    calculatedPaint = calc.calculated.paintNeeded ? calc.calculated.paintNeeded.toFixed(2) : '';
                } else if (calc.type === 'roofing' && calc.roofingType === 'truss_roof') {
                    area = calc.trussArea ? calc.trussArea.toFixed(2) : '';
                } else if (calc.type === 'earthwork') {
                    calculatedEarthworkVol = calc.calculated.totalVolume ? calc.calculated.totalVolume.toFixed(2) : '';
                } else if (calc.type === 'tank') {
                    calculatedTankVol = calc.calculated.volume ? calc.calculated.volume.toFixed(2) : '';
                }
            }
            
            const length = calc.length ? calc.length.toFixed(2) : (calc.wallLength ? calc.wallLength.toFixed(2) : '');
            const width = calc.width ? calc.width.toFixed(2) : '';
            const height = calc.height ? calc.height.toFixed(2) : (calc.wallHeight ? calc.wallHeight.toFixed(2) : '');
            const thickness = calc.thickness ? calc.thickness.toFixed(2) : (calc.wallThickness ? calc.wallThickness.toFixed(2) : '');

            csvContent += `"${projectName}",`;
            csvContent += `"${calc.type}",`;
            csvContent += `"${calc.name || 'N/A'}",`;
            csvContent += `${length},${width},${height},${thickness},${area},`;
            csvContent += `${calc.plasteringThickness ? calc.plasteringThickness.toFixed(3) : ''},`;
            csvContent += `${calculatedBricks},${calculatedCementBags},${calculatedSandM3},${calculatedAggregateM3},${calculatedWetVolumeM3},`;
            csvContent += `${calculatedSteelKg},${calculatedTiles},${calculatedPaint},${calculatedEarthworkVol},${calculatedTankVol},`;
            csvContent += `${wasteFactor}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${projectName.replace(/[^a-z0-9]/gi, '_')}_Material_Report.csv"`);
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Error generating CSV report:', error);
        res.status(500).json({ message: 'Error generating CSV report', error: error.message });
    }
});

app.post('/api/reports/pdf', (req, res) => {
    try {
        const { projectName, calculations } = req.body;

        if (!projectName || !calculations || calculations.length === 0) {
            return res.status(400).json({ message: 'Project name and calculations are required for PDF report generation.' });
        }

        const doc = new PDFDocument();
        const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_Material_Report.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        doc.fontSize(24).text(`Project: ${projectName}`, { align: 'center' }).moveDown();
        doc.fontSize(16).text('Material Breakdown and Cost Estimate', { align: 'center' }).moveDown(1.5);

        let totalCementBags = 0;
        let totalSandM3 = 0;
        let totalAggregateM3 = 0;
        let totalBricksNos = 0;
        let totalSteelKg = 0;
        let totalTilesNos = 0;
        let totalPaintLtr = 0;
        let totalEarthworkM3 = 0;
        let totalTankVolumeM3 = 0;
        let totalEstimatedCost = 0;

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

        doc.fontSize(14).text('Individual Calculations:', { underline: true }).moveDown(0.5);

        if (calculations.length === 0) {
            doc.text('No calculations in this project.', { indent: 20 }).moveDown();
        } else {
            calculations.forEach((calc, index) => {
                doc.fontSize(12).text(`  ${index + 1}. ${calc.name || 'Untitled'} (${calc.type}) - Waste: ${calc.wasteFactor || 0}%`);
                
                if (calc.calculated) {
                    if (calc.type === 'bricks') {
                        const b = calc.calculated;
                        doc.fontSize(10).text(`    - Bricks: ${b.totalBricks || 'N/A'} Nos.`);
                        doc.text(`    - Mortar Cement: ${b.cementMortarBags ? b.cementMortarBags.toFixed(1) : 'N/A'} bags`);
                        doc.text(`    - Mortar Sand: ${b.sandMortarVolume ? b.sandMortarVolume.toFixed(2) : 'N/A'} m³`);
                        totalBricksNos += b.totalBricks || 0;
                        totalCementBags += b.cementMortarBags || 0;
                        totalSandM3 += b.sandMortarVolume || 0;
                    } else if (calc.type === 'concrete' || (calc.type === 'roofing' && calc.roofingType === 'rcc_slab')) {
                        const c = calc.calculated;
                        doc.fontSize(10).text(`    - Wet Volume: ${c.wetVolume ? c.wetVolume.toFixed(2) : 'N/A'} m³`);
                        doc.text(`    - Cement: ${c.cementBags ? c.cementBags.toFixed(1) : 'N/A'} bags`);
                        doc.text(`    - Sand: ${c.sandVolume ? c.sandVolume.toFixed(2) : 'N/A'} m³`);
                        doc.text(`    - Aggregate: ${c.aggregateVolume ? c.aggregateVolume.toFixed(2) : 'N/A'} m³`);
                        totalCementBags += c.cementBags || 0;
                        totalSandM3 += c.sandVolume || 0;
                        totalAggregateM3 += c.aggregateVolume || 0;
                    } else if (calc.type === 'steel') {
                        const s = calc.calculated;
                        doc.fontSize(10).text(`    - Total Steel Weight: ${s.totalWeight ? s.totalWeight.toFixed(2) : 'N/A'} kg`);
                        totalSteelKg += s.totalWeight || 0;
                    } else if (calc.type === 'plastering' && calc.plasteringMaterialType === 'plastering') {
                        const p = calc.calculated;
                        doc.fontSize(10).text(`    - Area: ${calc.surfaceArea ? calc.surfaceArea.toFixed(2) : 'N/A'} sqm`);
                        doc.text(`    - Cement: ${p.cementBags ? p.cementBags.toFixed(1) : 'N/A'} bags`);
                        doc.text(`    - Sand: ${p.sandVolume ? p.sandVolume.toFixed(2) : 'N/A'} m³`);
                        totalCementBags += p.cementBags || 0;
                        totalSandM3 += p.sandVolume || 0;
                    } else if (calc.type === 'plastering' && calc.plasteringMaterialType === 'flooring') {
                        const p = calc.calculated;
                        doc.fontSize(10).text(`    - Area: ${calc.surfaceArea ? calc.surfaceArea.toFixed(2) : 'N/A'} sqm`);
                        doc.text(`    - Tiles: ${p.tilesNeeded ? p.tilesNeeded : 'N/A'} pcs`);
                        totalTilesNos += p.tilesNeeded || 0;
                    } else if (calc.type === 'plastering' && calc.plasteringMaterialType === 'painting') {
                        const p = calc.calculated;
                        doc.fontSize(10).text(`    - Area: ${calc.surfaceArea ? calc.surfaceArea.toFixed(2) : 'N/A'} sqm`);
                        doc.text(`    - Paint: ${p.paintNeeded ? p.paintNeeded.toFixed(2) : 'N/A'} Ltr`);
                        totalPaintLtr += p.paintNeeded || 0;
                    } else if (calc.type === 'roofing' && calc.roofingType === 'truss_roof') {
                         const r = calc.calculated;
                         doc.fontSize(10).text(`    - Truss Roof Area: ${r.area ? r.area.toFixed(2) : 'N/A'} m²`);
                         doc.text(`    - Material: ${r.material} with ${r.covering} covering`);
                         totalEstimatedCost += (r.area || 0) * (materialPrices.truss_roof_m2 || 0);
                    } else if (calc.type === 'earthwork') {
                        const e = calc.calculated;
                        doc.fontSize(10).text(`    - Excavation Volume: ${e.totalVolume ? e.totalVolume.toFixed(2) : 'N/A'} m³`);
                        totalEarthworkM3 += e.totalVolume || 0;
                        totalEstimatedCost += (e.totalVolume || 0) * (materialPrices.earthwork_m3 || 0);
                    } else if (calc.type === 'tank') {
                        const t = calc.calculated;
                        doc.fontSize(10).text(`    - Tank Volume: ${t.volume ? t.volume.toFixed(2) : 'N/A'} m³`);
                        doc.text(`    - Volume in Liters: ${t.volume ? (t.volume * 1000).toFixed(2) : 'N/A'} Ltr`);
                        totalTankVolumeM3 += t.volume || 0;
                        totalEstimatedCost += (t.volume || 0) * (materialPrices.tank_volume_m3 || 0);
                    }
                }
                doc.moveDown(0.5);
            });
        }
        doc.moveDown(1);

        totalEstimatedCost += totalCementBags * materialPrices.cement_bags;
        totalEstimatedCost += totalSandM3 * materialPrices.sand_m3;
        totalEstimatedCost += totalAggregateM3 * materialPrices.aggregate_m3;
        totalEstimatedCost += totalBricksNos * materialPrices.bricks_nos;
        totalEstimatedCost += totalSteelKg * materialPrices.steel_kg;
        totalEstimatedCost += totalTilesNos * materialPrices.tiles_m2;
        totalEstimatedCost += totalPaintLtr * materialPrices.paint_Ltr;

        doc.fontSize(14).text('Overall Project Summary:', { underline: true }).moveDown(0.5);
        doc.fontSize(12).text(`Total Cement: ${totalCementBags.toFixed(1)} bags`);
        doc.text(`Total Sand: ${totalSandM3.toFixed(2)} m³`);
        doc.text(`Total Aggregate: ${totalAggregateM3.toFixed(2)} m³`);
        doc.text(`Total Bricks: ${Math.ceil(totalBricksNos)} Nos.`);
        doc.text(`Total Steel: ${totalSteelKg.toFixed(2)} kg`);
        doc.text(`Total Tiles: ${totalTilesNos} pcs`);
        doc.text(`Total Paint: ${totalPaintLtr.toFixed(2)} Ltr`);
        doc.text(`Total Earthwork Volume: ${totalEarthworkM3.toFixed(2)} m³`);
        doc.text(`Total Tank Volume: ${totalTankVolumeM3.toFixed(2)} m³`);
        doc.moveDown(0.5);
        doc.fontSize(16).text(`Estimated Total Cost: ₹ ${totalEstimatedCost.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, { continued: false }).moveDown(1);
        doc.fontSize(10).text('Note: Costs are estimates based on predefined prices and should be verified with actual market rates.', { align: 'center', oblique: true });

        doc.end();

    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ message: 'Error generating PDF report', error: error.message });
    }
});


// --- Serve Frontend Static Files ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/qsc.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'qsc.html'));
});

app.get('/floorplan_designer.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'floorplan_designer.html'));
});

app.use(express.static(path.join(__dirname, '../frontend')));


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the home page at http://localhost:${PORT}`);
    console.log(`Access QSC Calculator at http://localhost:${PORT}/qsc.html`);
    console.log(`Access Floor Plan Designer at http://localhost:${PORT}/floorplan_designer.html`);
});