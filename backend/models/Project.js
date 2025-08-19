const mongoose = require('mongoose');

const MaterialCalculationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['concrete', 'bricks', 'steel', 'plastering', 'roofing', 'earthwork', 'tank']
    },
    name: {
        type: String,
        required: true
    },
    length: Number,
    width: Number,
    height: Number,
    depth: Number,
    thickness: Number,
    wasteFactor: {
        type: Number,
        default: 5
    },
    concreteMix: String,
    mortarMix: String,
    brickWallLength: Number,
    brickWallHeight: Number,
    brickWallThickness: Number,
    brickSizeLength: Number,
    brickSizeWidth: Number,
    brickSizeHeight: Number,
    mortarJointThickness: Number,
    
    steelType: String,
    steelBarDiameter: Number,
    steelBarLength: Number,
    steelBarQuantity: Number,
    steelStirrupDiameter: Number,
    steelStirrupLength: Number,
    steelStirrupQuantity: Number,
    steelWasteFactor: Number,

    plasteringMaterialType: String,
    surfaceArea: Number,
    plasteringThickness: Number,
    plasteringMix: String,
    plasteringWasteFactor: Number,
    tileArea: Number,
    flooringWasteFactor: Number,
    paintCoverage: Number,
    paintCoats: Number,
    paintingWasteFactor: Number,

    roofingType: String,
    rccLength: Number,
    rccWidth: Number,
    rccThickness: Number,
    rccMix: String,
    rccWasteFactor: Number,
    trussArea: Number,
    trussMaterial: String,
    trussCovering: String,
    
    earthLength: Number,
    earthWidth: Number,
    earthDepth: Number,

    tankShape: String,
    tankLength: Number,
    tankWidth: Number,
    tankHeight: Number,
    tankDiameter: Number,
    tankCylHeight: Number,

    calculated: {
        type: mongoose.Schema.Types.Mixed
    },

    floor: String,
    buildingPart: String,
    notes: String
});


const ProjectSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: 'A new building project.'
    },
    calculations: [MaterialCalculationSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ProjectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Project', ProjectSchema);