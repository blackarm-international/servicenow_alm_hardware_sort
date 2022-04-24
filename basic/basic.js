"use strict";
// a list of rack sys_ids that will be used to search alm_hardware
var rackSysIdList = [
    'c2ea8b2edb151f80a9885205dc9619d9',
    '3abaa3f4db271788259e5898dc9619ab',
    '17cb27f8db271788259e5898dc96197e',
];
// used to create urls in the data
// @ts-ignore
var site = gs.getProperty('glide.servlet.uri');
//
var hasKey = function (testObject, keyString) {
    return Object.prototype.hasOwnProperty.call(testObject, keyString);
};
// test whether hardware is a valid sled
var testValidChassisSled = function (hardwareSysId, tempHardwareData) {
    var tempHardware = tempHardwareData[hardwareSysId];
    // needs a slot
    if (tempHardware.slot === null) {
        return false;
    }
    // slot cannot be zero or negative
    if (tempHardware.slot !== null && tempHardware.slot < 1) {
        return false;
    }
    // needs a parent sys_id
    if (tempHardware.parent === null) {
        return false;
    }
    // all tests passed
    return true;
};
// test whether hardware is a valid rack mounted object
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
// test whether hardware is a valid line card
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
// test whether hardware is a pdu
var testValidPdu = function (hardwareSysId, tempHardwareData) {
    var tempHardware = tempHardwareData[hardwareSysId];
    // model category must be correct
    if (tempHardware.modelCategoryName !== 'PDU') {
        return false;
    }
    // all tests passed
    return true;
};
// sort hardware into different categories and return an identifing string
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
    // if the hardware failed all of the test then it ends up in badData
    return 'badData';
};
// this builds the nested data
var sortHardware = function (tempHardwareData, tempModelData) {
    var category;
    var maxChildren;
    var modelSysId;
    var outputData = {};
    var tempLineCards = {};
    var tempSleds = {};
    var sysIdParent;
    var sysIdRack;
    // loop through all of the hardware from alm_hardware
    Object.keys(tempHardwareData).forEach(function (hardwareSysId) {
        // get maxchildren from model data so it can be added to rackMounted
        // sleds with slot values that exceed max children will end up in bad data
        // so this needs to be visible in the nested data to understand why
        maxChildren = null;
        modelSysId = tempHardwareData[hardwareSysId].modelSysId;
        if (modelSysId !== null) {
            if (hasKey(tempModelData, modelSysId)) {
                maxChildren = tempModelData[modelSysId].maxChildren;
            }
        }
        // sort the hardware into one of the categories
        category = findCategory(hardwareSysId, tempHardwareData, tempModelData);
        sysIdRack = tempHardwareData[hardwareSysId].rackSysId;
        // this if statement is just a formality. all hardware should have a rack sys_id
        if (sysIdRack !== null) {
            // if this is the first time this rack is encountered, create the object ready
            if (!hasKey(outputData, sysIdRack)) {
                outputData[sysIdRack] = {
                    badData: {},
                    pdu: {},
                    rackMounted: {},
                    rackName: tempHardwareData[hardwareSysId].rackName,
                };
            }
            if (category === 'badData') {
                outputData[sysIdRack].badData[hardwareSysId] = {
                    displayName: tempHardwareData[hardwareSysId].displayName,
                    modelCategoryName: tempHardwareData[hardwareSysId].modelCategoryName,
                    modelName: tempHardwareData[hardwareSysId].modelCategoryName,
                    parent: tempHardwareData[hardwareSysId].parent,
                    rackU: tempHardwareData[hardwareSysId].rackU,
                    slot: tempHardwareData[hardwareSysId].slot,
                    url: tempHardwareData[hardwareSysId].url,
                };
            }
            if (category === 'pdu') {
                outputData[sysIdRack].pdu[hardwareSysId] = {
                    displayName: tempHardwareData[hardwareSysId].displayName,
                    modelName: tempHardwareData[hardwareSysId].modelCategoryName,
                    url: tempHardwareData[hardwareSysId].url,
                };
            }
            if (category === 'rackMounted') {
                outputData[sysIdRack].rackMounted[hardwareSysId] = {
                    displayName: tempHardwareData[hardwareSysId].displayName,
                    lineCards: {},
                    maxChildren: maxChildren,
                    modelName: tempHardwareData[hardwareSysId].modelCategoryName,
                    sleds: {},
                    url: tempHardwareData[hardwareSysId].url,
                };
            }
            // store data to be tested once all rackMounted objects are in place
            if (category === 'lineCard') {
                tempLineCards[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
            // store data to be tested once all rackMounted objects are in place
            if (category === 'sled') {
                tempSleds[hardwareSysId] = tempHardwareData[hardwareSysId];
            }
        }
    });
    // process sleds
    Object.keys(tempSleds).forEach(function (hardwareSysId) {
        // assume this is not a sled until proved otherwise
        var validSled = false;
        var testChassis;
        var testSlot;
        sysIdParent = tempSleds[hardwareSysId].parent;
        sysIdRack = tempSleds[hardwareSysId].rackSysId;
        // this is a formality. all hardware should have a rack sys_id
        if (sysIdRack !== null) {
            // this is a formality. all sleds have already been checked for a parent sys_id
            if (sysIdParent !== null) {
                // check that the rack already exists in outputData
                if (hasKey(outputData, sysIdRack)) {
                    // check that the sleds parent exists in the racks rackMounted
                    if (hasKey(outputData[sysIdRack].rackMounted, sysIdParent)) {
                        // check the chassis has a u_max_children value
                        testChassis = outputData[sysIdRack].rackMounted[sysIdParent];
                        if (testChassis.maxChildren !== null) {
                            // check the slot value does not exceed u_max_children
                            testSlot = tempSleds[hardwareSysId].slot;
                            if (testSlot !== null && testSlot <= testChassis.maxChildren) {
                                // confirm this is a sled so that it is not stored in badData
                                validSled = true;
                                // parent the sled to its chassis
                                outputData[sysIdRack].rackMounted[sysIdParent].sleds[hardwareSysId] = {
                                    displayName: tempSleds[hardwareSysId].displayName,
                                    modelName: tempSleds[hardwareSysId].modelName,
                                    slot: tempSleds[hardwareSysId].slot,
                                    url: tempSleds[hardwareSysId].url,
                                };
                            }
                        }
                    }
                }
            }
            if (validSled === false) {
                // this sled failed one of the above tests, so store it in the rack's badData
                outputData[sysIdRack].badData[hardwareSysId] = {
                    displayName: tempSleds[hardwareSysId].displayName,
                    modelCategoryName: tempSleds[hardwareSysId].modelCategoryName,
                    modelName: tempSleds[hardwareSysId].modelName,
                    parent: tempSleds[hardwareSysId].parent,
                    rackU: tempSleds[hardwareSysId].rackU,
                    slot: tempSleds[hardwareSysId].slot,
                    url: tempSleds[hardwareSysId].url,
                };
            }
        }
    });
    // process line cards
    Object.keys(tempLineCards).forEach(function (hardwareSysId) {
        // assume this is not a line card until proved otherwise
        var validLineCard = false;
        sysIdParent = tempLineCards[hardwareSysId].parent;
        sysIdRack = tempLineCards[hardwareSysId].rackSysId;
        // this is a formality. all hardware should have a rack sys_id
        if (sysIdRack !== null) {
            // this is a formality. all line cards have already been checked for a parent
            if (sysIdParent !== null) {
                // check that the rack already exists in outputData
                if (hasKey(outputData, sysIdRack)) {
                    // check that the sleds parent exists in the racks rackMounted
                    if (hasKey(outputData[sysIdRack].rackMounted, sysIdParent)) {
                        // confirm this is a line card so it does not get stored in badData
                        validLineCard = true;
                        // parent the line card to the rackMounted hardware
                        outputData[sysIdRack].rackMounted[sysIdParent].lineCards[hardwareSysId] = {
                            displayName: tempLineCards[hardwareSysId].displayName,
                            modelName: tempLineCards[hardwareSysId].modelName,
                            url: tempLineCards[hardwareSysId].url,
                        };
                    }
                }
            }
            if (validLineCard === false) {
                // this line card failed one of the above tests, so store it in the rack's badData
                outputData[sysIdRack].badData[hardwareSysId] = {
                    displayName: tempLineCards[hardwareSysId].displayName,
                    modelCategoryName: tempLineCards[hardwareSysId].modelCategoryName,
                    modelName: tempLineCards[hardwareSysId].modelName,
                    parent: tempLineCards[hardwareSysId].parent,
                    rackU: tempLineCards[hardwareSysId].rackU,
                    slot: tempLineCards[hardwareSysId].slot,
                    url: tempLineCards[hardwareSysId].url,
                };
            }
        }
    });
    // @ts-ignore
    gs.print(JSON.stringify(outputData, null, 2));
};
var main = function (sysIdRackList) {
    var ciSysIdUnique = {};
    var hardwareData = {};
    var hardwareSkuSysIdUnique = {};
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
            // use an object with all fields set to null as default. these null values will only be
            // replaced if the data from servicenow passes rigorous tests
            tempHardware = {
                assetTag: null,
                ciSysId: null,
                ciName: null,
                displayName: null,
                hardwareSkuSysId: null,
                installStatus: null,
                lastPhysicalAudit: null,
                location: null,
                modelCategoryName: null,
                modelName: null,
                modelSysId: null,
                parent: null,
                provisionId: null,
                rackName: null,
                rackSysId: null,
                rackU: null,
                serialNumber: null,
                slot: null,
                substatus: null,
                url: null,
            };
            //
            testData = grHardware.getValue('asset_tag');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.assetTag = testData;
                }
            }
            //
            testData = grHardware.getValue('ci');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.ciSysId = testData;
                    ciSysIdUnique[testData] = true;
                }
            }
            //
            testData = grHardware.getDisplayValue('ci');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.ciName = testData;
                }
            }
            //
            testData = grHardware.getValue('display_name');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.displayName = testData;
                }
            }
            //
            testData = grHardware.getValue('u_hardware_sku');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.hardwareSkuSysId = testData;
                    hardwareSkuSysIdUnique[testData] = true;
                }
            }
            //
            testData = grHardware.getDisplayValue('install_status');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.installStatus = testData;
                }
            }
            //
            testData = grHardware.getValue('u_last_physical_audit');
            // @ts-ignore
            if (new GlideDateTime(testData).getNumericValue() !== 0) {
                // @ts-ignore
                tempHardware.lastPhysicalAudit = new GlideDateTime(testData).getNumericValue();
            }
            //
            testData = grHardware.getDisplayValue('location');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.location = testData;
                }
            }
            //
            testData = grHardware.getDisplayValue('model_category');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.modelCategoryName = testData;
                }
            }
            //
            testData = grHardware.getDisplayValue('model');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.modelName = testData;
                }
            }
            //
            testData = grHardware.getValue('model');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.modelSysId = testData;
                    // collect unique model sys_ids for the next query
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
            testData = grHardware.getValue('u_provisioning_budget_code');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.provisionId = testData;
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
            testData = grHardware.getValue('serial_number');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.serialNumber = testData;
                }
            }
            //
            testData = grHardware.getValue('u_slot');
            if (!isNaN(parseInt(testData, 10))) {
                tempHardware.slot = parseInt(testData, 10);
            }
            //
            testData = grHardware.getValue('substatus');
            if (typeof testData === 'string') {
                if (testData !== '') {
                    tempHardware.substatus = testData;
                }
            }
            // modelName is null for now, but later will be combined with the data from cmdb_model
            hardwareData[grHardware.getUniqueValue()] = {
                assetTag: tempHardware.assetTag,
                ciSysId: tempHardware.ciSysId,
                ciName: tempHardware.ciName,
                displayName: tempHardware.displayName,
                hardwareSkuSysId: tempHardware.hardwareSkuSysId,
                installStatus: tempHardware.installStatus,
                lastPhysicalAudit: tempHardware.lastPhysicalAudit,
                location: tempHardware.location,
                modelCategoryName: tempHardware.modelCategoryName,
                modelName: tempHardware.modelName,
                modelSysId: tempHardware.modelSysId,
                parent: tempHardware.parent,
                provisionId: tempHardware.provisionId,
                rackName: tempHardware.rackName,
                rackSysId: tempHardware.rackSysId,
                rackU: tempHardware.rackU,
                serialNumber: tempHardware.serialNumber,
                slot: tempHardware.slot,
                substatus: tempHardware.substatus,
                url: "".concat(site, "/alm_hardware.do?sys_id=").concat(grHardware.getUniqueValue()),
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
            // use an object with all fields set to null as default. these null values will only be
            // replaced if the data from servicenow passes rigorous tests
            tempModel = {
                endOfLife: null,
                endOfSale: null,
                endOfSoftware: null,
                maxChildren: null,
                rackUnits: null,
            };
            //
            testData = grModel.getValue('u_end_of_life_date');
            // @ts-ignore
            if (new GlideDateTime(testData).getNumericValue() !== 0) {
                // @ts-ignore
                tempModel.endOfLife = new GlideDateTime(testData).getNumericValue();
            }
            //
            testData = grModel.getValue('u_end_of_sale_date');
            // @ts-ignore
            if (new GlideDateTime(testData).getNumericValue() !== 0) {
                // @ts-ignore
                tempModel.endOfSale = new GlideDateTime(testData).getNumericValue();
            }
            //
            testData = grModel.getValue('u_end_of_software_maintenance_date');
            // @ts-ignore
            if (new GlideDateTime(testData).getNumericValue() !== 0) {
                // @ts-ignore
                tempModel.endOfSoftware = new GlideDateTime(testData).getNumericValue();
            }
            //
            testData = grModel.getValue('u_max_children');
            if (!isNaN(parseInt(testData, 10))) {
                tempModel.maxChildren = parseInt(testData, 10);
            }
            //
            testData = grModel.getValue('rack_units');
            if (!isNaN(parseInt(testData, 10))) {
                tempModel.rackUnits = parseInt(testData, 10);
            }
            //
            modelData[grModel.getUniqueValue()] = {
                endOfLife: tempModel.endOfLife,
                endOfSale: tempModel.endOfSale,
                endOfSoftware: tempModel.endOfSoftware,
                maxChildren: tempModel.maxChildren,
                rackUnits: tempModel.rackUnits,
            };
        }
    }
    sortHardware(hardwareData, modelData);
};
//
main(rackSysIdList);
