/**
 * Facebook-Ads-API-Report-Google-App-Script-AdvancedDigital.TLH
 * Copyright © 2022 | Advanced Digital
 * AdvancedDigital.TLH@gmail.com
 * https://github.com/AdvancedDigital-TLH/Facebook-Ads-API-Report-Google-App-Script-AdvancedDigital.TLH
 * https://www.youtube.com/channel/UCRAUad0hcBxsMsqiPGE5hZA
 */


function getFacebookReport() {
  try{
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // (1) Lấy toàn bộ field mà user đã input
    const allFieldsFromSheet = getAllFieldFromSheet();
    Logger.log(allFieldsFromSheet);

    const sheet = spreadsheet.getSheetByName(allFieldsFromSheet.sheetName);

    //(2) Xoá Csv report link tại sheet Builder
    spreadsheet.getSheetByName("API Request Builder").getRange(5,8).setValue("");

    // (3) Tạo facebook request URL và return reportId Job 
    var asynJob = requestAsynJob_1(allFieldsFromSheet);
    var reportId = asynJob.reportId;
    // var reportId = "520926266037911" //---------------------chỗ này test

    // (4) Sử dụng reportId để tạo link report CSV và tải file report Csv về, sau đó pasrseCsv vào sheet report
    const csvFile = getCsvfile_2(reportId,allFieldsFromSheet.api_token)
    const dataCsvFile = csvFile.dataCsvFile;
    Logger.log("getCsvfile_2 | Done");

    // (5) Tạo HeaderCsv từ file Csv mới import, xíu nữa sẽ được dùng để đối chiếu với các header cần xuất dữ liệu
    var allHeaderCsvFile = dataCsvFile[0];
    Logger.log("allHeaderCsvFile: " + allHeaderCsvFile);

    // (6) Xuất rawHeader, realHeaderUser chứa các field được user input
    var rawHeader = allFieldsFromSheet.rawHeader;
    var realHeaderUser = allFieldsFromSheet.realHeaderUser;

    // (7) Đối chiếu rawHeader, realHeaderUser ở (6) với allHeaderCsvFile (5) sau đó trả về các field cần xuất data
    var headerCsvArray = getHeaderCsvArr_5(allHeaderCsvFile,realHeaderUser).headerCsvArray
    Logger.log("headerCsvArray: " + headerCsvArray);
    Logger.log("getHeaderCsvArr_5.1 | Done");
    
    // (8) Xuất dữ liệu các field có data ở (7)
    const dataCsvOutput = dataCsvFile.map(r => headerCsvArray.map(i => r[i]));
    // Logger.log(dataCsvOutput);

    // (9) Liệt kê các header bị thiếu ở bước (7), (do FB chỉ trả lại các field có data, các field ko có data sẽ cần hiện thị 0)
    var missingHeaderArr = getHeaderCsvArr_5(allHeaderCsvFile,realHeaderUser).missingHeaderArr;
    Logger.log("missingHeaderArr: " + missingHeaderArr);
    Logger.log("getHeaderCsvArr_5.2 | Done");

    // (10) Cleaning dataCsv output, Tạo file data mới
    var dataAfterFillMissHeader = dataCsvOutput;
    
    // (11)Thêm những missing header vào tệp dataCsvOutput, vì file CSV chỉ trả về column có giá trị, nên không phải 100% reqest field đều có giá trị đc trả về nên sẽ thiếu metric header, vị trí thêm chính là giá trị của missingHeader, vd missingHeader=[9,12,28,29]
    for(i=0;i<missingHeaderArr.length;i++){
      dataAfterFillMissHeader[0].splice(missingHeaderArr[i],0,realHeaderUser[missingHeaderArr[i]]);
    }

    // (12) Thêm data = 0 vào những cột chứa missingHeader mà mình mới input ở dòng trên, tại vì đây là thêm mới vị trí nên phải tách lệnh ra, ko dùng chung cái dưới đc
    for(z=1;z<dataAfterFillMissHeader.length;z++){
      for(i=0;i<missingHeaderArr.length;i++){
        dataAfterFillMissHeader[z].splice(missingHeaderArr[i],0,0);
      }

      //Fill data=0 vào những ô chứa giá trị null hoặc undefinded ở những vị trí còn lại trong tệp data
      dataAfterFillMissHeader[z] = Array.from(dataAfterFillMissHeader[z], item => item === '' ? 0 : item); //fill undefined/null data equal 0
    }
    Logger.log(dataAfterFillMissHeader);

    // (13) In tệp data hoàn chỉnh bao gồm data từ file Csv facebook trả và data 0 mới thêm ra màn hình
    sheet.clear();

    var setStyleHeader = sheet.getRange(1,1,1,dataAfterFillMissHeader[0].length);
    setStyleHeader.setFontWeight("bold");

    var printFinalData = sheet.getRange(1, 1, dataAfterFillMissHeader.length, dataAfterFillMissHeader[0].length);
    printFinalData.setValues(dataAfterFillMissHeader);

    //(14) Print csv report link to sheet
    spreadsheet.getSheetByName("API Request Builder").getRange(5,8).setValue(csvFile.csvUrl)

    //(15) Print seccess messages to sheet
    SpreadsheetApp.getUi().alert(`Request done`);

  } catch (err){
    //Print Error messages to sheet
    SpreadsheetApp.getUi().alert(`⚠️ Something went wrong, access this link for further informations:\n\n${asynJob.facebookUrl}`);
  }

}

