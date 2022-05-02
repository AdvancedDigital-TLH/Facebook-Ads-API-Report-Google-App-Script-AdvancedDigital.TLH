/**
 * Facebook-Ads-API-Report-Google-App-Script-AdvancedDigital.TLH
 * Copyright © 2022 | Advanced Digital
 * AdvancedDigital.TLH@gmail.com
 * https://github.com/AdvancedDigital-TLH/Facebook-Ads-API-Report-Google-App-Script-AdvancedDigital.TLH
 * https://www.youtube.com/channel/UCRAUad0hcBxsMsqiPGE5hZA
 */
 

function getAllFieldFromSheet() {
var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
var sheet = spreadsheet.getSheetByName('API Request Builder');
var sheetLastRow = sheet.getLastRow();
var sheetFieldList = sheet.getRange(1,2,sheetLastRow,1).getValues();
var userTimeZone = spreadsheet.getSpreadsheetTimeZone();

//SHEET_NAME
var sheetName = sheet.getRange(6,5).getValue().toString();
Logger.log("sheetName: " + sheetName);

//API_VERSION
var api_version = sheet.getRange(8,5).getValue().toString();
Logger.log("api_version: " + api_version);

//AD_ACCOUNT_ID
var adAccountID = sheet.getRange(9,5).getValue().toString();
Logger.log("adAccountID: "+adAccountID);

//API_TOKEN
var api_token = sheet.getRange(10,5).getValue();
Logger.log("api_token: "+api_token);

//DATE_PRESENT
var date_preset = sheet.getRange(12,5).getValue();
Logger.log("date_preset: "+date_preset);

//DATE_START
var get_date_start = sheet.getRange(14,5).getValue();
if (get_date_start == ""){
  var date_start = "";
} else {
  var date_start = Utilities.formatDate(get_date_start,userTimeZone,'yyyy-MM-dd');
}
Logger.log("date_start: "+date_start);

//DATE_END
var get_date_end = sheet.getRange(15,5).getValue();
if(get_date_end == ""){
  var date_end = "";
}else{
  var date_end = Utilities.formatDate(sheet.getRange(15,5).getValue(),userTimeZone,'yyyy-MM-dd');
}
Logger.log("date_end: "+date_end);

//TIME_INCREMENT
var time_increment = sheet.getRange(18,5).getValue();
Logger.log("time_increment: "+time_increment);

//LEVEL
var level = sheet.getRange(21,5).getValue();
Logger.log("level: "+level);

//LIMIT
var limit = sheet.getRange(133,5).getValue();
Logger.log("limit: "+limit);

//FIELD_FILTER
var field_filter = sheet.getRange(136,5).getValue();
Logger.log("field_filter: "+field_filter);

//OPERATOR
var operator = sheet.getRange(137,5).getValue();
Logger.log("operator: "+operator);

//VALUE_FILTER
var value_filter = sheet.getRange(138,5).getValue().toString();
Logger.log("value_filter: "+value_filter);

//ATTRIBUTION_WINDOWS
var attribution = sheet.getRange(141,5,2,1).getValues().toString();
Logger.log("attribution: "+attribution);

//FIELD_DEFAULT
var fieldDefaultRow = findRow("FIELD DEFAULT")+1; //tìm row bắt đầu của FIELD DEFAULT = 20
var userFieldDefaultList=sheet.getRange(fieldDefaultRow,5,38,1).getValues();
var field_default = returnField(userFieldDefaultList,fieldDefaultRow).fieldCodeOutput;
var field_default_name = returnField(userFieldDefaultList,fieldDefaultRow).fieldNameOutput;
Logger.log("field_default: "+field_default);
Logger.log("field_default_name: "+field_default_name);

//FIELD_ACTION
var fieldActionRow = findRow("FIELD ACTION")+1; //tìm row bắt đầu của FIELD ACTION = 60
var userFieldActionList=sheet.getRange(fieldActionRow,5,56,1).getValues();
var field_action = returnField(userFieldActionList,fieldActionRow).fieldCodeOutput;
var field_action_name = returnField(userFieldActionList,fieldActionRow).fieldNameOutput;
Logger.log("field_action: "+field_action);
Logger.log("field_action_name: "+field_action_name);

//BREAKDOWNS
var breakdownRow = findRow("BREAKDOWN")+1; //tìm row bắt đầu của BREAKDOWN = 120
var userBreakdownList=sheet.getRange(breakdownRow,5,8,1).getValues();
var breakdowns = returnField(userBreakdownList,breakdownRow).fieldCodeOutput;
var breakdowns_name = returnField(userBreakdownList,breakdownRow).fieldNameOutput;
Logger.log("breakdowns: "+breakdowns);
Logger.log("breakdowns_name: "+breakdowns_name);

//USER_HEADER
var header = createRawHeader_3(field_default,field_action,breakdowns,field_default_name,field_action_name,breakdowns_name)

var rawHeader = header.rawHeaderCode;
Logger.log("rawHeader: "+rawHeader);

var realHeaderUser = header.rawHeaderName;
Logger.log("realHeaderUser: "+realHeaderUser);
Logger.log("-------field_default: "+field_default);
Logger.log("-------field_default_name: "+field_default_name);

/*-----------------------------------------------------------
(3) TẠO RAWHEADER BAO GỒM CÁC FIELD MÀ USER YÊU CẦU
*/
function createRawHeader_3(field_default,field_action,breakdowns,field_default_name,field_action_name,breakdowns_name) {
  if (breakdowns.length>0){  
    var a = [...field_default]
    a.splice(1, 0, ...breakdowns);
    var b = [...field_default_name]
    b.splice(1, 0, ...breakdowns_name);
    var rawHeaderCode = [...a,...field_action];
    var rawHeaderName = [...b,...field_action_name];
    // Logger.log("--------rawHeaderCode: "+rawHeaderCode)
    // Logger.log("--------rawHeaderName: "+rawHeaderName)

  } else {
    var rawHeaderCode = [...field_default,...field_action];
    var rawHeaderName = [...field_default_name,...field_action_name];
  }
  return ({"rawHeaderCode":rawHeaderCode,"rawHeaderName":rawHeaderName});
}


  function returnField (values,fieldRow){
    var fieldCodeOutput = [];
    var fieldNameOutput = [];
    for(i=0;i<values.length;i++){
    if (values[i] == "true"){
      var trueFieldCode = sheet.getRange(fieldRow + i,3).getValue();
      var trueFieldName = sheet.getRange(fieldRow + i,4).getValue();
      if (trueFieldCode.toString().length != 0 & trueFieldName.toString().length != 0){
        fieldCodeOutput.push(trueFieldCode);
        fieldNameOutput.push(trueFieldName);
      }
    }
  }
    return ({"fieldCodeOutput":fieldCodeOutput,"fieldNameOutput":fieldNameOutput});
  }

  function findRow (findValue){
    for (i=0;i<sheetFieldList.length;i++){
      if (sheetFieldList[i] == findValue){
        return i+1;
      }
    }
  }

  var allFieldsFromSheet = {
    "sheetName": sheetName,
    "api_version" : "v"+api_version,
    "adAccountID" : adAccountID,
    "api_token" : api_token,
    "date_preset": date_preset,
    "date_start": date_start,
    "date_end": date_end,
    "time_increment": time_increment,
    "level_data" : level,
    "limit": limit,
    "field_filter": field_filter,
    "operator": operator,
    "value_filter": value_filter,
    "attribution":attribution,
    "field_default":field_default,
    "field_actions": field_action,
    "breakdowns": breakdowns,
    "rawHeader":rawHeader,
    "realHeaderUser":realHeaderUser
  }

  return allFieldsFromSheet;
}










