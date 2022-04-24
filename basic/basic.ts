// data from alm_hardware
interface Hardware {
  assetTag: null | string;
  ciSysId: null | string;
  ciName: null | string;
  displayName: null | string;
  hardwareSkuSysId: null | string;
  installStatus: null | string;
  lastPhysicalAudit: null | number;
  location: null | string;
  modelCategoryName: null | string;
  modelName: null | string;
  modelSysId: null | string;
  parent: null | string;
  provisionId: null | string;
  rackName: null | string;
  rackSysId: null | string;
  rackU: null | number;
  serialNumber: null | string;
  slot: null | number;
  substatus: null | string;
  url: null | string;
}
// data from cmdb_model
interface Model {
  maxChildren: null | number;
  modelName: null | string;
  rackUnits: null | number;
}
// bad data that did not match any other category or had a missing parent
interface BadData {
  displayName: null | string;
  modelCategoryName: null | string;
  modelName: null | string;
  parent: null | string;
  rackU: null | number;
  slot: null | number;
  url: null | string;
}
// a line card is a network device that is parented to a rack mounted object
interface LineCard {
  displayName: null | string;
  modelName: null | string;
  url: null | string;
}
// a pdu that is in the rack, but not mounted in a unit
interface Pdu {
  displayName: null | string;
  modelName: null | string;
  url: null | string;
}
// a device that is mounted in a rack unit. may contain sleds or line cards.
interface RackMounted {
  assetTag: null | string;
  ciSysId: null | string;
  ciName: null | string;
  displayName: null | string;
  hardwareSkuSysId: null | string;
  installStatus: null | string;
  lastPhysicalAudit: null | number;
  lineCards: Record<string, LineCard>;
  location: null | string;
  modelCategoryName: null | string;
  modelName: null | string;
  modelSysId: null | string;
  provisionId: null | string;
  rackU: null | number;
  serialNumber: null | string;
  sleds: Record<string, Sled>;
  substatus: null | string;
  url: null | string;
}
// a sled that is parented to a rackmounted object
interface Sled {
  assetTag: null | string;
  ciSysId: null | string;
  ciName: null | string;
  displayName: null | string;
  hardwareSkuSysId: null | string;
  installStatus: null | string;
  lastPhysicalAudit: null | number;
  location: null | string;
  modelCategoryName: null | string;
  modelName: null | string;
  modelSysId: null | string;
  provisionId: null | string;
  serialNumber: null | string;
  slot: null | number;
  substatus: null | string;
  url: null | string;
}
// the rack
interface Rack {
  badData: Record<string, BadData>;
  pdu: Record<string, Pdu>;
  rackMounted: Record<string, RackMounted>;
  rackName: null | string;
}
// a list of rack sys_ids that will be used to search alm_hardware
const rackSysIdList: Array<string> = [
  'c2ea8b2edb151f80a9885205dc9619d9',
  '3abaa3f4db271788259e5898dc9619ab',
  '17cb27f8db271788259e5898dc96197e',
];
// used to create urls in the data
// @ts-ignore
const site = gs.getProperty('glide.servlet.uri');
//
const hasKey = (testObject: any, keyString: any) => {
  return Object.prototype.hasOwnProperty.call(testObject, keyString);
};
// test whether hardware is a valid sled
const testValidChassisSled = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
  tempModelData: Record<string, Model>,
) => {
  let tempModel: Model;
  let tempModelSysId: null | string;
  const tempHardware: Hardware = tempHardwareData[hardwareSysId];
  // needs a slot
  if (tempHardware.slot === null) {
    return false;
  }
  // slot cannot be less than 1
  if (tempHardware.slot !== null && tempHardware.slot < 1) {
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
  tempModelSysId = tempHardwareData[tempHardware.parent].modelSysId;
  // parent has model sys_id
  if (tempModelSysId === null) {
    return false;
  } else {
    // parent has a model
    if (!hasKey(tempModelData, tempModelSysId)) {
      return false;
    } else {
      tempModel = tempModelData[tempModelSysId];
      // parent has a u_max_children value
      if (tempModel.maxChildren === null) {
        return false;
      } else {
        // slot value cannot exceed u_max_children
        if (tempHardware.slot > tempModel.maxChildren) {
          return false;
        }
      }
    }
  }
  // all tests passed
  return true;
};
// test whether hardware is a valid rack mounted object
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
// test whether hardware is a valid line card
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
// test whether hardware is a pdu
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
// sort hardware into different categories and return an identifing string
const findCategory = (
  hardwareSysId: string,
  tempHardwareData: Record<string, Hardware>,
  tempModelData: Record<string, Model>,
) => {
  if (testValidChassisSled(hardwareSysId, tempHardwareData, tempModelData)) {
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
const sortHardware = (
  tempHardwareData: Record<string, Hardware>,
  tempModelData: Record<string, Model>,
) => {
  let category: string;
  let outputData: Record<string, Rack> = {};
  let tempLineCards: Record<string, Hardware> = {};
  let tempSleds: Record<string, Hardware> = {};
  let sysIdParent: null | string;
  let sysIdRack: null | string;
  // loop through all of the hardware from alm_hardware
  Object.keys(tempHardwareData).forEach((hardwareSysId) => {
    // sort the hardware into one of the categories
    category = findCategory(
      hardwareSysId,
      tempHardwareData,
      tempModelData,
    );
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
          assetTag: tempHardwareData[hardwareSysId].assetTag,
          ciSysId: tempHardwareData[hardwareSysId].ciSysId,
          ciName: tempHardwareData[hardwareSysId].ciName,
          displayName: tempHardwareData[hardwareSysId].displayName,
          hardwareSkuSysId: tempHardwareData[hardwareSysId].hardwareSkuSysId,
          installStatus: tempHardwareData[hardwareSysId].installStatus,
          lastPhysicalAudit: tempHardwareData[hardwareSysId].lastPhysicalAudit,
          lineCards: {},
          location: tempHardwareData[hardwareSysId].location,
          modelCategoryName: tempHardwareData[hardwareSysId].modelCategoryName,
          modelName: tempHardwareData[hardwareSysId].modelCategoryName,
          modelSysId: tempHardwareData[hardwareSysId].modelSysId,
          provisionId: tempHardwareData[hardwareSysId].provisionId,
          rackU: tempHardwareData[hardwareSysId].rackU,
          serialNumber: tempHardwareData[hardwareSysId].serialNumber,
          sleds: {},
          substatus: tempHardwareData[hardwareSysId].substatus,
          url: tempHardwareData[hardwareSysId].url,
        };
      }
      if (category === 'lineCard') {
        tempLineCards[hardwareSysId] = tempHardwareData[hardwareSysId];
      }
      if (category === 'sled') {
        tempSleds[hardwareSysId] = tempHardwareData[hardwareSysId];
      }
    }
  });
  // sleds and line cards are put in place after everything else to make sure that the object
  // they are parented to is in place. if the parent failed a test and is not in the final 
  // data structure then its children end up in bad data
  Object.keys(tempSleds).forEach((hardwareSysId) => {
    let validSled = false;
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
            // set this to true so that it is not stored in badData
            validSled = true;
            // parent the sled to its chassis
            outputData[sysIdRack].rackMounted[sysIdParent].sleds[hardwareSysId] = {
              assetTag: tempHardwareData[hardwareSysId].assetTag,
              ciSysId: tempHardwareData[hardwareSysId].ciSysId,
              ciName: tempHardwareData[hardwareSysId].ciName,
              displayName: tempSleds[hardwareSysId].displayName,
              hardwareSkuSysId: tempHardwareData[hardwareSysId].hardwareSkuSysId,
              installStatus: tempHardwareData[hardwareSysId].installStatus,
              lastPhysicalAudit: tempHardwareData[hardwareSysId].lastPhysicalAudit,
              location: tempHardwareData[hardwareSysId].location,
              modelCategoryName: tempHardwareData[hardwareSysId].modelCategoryName,
              modelName: tempSleds[hardwareSysId].modelName,
              modelSysId: tempHardwareData[hardwareSysId].modelSysId,
              provisionId: tempHardwareData[hardwareSysId].provisionId,
              serialNumber: tempHardwareData[hardwareSysId].serialNumber,
              slot: tempSleds[hardwareSysId].slot,
              substatus: tempHardwareData[hardwareSysId].substatus,
              url: tempSleds[hardwareSysId].url,
            };
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
  Object.keys(tempLineCards).forEach((hardwareSysId) => {
    let validLineCard = false;
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
            // set this to true so it does not get stored in badData
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
      // use an object with all fields set to null as default. these null values will only be
      // replaced if the data from servicenow passes rigorous tests
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