/*-----------------------------------------------------------
(1) TẠO FACEBOOK REQUEST URL VÀ RETURN reportId JOB
*/
function requestAsynJob_1(allFieldsFromSheet) {
  try{
    // Create facebook api url như bình thường với các fields được input
    var facebookUrlDefault = `https://graph.facebook.com/${allFieldsFromSheet.api_version}/act_${allFieldsFromSheet.adAccountID}/insights?access_token=${allFieldsFromSheet.api_token}&level=${allFieldsFromSheet.level_data}&fields=${allFieldsFromSheet.field_default},actions&breakdowns=${allFieldsFromSheet.breakdowns}&sort=date_start_ascending&time_increment=${allFieldsFromSheet.time_increment}&action_attribution_windows=${allFieldsFromSheet.attribution}&limit=${allFieldsFromSheet.limit}`;

    if(allFieldsFromSheet.date_start == "" & allFieldsFromSheet.date_preset != ""){
        var facebookUrl = facebookUrlDefault + `&date_preset=${allFieldsFromSheet.date_preset}`;
    } else {
        var facebookUrl =  facebookUrlDefault + `&time_range[since]=${allFieldsFromSheet.date_start}&time_range[until]=${allFieldsFromSheet.date_end}`;
    }
    if(allFieldsFromSheet.field_filter.length>4){
      if(allFieldsFromSheet.operator == "ALL" || allFieldsFromSheet.operator == "ANY" || allFieldsFromSheet.operator == "NONE"){
         var facebookUrl = facebookUrl + `&filtering=[{field:"${allFieldsFromSheet.field_filter}",operator:"${allFieldsFromSheet.operator}",value:[${allFieldsFromSheet.value_filter}]}]`;
      } else if (allFieldsFromSheet.operator == "GREATER_THAN" || allFieldsFromSheet.operator == "LESS_THAN"){
        var facebookUrl = facebookUrl + `&filtering=[{field:"${allFieldsFromSheet.field_filter}",operator:"${allFieldsFromSheet.operator}",value:${allFieldsFromSheet.value_filter}}]`;
      } else {
        var facebookUrl = facebookUrl + `&filtering=[{field:"${allFieldsFromSheet.field_filter}",operator:"${allFieldsFromSheet.operator}",value:"${allFieldsFromSheet.value_filter}"}]`;
      }

    }

    const encodedFacebookUrl = encodeURI(facebookUrl);
    Logger.log("facebookUrl: " + facebookUrl);

    const options = {
      'method' : 'post'
    };
    
    // Gửi yêu cầu xuất số (facebook server gọi là Job) lên Facebook server, Facebook server sẽ tiến hành fetch dữ liệu (fetch job) theo chuẩn Asynchronous Batch Requests
    const fetchRequest = UrlFetchApp.fetch(encodedFacebookUrl, options);
    const results_request = JSON.parse(fetchRequest.getContentText());
    //results_request: {report_run_id=330640222064020} - Trả về 1 object, nhưng cái job này nó chưa complete
    
    // Truy cập results_request để lấy report_run_id
    const reportId = results_request.report_run_id;
    Logger.log("reportId: " + reportId);


  //Sử dụng vòng loop While, kiểm tra Job completed hay chưa,nếu chưa thì chưa cho chạy tiếp cho tới khi Completed
    var jobIsCompleted = false;
    const runReportAdsUrl = `https://graph.facebook.com/${allFieldsFromSheet.api_version}/${reportId}?access_token=${allFieldsFromSheet.api_token}`;
      while (!jobIsCompleted) {
        const fetchRequest = UrlFetchApp.fetch(runReportAdsUrl);
        const runReportAds = JSON.parse(fetchRequest.getContentText());
          jobIsCompleted= runReportAds.async_status === 'Job Completed';

        if (runReportAds.async_status === 'Job Failed') {
        Logger.log(runReportAds.async_status);
        break
        }
      }
  //-----------Hết job
    Logger.log("requestAsynJob_1 | Done");
    return ({"reportId":reportId,"facebookUrl":facebookUrl});
    
  } catch (err){
    //Print Error messages to sheet
    SpreadsheetApp.getUi().alert(`⚠️ Something went wrong, access this link for further informations:\n\n${facebookUrl}`);
  }

}


