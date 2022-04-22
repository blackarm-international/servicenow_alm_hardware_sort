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
var testValidNetworkGear = function (hardwareSysId, tempHardwareData) {
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
        return 'rack_mounted';
    }
    if (testValidNetworkGear(hardwareSysId, tempHardwareData)) {
        return 'network_gear';
    }
    if (testValidPdu(hardwareSysId, tempHardwareData)) {
        return 'pdu';
    }
    return 'bad_data';
};
var sortHardware = function (tempHardwareData, tempModelData) {
    var category;
    var outputData = {};
    var tempRackName;
    Object.keys(tempHardwareData).forEach(function (hardwareSysId) {
        category = findCategory(hardwareSysId, tempHardwareData, tempModelData);
        tempRackName = tempHardwareData[hardwareSysId].rackName;
        if (tempRackName !== null) {
            if (!hasKey(outputData, tempRackName)) {
                outputData[tempRackName] = {
                    'bad_data': {},
                    'network_gear': {},
                    'pdu': {},
                    'rack_mounted': {},
                    'sled': {},
                };
            }
            if (category === 'bad_data') {
                outputData[tempRackName].bad_data[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            if (category === 'network_gear') {
                outputData[tempRackName].network_gear[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            if (category === 'pdu') {
                outputData[tempRackName].pdu[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            if (category === 'rack_mounted') {
                outputData[tempRackName].rack_mounted[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            if (category === 'sled') {
                outputData[tempRackName].sled[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
        }
    });
    // @ts-ignore
    gs.print(JSON.stringify(outputData, null, 2));
};
var main = function (tempRackSysIdList) {
    var hardwareData = {};
    var modelData = {};
    var modelSysIdUnique = {};
    var modelSysIdList;
    var tempHardware;
    var tempModel;
    var testData;
    if (tempRackSysIdList.length !== 0) {
        // @ts-ignore
        var grHardware = new GlideRecord('alm_hardware');
        grHardware.addQuery('u_rack', 'IN', tempRackSysIdList);
        grHardware.query();
        while (grHardware.next()) {
            tempHardware = {
                modelCategoryName: null,
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
                rackUnits: null,
            };
            //
            testData = grModel.getValue('rack_units');
            if (!isNaN(parseInt(testData, 10))) {
                tempModel.rackUnits = parseInt(testData, 10);
            }
            //
            modelData[grModel.getUniqueValue()] = {
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
