// data from alm_hardware
interface Hardware {
  displayName: null | string;
  modelCategoryName: null | string;
  modelName: null | string;
  modelSysId: null | string;
  parent: null | string;
  rackName: null | string;
  rackSysId: null | string;
  rackU: null | number;
  slot: null | number;
  url: null | string;
}
// data from cmdb_model
interface Model {
  maxChildren: null | number;
  modelName: null | string;
  rackUnits: null | number;
}
// smaller datastructures based on Hardware, but with excess data removed
interface BadData {
  displayName: null | string;
  modelCategoryName: null | string;
  modelName: null | string;
  parent: null | string;
  rackU: null | number;
  slot: null | number;
  url: null | string;
}
interface LineCard {
  displayName: null | string;
  modelName: null | string;
  url: null | string;
}
interface Pdu {
  displayName: null | string;
  modelName: null | string;
  url: null | string;
}
interface RackMounted {
  displayName: null | string;
  lineCards: Record<string, LineCard>;
  maxChildren: null | number;
  modelCategoryName: null | string;
  modelName: null | string;
  rackU: null | number;
  sleds: Record<string, Sled>;
  url: null | string;
}
interface Sled {
  displayName: null | string;
  modelName: null | string;
  slot: null | number;
  url: null | string;
}
// the rack
interface Rack {
  badData: Record<string, BadData>;
  pdu: Record<string, Pdu>;
  rackMounted: Record<string, RackMounted>;
  rackName: null | string;
}
// global variables
const rackSysIdList: Array<string> = [
  'c2ea8b2edb151f80a9885205dc9619d9',
  '3abaa3f4db271788259e5898dc9619ab',
];
// @ts-ignore
const site = gs.getProperty('glide.servlet.uri');
// functions
const hasKey = (testObject: any, keyString: any) => {
  return Object.prototype.hasOwnProperty.call(testObject, keyString);
};
const testValidChassisSled = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
) => {
  const tempHardware: Hardware = tempHardwareData[hardwareSysId];
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
const testValidRackMounted = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
  tempModelData: Record<string, Model>,
) => {
  const tempHardware: Hardware = tempHardwareData[hardwareSysId];
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
const testValidLineCard = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
) => {
  const tempHardware: Hardware = tempHardwareData[hardwareSysId];
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
const testValidPdu = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
) => {
  const tempHardware: Hardware = tempHardwareData[hardwareSysId];
  // model category must be correct
  if (tempHardware.modelCategoryName !== 'PDU') {
    return false;
  }
  // all tests passed
  return true;
};
const findCategory = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
  tempModelData: Record<string, Model>,
) => {
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
const sortHardware = (
  tempHardwareData: Record<string, Hardware>,
  tempModelData: Record<string, Model>,
) => {
  let category: string;
  let outputData: Record<string, Rack> = {};
  let maxChildren: null | number;
  let modelName: null | string;
  let modelSysId: null | string;
  let tempLineCards: Record<string, Hardware> = {};
  let tempSleds: Record<string, Hardware> = {};
  let sysIdParent: null | string;
  let sysIdRack: null | string;
  Object.keys(tempHardwareData).forEach((hardwareSysId) => {
    // get relevant model data
    maxChildren = null;
    modelName = null;
    modelSysId = tempHardwareData[hardwareSysId].modelSysId;
    if (modelSysId !== null) {
      if (hasKey(tempModelData, modelSysId)) {
        maxChildren = tempModelData[modelSysId].maxChildren;
        modelName = tempModelData[modelSysId].modelName;
      }
    }

    category = findCategory(
      hardwareSysId,
      tempHardwareData,
      tempModelData,
    );
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
        outputData[sysIdRack].badData[hardwareSysId] = {
          displayName: tempHardwareData[hardwareSysId].displayName,
          modelCategoryName: tempHardwareData[hardwareSysId].modelCategoryName,
          modelName,
          parent: tempHardwareData[hardwareSysId].parent,
          rackU: tempHardwareData[hardwareSysId].rackU,
          slot: tempHardwareData[hardwareSysId].slot,
          url: tempHardwareData[hardwareSysId].url,
        };
      }
      if (category === 'pdu') {
        outputData[sysIdRack].pdu[hardwareSysId] = {
          displayName: tempHardwareData[hardwareSysId].displayName,
          modelName,
          url: tempHardwareData[hardwareSysId].url,
        };
      }
      if (category === 'rackMounted') {
        outputData[sysIdRack].rackMounted[hardwareSysId] = {
          displayName: tempHardwareData[hardwareSysId].displayName,
          maxChildren,
          lineCards: {},
          modelCategoryName: tempHardwareData[hardwareSysId].modelCategoryName,
          modelName,
          rackU: tempHardwareData[hardwareSysId].rackU,
          sleds: {},
          url: tempHardwareData[hardwareSysId].url,
        };
      }
      // linecards are stored with all Hardware data, but will be slimmed down later
      if (category === 'lineCard') {
        tempLineCards[hardwareSysId] = {
          displayName: tempHardwareData[hardwareSysId].displayName,
          modelCategoryName: null,
          modelName,
          modelSysId: null,
          parent: tempHardwareData[hardwareSysId].parent,
          rackName: null,
          rackSysId: tempHardwareData[hardwareSysId].rackSysId,
          rackU: null,
          slot: null,
          url: tempHardwareData[hardwareSysId].url,
        };
      }
      // sleds are stored with all Hardware data, but will be slimmed down later
      if (category === 'sled') {
        tempSleds[hardwareSysId] = {
          displayName: tempHardwareData[hardwareSysId].displayName,
          modelCategoryName: null,
          modelName,
          modelSysId: null,
          parent: tempHardwareData[hardwareSysId].parent,
          rackName: null,
          rackSysId: tempHardwareData[hardwareSysId].rackSysId,
          rackU: null,
          slot: tempHardwareData[hardwareSysId].slot,
          url: tempHardwareData[hardwareSysId].url,
        };
      }
    }
  });
  // insert sleds
  Object.keys(tempSleds).forEach((hardwareSysId) => {
    let validSled = false;
    let slot: null | number;
    sysIdParent = tempSleds[hardwareSysId].parent;
    sysIdRack = tempSleds[hardwareSysId].rackSysId;
    if (sysIdRack !== null) {
      if (sysIdParent !== null) {
        if (hasKey(outputData, sysIdRack)) {
          if (hasKey(outputData[sysIdRack].rackMounted, sysIdParent)) {
            // sleds can not have a slot value less than one
            // sleds can not have a slot value greater than the chassis u_max_children
            maxChildren = outputData[sysIdRack].rackMounted[sysIdParent].maxChildren;
            slot = tempSleds[hardwareSysId].slot;
            // sleds can only be parented to a rackmounted object with a valid u_max_children value
            if (maxChildren !== null) {
              // slot value must be valid
              if (slot !== null && slot > 0 && slot <= maxChildren) {
                validSled = true;
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
  // insert line cards
  Object.keys(tempLineCards).forEach((hardwareSysId) => {
    let validLineCard = false;
    sysIdParent = tempLineCards[hardwareSysId].parent;
    sysIdRack = tempLineCards[hardwareSysId].rackSysId;
    if (sysIdRack !== null) {
      if (sysIdParent !== null) {
        if (hasKey(outputData, sysIdRack)) {
          if (hasKey(outputData[sysIdRack].rackMounted, sysIdParent)) {
            validLineCard = true;
            outputData[sysIdRack].rackMounted[sysIdParent].lineCards[hardwareSysId] = {
              displayName: tempLineCards[hardwareSysId].displayName,
              modelName: tempLineCards[hardwareSysId].modelName,
              url: tempLineCards[hardwareSysId].url,
            };
          }
        }
      }
      if (validLineCard === false) {
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
const main = (
  sysIdRackList: Array<string>,
) => {
  let hardwareData: Record<string, Hardware> = {};
  let modelData: Record<string, Model> = {};
  let modelSysIdUnique: Record<string, boolean> = {};
  let modelSysIdList: Array<string>;
  let tempHardware: Hardware;
  let tempModel: Model;
  let testData: any;
  if (sysIdRackList.length !== 0) {
    // @ts-ignore
    const grHardware = new GlideRecord('alm_hardware');
    grHardware.addQuery('u_rack', 'IN', sysIdRackList);
    grHardware.query();
    while (grHardware.next()) {
      tempHardware = {
        displayName: null,
        modelCategoryName: null,
        modelName: null,
        modelSysId: null,
        parent: null,
        rackName: null,
        rackSysId: null,
        rackU: null,
        slot: null,
        url: null,
      };
      //
      testData = grHardware.getDisplayValue('display_name');
      if (typeof testData === 'string') {
        if (testData !== '') {
          tempHardware.displayName = testData;
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
        displayName: tempHardware.displayName,
        modelCategoryName: tempHardware.modelCategoryName,
        modelName: null,
        modelSysId: tempHardware.modelSysId,
        parent: tempHardware.parent,
        rackName: tempHardware.rackName,
        rackSysId: tempHardware.rackSysId,
        rackU: tempHardware.rackU,
        slot: tempHardware.slot,
        url: `${site}/alm_hardware.do?sys_id=${grHardware.getUniqueValue()}`,
      };
    }
  }
  modelSysIdList = Object.keys(modelSysIdUnique);
  if (modelSysIdList.length !== 0) {
    // @ts-ignore
    const grModel = new GlideRecord('cmdb_model');
    grModel.addQuery('sys_id', 'IN', modelSysIdList);
    grModel.query();
    while (grModel.next()) {
      tempModel = {
        maxChildren: null,
        modelName: null,
        rackUnits: null,
      };
      //
      testData = grModel.getValue('u_max_children');
      if (!isNaN(parseInt(testData, 10))) {
        tempModel.maxChildren = parseInt(testData, 10);
      }
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
        maxChildren: tempModel.maxChildren,
        modelName: tempModel.modelName,
        rackUnits: tempModel.rackUnits,
      };
    }
  }
  sortHardware(
    hardwareData,
    modelData,
  );
};
//
main(rackSysIdList);