/*-----------------------------------------------------------
(2) TẠO FILE REPORT CSV TỪ reportId, SAU ĐÓ PARSE CSV VÀO SHEET
*/
function getCsvfile_2(reportId,api_token){
  // Tạo link report dưới dạng file csv
  var csvUrl = `https://www.facebook.com/ads/ads_insights/export_report?report_run_id=${reportId}&name=report-${reportId}&format=csv&access_token=${api_token}&locale=en_US`;
  Logger.log(csvUrl)
  const fetchRequest = UrlFetchApp.fetch(csvUrl);
  const dataCsvFile = Utilities.parseCsv(fetchRequest);
  // Logger.log("dataCsvFile[0]: " + dataCsvFile[0]);

  return ({"dataCsvFile":dataCsvFile,"csvUrl":csvUrl});
}

/*-----------------------------------------------------------
(5) ĐỐI CHIẾU HEADER USER YÊU CẦU VÀ HEADER CSV, SAU ĐÓ XUẤT VỊ TRÍ CỦA CÁC HEADER CÓ DATA TRONG FILE CSV VÀ XUẤT NHỮNG RAWHEADER BỊ THIẾU DATA
*/
function getHeaderCsvArr_5(allHeaderCsvFile,realHeaderUser){
  var missingHeaderArr = [];
  var missingHeaderText = [];
  var headerCsvArray = [];
  var headerTrungTen = ["Reach", "Impressions","Content views", "Adds to cart", "Adds to wishlist", "Leads", "Purchases", "Searchs","Video plays", "App Installs","Platform"];

  realHeaderUser.forEach(getArr);   //Lấy từng giá trị trong array realHeaderUser đưa vào function getArr

  function getArr(value){
    //Tại vì thằng Reach và Impression... có tên bị trùng với "Cost per 1,000 People Reached" và "CPM (Cost per 1,000 Impressions)" nên phải tách nó ra và đối chiếu theo điều kiện == đối chiếu chính xác
    if(headerTrungTen.includes(value)){   //Nếu giá trị đang đối chiều (realHeaderUser) trùng với giá trị headerTrungTen thì
      var checktrue = false
      for(i=0;i<allHeaderCsvFile.length;i++){
        if(allHeaderCsvFile[i] == value){   //nếu giá trị của realHeaderUser trùng (so sánh bằng ==) với giá trị nào đó trong allHeaderCsv thì push giá trị [i] đó vào headerCsvArray
          headerCsvArray.push(i)
          checktrue = true
        }
      }
      if(checktrue == false){
        missingHeaderArr.push(realHeaderUser.indexOf(value))
        missingHeaderText.push(value)
      }
    } else {
      //Những Header không trùng còn lại có thể đối chiếu theo function array.includes()
      var checktrue = false
      for(i=0;i<allHeaderCsvFile.length;i++){
        if(allHeaderCsvFile[i].includes(value) == true){
          headerCsvArray.push(i)
          checktrue = true
        }
      }
      if(checktrue == false){
        missingHeaderArr.push(realHeaderUser.indexOf(value))
        missingHeaderText.push(value)
      }
    }
  }

  Logger.log("missingHeaderText: "+missingHeaderText)

  return ({headerCsvArray: headerCsvArray,missingHeaderArr: missingHeaderArr})
}

/*-----------------------------------------------------------
FUNCTION PHỤ TRONG FUNC_5 ĐỂ ĐỐI CHIẾU GIÁ TRỊ
*/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  .getContent();
}



