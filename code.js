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
// const testValidPatchpanel = (
//   patchpanel: Patchpanel,
//   modelData: Record<string, Model>,
// ) => {
//   try {
//     if (patchpanel.patchRackU === null) {
//       return {
//         pass: false,
//         failReport: 'not a valid  patchpanel - u_rack_u is missing',
//       };
//     }
//     if (patchpanel.patchRackU === 0) {
//       return {
//         pass: false,
//         failReport: 'not a valid  patchpanel - u_rack_u is zero',
//       };
//     }
//     if (patchpanel.patchModelSysId === null) {
//       return {
//         pass: false,
//         failReport: 'not a valid patchpanel - does not have a model',
//       };
//     }
//     if (!hasKey(modelData, patchpanel.patchModelSysId)) {
//       return {
//         pass: false,
//         failReport: 'not a valid patchpanel - model not found',
//       };
//     }
//     const model: Model = modelData[patchpanel.patchModelSysId];
//     if (model.rackUnits === null) {
//       return {
//         pass: false,
//         failReport: 'not a valid patchpanel - model height missing',
//       };
//     }
//     if (model.rackUnits < 1) {
//       return {
//         pass: false,
//         failReport: 'not a valid patchpanel - model height is less than 1',
//       };
//     }
//     return {
//       pass: true,
//       failReport: '',
//     };
//   } catch (err) {
//     errorLog('testValidPatchpanel', err);
//     return {
//       pass: false,
//       failReport: 'not a valid patchpanel - function crashed',
//     };
//   }
// };
// const testValidChassisNetwork = (
//   hardware: Hardware,
//   hardwareData: Record<string, Hardware>,
// ) => {
//   try {
//     if (hardware.parent === null) {
//       return {
//         pass: false,
//         failReport: 'not valid network gear - no parent',
//       };
//     }
//     if (!hasKey(hardwareData, hardware.parent)) {
//       return {
//         pass: false,
//         failReport: 'not valid network gear - parent not found in hardwareData',
//       };
//     }
//     if (hardwareData[hardware.parent].rackSysId !== hardware.rackSysId) {
//       return {
//         pass: false,
//         failReport: 'not valid network gear - parent not in the same rack',
//       };
//     }
//     if (hardware.modelCategoryName !== 'Network Gear') {
//       return {
//         pass: false,
//         failReport: 'not valid network gear - model category is not network gear',
//       };
//     }
//     return {
//       pass: true,
//       failReport: '',
//     };
//   } catch (err) {
//     errorLog('testValidChassisNetwork', err);
//     return {
//       pass: false,
//       failReport: 'not valid network gear - function crashed',
//     };
//   }
// };
var findCategory = function (hardwareSysId, tempHardwareData, tempModelData) {
    if (testValidChassisSled(hardwareSysId, tempHardwareData)) {
        return 'sled';
    }
    if (testValidRackMounted(hardwareSysId, tempHardwareData, tempModelData)) {
        return 'rack_mounted';
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
                    'network': {},
                    'pdu': {},
                    'rack_mounted': {},
                    'sled': {},
                };
            }
            if (category === 'sled') {
                outputData[tempRackName].sled[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            if (category === 'rack_mounted') {
                outputData[tempRackName].rack_mounted[hardwareSysId] = tempHardwareData[hardwareSysId];
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
var rackSysIdString = 'bc22df4adb1ec70cab79f7d41d9619f6,b817db4edb168bc010b6f1561d961914,f4738c21dbb1c7442b56541adc96196a,b1c34461dbb1c7442b56541adc96198f,efd3cc61dbb1c7442b56541adc961978,bdba2b74db271788259e5898dc9619a4,3abaa3f4db271788259e5898dc9619ab,3bba63f4db271788259e5898dc961971,30cae3f4db271788259e5898dc961926,0aca67f4db271788259e5898dc961979,e3a4fc5bdb7f8b80a9885205dc9619a5,3eca67f4db271788259e5898dc961980,3bca27f4db271788259e5898dc9619a1,09da2bf4db271788259e5898dc961954,c2da63f4db271788259e5898dc96197a,03da2bf4db271788259e5898dc961946,40c4789bdb7f8b80a9885205dc9619d8,9dec376a2b45820054a41bc5a8da15e9,c2ea8b2edb151f80a9885205dc9619d9,fa94f8ebdbed389459ac6e25ca9619fe,acbc736a2b45820054a41bc5a8da1503';
var rackSysIdList = rackSysIdString.split(',');
main(rackSysIdList);
