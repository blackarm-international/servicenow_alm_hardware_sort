"use strict";
var hasKey = function (testObject, keyString) {
    return Object.prototype.hasOwnProperty.call(testObject, keyString);
};
var testValidChassisSled = function (hardwareSysId, tempHardwareData) {
    var tempHardware = tempHardwareData[hardwareSysId];
    // needs a slot
    if (tempHardware.slot === null) {
        return false;
    }
    // needs a parent sys_id
    if (tempHardware.parent === null) {
        return false;
    }
    // parent needs to exist
    if (!hasKey(tempHardwareData, tempHardware.parent)) {
        return false;
    }
    // parent needs to be in the same rack
    if (tempHardwareData[tempHardware.parent].rackSysId !== tempHardware.rackSysId) {
        return false;
    }
    // all tests passed
    return true;
};
var testValidRackMounted = function (hardwareSysId, tempHardwareData, tempModelData) {
    var tempHardware = tempHardwareData[hardwareSysId];
    // rack mounted hardware should not have a parent
    if (tempHardware.parent !== null) {
        return false;
    }
    // should have a rack_u
    if (tempHardware.rackU === null) {
        return false;
    }
    // rack_u should not be zero
    if (tempHardware.rackU === 0) {
        return false;
    }
    // needs a model sys_id
    if (tempHardware.modelSysId === null) {
        return false;
    }
    // model sys_id must relate to an existing model
    if (!hasKey(tempModelData, tempHardware.modelSysId)) {
        return false;
    }
    // the model must have a height in rack_units
    if (tempModelData[tempHardware.modelSysId].rackUnits === null) {
        return false;
    }
    // model height cannot be zero
    if (tempModelData[tempHardware.modelSysId].rackUnits === 0) {
        return false;
    }
    // all tests passed
    return true;
};
var testValidLineCard = function (hardwareSysId, tempHardwareData) {
    var tempHardware = tempHardwareData[hardwareSysId];
    // needs a parent sys_id
    if (tempHardware.parent === null) {
        return false;
    }
    // parent must exist
    if (!hasKey(tempHardwareData, tempHardware.parent)) {
        return false;
    }
    // parent must be in the same rack
    if (tempHardwareData[tempHardware.parent].rackSysId !== tempHardware.rackSysId) {
        return false;
    }
    // model category must be correct
    if (tempHardware.modelCategoryName !== 'Network Gear') {
        return false;
    }
    // all tests passed
    return true;
};
var testValidPdu = function (hardwareSysId, tempHardwareData) {
    var tempHardware = tempHardwareData[hardwareSysId];
    // model category must be correct
    if (tempHardware.modelCategoryName !== 'PDU') {
        return false;
    }
    // all tests passed
    return true;
};
var findCategory = function (hardwareSysId, tempHardwareData, tempModelData) {
    if (testValidChassisSled(hardwareSysId, tempHardwareData)) {
        return 'sled';
    }
    if (testValidRackMounted(hardwareSysId, tempHardwareData, tempModelData)) {
        return 'rackMounted';
    }
    if (testValidLineCard(hardwareSysId, tempHardwareData)) {
        return 'lineCard';
    }
    if (testValidPdu(hardwareSysId, tempHardwareData)) {
        return 'pdu';
    }
    return 'badData';
};
var sortHardware = function (tempHardwareData, tempModelData) {
    var category;
    var outputData = {};
    var modelName;
    var modelSysId;
    var tempLineCards = {};
    var tempSleds = {};
    var sysIdParent;
    var sysIdRack;
    Object.keys(tempHardwareData).forEach(function (hardwareSysId) {
        modelName = null;
        modelSysId = tempHardwareData[hardwareSysId].modelSysId;
        if (modelSysId !== null) {
            if (hasKey(tempModelData, modelSysId)) {
                modelName = tempModelData[modelSysId].modelName;
            }
        }
        category = findCategory(hardwareSysId, tempHardwareData, tempModelData);
        sysIdRack = tempHardwareData[hardwareSysId].rackSysId;
        if (sysIdRack !== null) {
            if (!hasKey(outputData, sysIdRack)) {
                outputData[sysIdRack] = {
                    badData: {},
                    pdu: {},
                    rackMounted: {},
                    rackName: tempHardwareData[hardwareSysId].rackName,
                };
            }
            if (category === 'badData') {
                outputData[sysIdRack].badData[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            if (category === 'pdu') {
                outputData[sysIdRack].pdu[hardwareSysId] = {
                    modelName: modelName,
                };
            }
            if (category === 'rackMounted') {
                outputData[sysIdRack].rackMounted[hardwareSysId] = {
                    lineCards: {},
                    modelCategoryName: tempHardwareData[hardwareSysId].modelCategoryName,
                    modelName: modelName,
                    rackU: tempHardwareData[hardwareSysId].rackU,
                    sleds: {},
                };
            }
            // data that will need to be inserted after the loop completes
            if (category === 'lineCard') {
                tempLineCards[hardwareSysId] = {
                    modelCategoryName: null,
                    modelName: modelName,
                    modelSysId: null,
                    parent: tempHardwareData[hardwareSysId].parent,
                    rackName: null,
                    rackSysId: tempHardwareData[hardwareSysId].rackSysId,
                    rackU: null,
                    slot: null,
                };
            }
            if (category === 'sled') {
                tempSleds[hardwareSysId] = {
                    modelCategoryName: null,
                    modelName: modelName,
                    modelSysId: null,
                    parent: tempHardwareData[hardwareSysId].parent,
                    rackName: null,
                    rackSysId: tempHardwareData[hardwareSysId].rackSysId,
                    rackU: null,
                    slot: tempHardwareData[hardwareSysId].slot,
                };
            }
        }
    });
    // insert sleds
    Object.keys(tempSleds).forEach(function (hardwareSysId) {
        sysIdParent = tempSleds[hardwareSysId].parent;
        sysIdRack = tempSleds[hardwareSysId].rackSysId;
        if (sysIdParent !== null && sysIdRack !== null) {
            if (hasKey(outputData, sysIdRack)) {
                if (hasKey(outputData[sysIdRack].rackMounted, sysIdParent)) {
                    outputData[sysIdRack].rackMounted[sysIdParent].sleds[hardwareSysId] = {
                        modelName: tempSleds[hardwareSysId].modelName,
                        slot: tempSleds[hardwareSysId].slot,
                    };
                }
            }
        }
    });
    // insert line cards
    Object.keys(tempLineCards).forEach(function (hardwareSysId) {
        sysIdParent = tempLineCards[hardwareSysId].parent;
        sysIdRack = tempLineCards[hardwareSysId].rackSysId;
        if (sysIdParent !== null && sysIdRack !== null) {
            if (hasKey(outputData, sysIdRack)) {
                if (hasKey(outputData[sysIdRack].rackMounted, sysIdParent)) {
                    outputData[sysIdRack].rackMounted[sysIdParent].lineCards[hardwareSysId] = {
                        modelName: tempLineCards[hardwareSysId].modelName,
                    };
                }
            }
        }
    });
    // @ts-ignore
    gs.print(JSON.stringify(outputData, null, 2));
};
var main = function (sysIdRackList) {
    var hardwareData = {};
    var modelData = {};
    var modelSysIdUnique = {};
    var modelSysIdList;
    var tempHardware;
    var tempModel;
    var testData;
    if (sysIdRackList.length !== 0) {
        // @ts-ignore
        var grHardware = new GlideRecord('alm_hardware');
        grHardware.addQuery('u_rack', 'IN', sysIdRackList);
        grHardware.query();
        while (grHardware.next()) {
            tempHardware = {
                modelCategoryName: null,
                modelName: null,
                modelSysId: null,
                parent: null,
                rackName: null,
                rackSysId: null,
                rackU: null,
                slot: null,
            };
            //
            testData = grHardware.getDisplayValue('model_category');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.modelCategoryName = testData;
                }
            }
            //
            testData = grHardware.getValue('model');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.modelSysId = testData;
                    modelSysIdUnique[testData] = true;
                }
            }
            //
            testData = grHardware.getValue('parent');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.parent = testData;
                }
            }
            //
            testData = grHardware.getDisplayValue('u_rack');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.rackName = testData;
                }
            }
            //
            testData = grHardware.getValue('u_rack');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.rackSysId = testData;
                }
            }
            //
            testData = grHardware.getValue('u_rack_u');
            if (!isNaN(parseInt(testData, 10))) {
                tempHardware.rackU = parseInt(testData, 10);
            }
            //
            testData = grHardware.getValue('u_slot');
            if (!isNaN(parseInt(testData, 10))) {
                tempHardware.slot = parseInt(testData, 10);
            }
            //
            hardwareData[grHardware.getUniqueValue()] = {
                modelCategoryName: tempHardware.modelCategoryName,
                modelName: null,
                modelSysId: tempHardware.modelSysId,
                parent: tempHardware.parent,
                rackName: tempHardware.rackName,
                rackSysId: tempHardware.rackSysId,
                rackU: tempHardware.rackU,
                slot: tempHardware.slot,
            };
        }
    }
    modelSysIdList = Object.keys(modelSysIdUnique);
    if (modelSysIdList.length !== 0) {
        // @ts-ignore
        var grModel = new GlideRecord('cmdb_model');
        grModel.addQuery('sys_id', 'IN', modelSysIdList);
        grModel.query();
        while (grModel.next()) {
            tempModel = {
                modelName: null,
                rackUnits: null,
            };
            //
            testData = grModel.getValue('display_name');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempModel.modelName = testData;
                }
            }
            //
            testData = grModel.getValue('rack_units');
            if (!isNaN(parseInt(testData, 10))) {
                tempModel.rackUnits = parseInt(testData, 10);
            }
            //
            modelData[grModel.getUniqueValue()] = {
                modelName: tempModel.modelName,
                rackUnits: tempModel.rackUnits,
            };
        }
    }
    sortHardware(hardwareData, modelData);
};
//
var rackSysIdString = 'c2ea8b2edb151f80a9885205dc9619d9,3abaa3f4db271788259e5898dc9619ab';
var rackSysIdList = rackSysIdString.split(',');
main(rackSysIdList);
