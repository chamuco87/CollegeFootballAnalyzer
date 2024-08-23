var {Options} = require('selenium-webdriver/chrome')
const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
var fs = require('fs');
const { is } = require('express/lib/request');
const { generateKey } = require('crypto');
const { Console } = require('console');



(async function example() {
    var baseUrl = "https://www.sports-reference.com";
    var exceptions = [];
    try{exceptions = await load("exceptions", "BaseData");} catch{}
    let driver =await new Builder()
          .withCapabilities(
              Options.chrome()
               //.setPageLoadStrategy('eager')
               .setPageLoadStrategy('none')
          ).build()

          try {
            //await getTableData("/cfb/years/" ,"years", "BaseData");
            //await getConferencesPerYear();
            //await getConferencesPerYearDetails();
            //await getSchoolPerYearDetails();
            //await getSchedulePerYearDetails();
            await getGamesPerYearDetails();


          } 
          catch(Ex){
              console.log(Ex);
              await driver.quit();
              await example();
          } finally {
              //await driver.quit();
              //await example();
          }

            async function getTableData(url ,fileName, foldername)
            {
                try{
                    var tableUrl = baseUrl + url;
                    var data = [];
                    //await driver.manage().setTimeouts({ explicit: 3000 });
                    
                    await driver.manage().setTimeouts({ implicit: 200 });
                    await driver.get(tableUrl);
                    // await driver.wait(until.elementLocated(By.id(tables[tables.length-1])), // Condition to wait for
                    //     3000 // Timeout in milliseconds (10 seconds)
                    // );
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    let tables = await driver.findElements(By.className('stats_table'));
                    if(tables.length != 0){
                        for (let ay = 0; ay < tables.length; ay++) {
                            //const tableId = tables[ay];
                            let table = tables[ay];
                            let tableId = await table.getAttribute('id');
                            if(tableId){
                                await driver.executeScript(await JSgetTableDetails(tableId)).then(function(return_value) {
                                    console.log(return_value);
                                    data = JSON.parse(return_value);
                                });  
                                var name = fileName != tableId ? fileName+"_"+tableId : fileName;
                                await save(name, data,function(){}, "replace", foldername);
                            }
                            else{
                                await driver.executeScript(await JSgetResultDetails(tableId)).then(function(return_value) {
                                    console.log(return_value);
                                    data = JSON.parse(return_value);
                                });  
                                var name = fileName != tableId ? fileName+"_results" : fileName;
                                await save(name, data,function(){}, "replace", foldername);
                            }
                        }
                        return 1;
                    }
                    else{
                        throw new Error("Check");
                    }
                }
                catch(Ex){
                    try{
                        const searchText = "We do not have stats for this school at this time";
                        let paragraph = await driver.findElement(By.xpath(`//p[contains(text(), "${searchText}")]`));
                        if (paragraph) {
                            exceptions.push(url);
                            await save("exceptions", exceptions, function(){}, "replace", "BaseData");
                        }
                    }
                    catch{}
                    const searchText2 = "We apologize, but we could not find the page requested by your device";
                    let paragraph2 = await driver.findElement(By.xpath(`//p[contains(text(), "${searchText2}")]`));
                    if (paragraph2) {
                        exceptions.push(url);
                        await save("exceptions", exceptions, function(){}, "replace", "BaseData");
                    }
                    console.log("Table doesn't exits.");
                    return 1;
                }
            }

            async function getConferencesPerYear()
            {
                var years = await load("years", "BaseData");

                for (let index = 0; index < years.length; index++) {
                    const year = years[index];
                    var isLoaded = false;
                    try{
                        isLoaded = await load("conferences",year.year_id) ? true : false;
                    }
                    catch{
                        var isYear = parseInt(year.year_id);
                        if(!isLoaded && !isNaN(isYear)){
                            await getTableData(year.year_idLink , "conferences", year.year_id);
                        }
                    }
                }
            }

            async function getConferencesPerYearDetails()
            {
                var years = await load("years", "BaseData");
                var processing = 0;
                for (let index = 0; index < years.length; index++) {
                    const year = years[index];
                    var tables = ["standings", "bowls", "all_awards"];
                    var conferences = [];
                    
                        var isYear = parseInt(year.year_id);
                        if(!isNaN(isYear) && isYear != 2024){
                            conferences = await load("conferences", year.year_id);
                            if(conferences.length > 0){
                                for (let rt = 0; rt < conferences.length; rt++) {
                                    const conference = conferences[rt];
                                    var isProcessed = false;
                                    var conf_name = conference.conf_name.replace(" ","_");
                                    try{
                                        isProcessed = await load(conf_name + "_standings", year.year_id+"/"+"Conferences" ) ? true : false;
                                    }
                                    catch(Ex){
                                        if(!isProcessed){
                                            await getTableData(conference.conf_nameLink , conf_name, year.year_id+"/"+"Conferences");
                                            processing++;
                                            if(processing == 5)
                                            {
                                                throw new Error("Restart");
                                            }
                                        }
                                    }
                                    
                                }
                                
                            }
                        }
                    
                    
                    
                }
            }

        
            async function getSchoolPerYearDetails()
            {
                var years = await load("years", "BaseData");
                var processing = 0;
                for (let index = 0; index < years.length; index++) {
                    const year = years[index];
                    var tables = ["team", "passing", "rushing_and_receiving", "defense_and_fumbles", "returns", "kicking_and_punting", "scoring"];
                    var conferences = [];
                    
                        var isYear = parseInt(year.year_id);
                        if(!isNaN(isYear) && isYear != 2024){ //&& isYear != 2020 && isYear != 2004 && isYear != 2000 && isYear != 1987 && isYear != 1989 && isYear != 1985 && isYear != 1984 && isYear != 1983){
                            conferences = await load("conferences", year.year_id);
                            if(conferences.length > 0){
                                for (let rt = 0; rt < conferences.length; rt++) {
                                    const conference = conferences[rt];
                                    var conf_name = conference.conf_name.replace(" ","_");
                                    var toBeProcessed = [];
                                    try{
                                        toBeProcessed = await load(conf_name + "_standings", year.year_id+"/"+"Conferences");
                                    }
                                    catch(Ex){
                                        
                                    }
                                    
                                    if(toBeProcessed.length > 0)
                                    {
                                        for (let rat = 0; rat < toBeProcessed.length; rat++) {
                                            const school = toBeProcessed[rat];
                                            var school_name = school.school_name.replace(" ","_");
                                            var isProcessed = false;
                                            try{
                                                isProcessed = await load(school_name + "_scoring", year.year_id+"/"+"Conferences"+"/"+school_name ) ? true : false;
                                            }
                                            catch(Ex){
                                                var isException = exceptions.filter(function(item){return item == school.school_nameLink });
                                                if(!isProcessed && school.school_nameLink && isException.length == 0){
                                                    processing = processing + await getTableData(school.school_nameLink , school_name, year.year_id+"/"+"Conferences"+"/"+school_name);
                                                    if(processing == 1)
                                                    {
                                                        throw new Error("Restart");
                                                    }
                                                }
                                            }
                                            
                                        }
                                    }
                                }
                                
                            }
                        }
                    
                    
                    
                }
            }

            async function getSchedulePerYearDetails()
            {
                var years = await load("years", "BaseData");
                var processing = 0;
                for (let index = 0; index < years.length; index++) {
                    const year = years[index];
                    var tables = ["polls", "schedule"];
                    var conferences = [];
                    
                        var isYear = parseInt(year.year_id);
                        if(!isNaN(isYear) && isYear == 2024){ //&& isYear != 2020 && isYear != 2004 && isYear != 2000 && isYear != 1987 && isYear != 1989 && isYear != 1985 && isYear != 1984 && isYear != 1983){
                            conferences = await load("conferences", year.year_id);
                            if(conferences.length > 0){
                                for (let rt = 0; rt < conferences.length; rt++) {
                                    const conference = conferences[rt];
                                    var conf_name = conference.conf_name.replace(" ","_");
                                    var toBeProcessed = [];
                                    try{
                                        toBeProcessed = await load(conf_name + "_standings", year.year_id+"/"+"Conferences");
                                    }
                                    catch(Ex){
                                        
                                    }
                                    
                                    if(toBeProcessed.length > 0)
                                    {
                                        for (let rat = 0; rat < toBeProcessed.length; rat++) {
                                            const school = toBeProcessed[rat];
                                            var school_name = school.school_name.replace(" ","_");
                                            var isProcessed = false;
                                            try{
                                                isProcessed = await load(school_name + "_schedule", year.year_id+"/"+"Conferences"+"/"+school_name ) ? true : false;
                                            }
                                            catch(Ex){
                                                if(school.school_nameLink){
                                                    var scheduleUrl = school.school_nameLink.replace(".html","-schedule.html");
                                                    var isException = exceptions.filter(function(item){return item == scheduleUrl });
                                                    if(!isProcessed && school.school_nameLink && isException.length == 0){
                                                        processing = processing + await getTableData(scheduleUrl , school_name, year.year_id+"/"+"Conferences"+"/"+school_name);
                                                        if(processing == 1)
                                                        {
                                                            throw new Error("Restart");
                                                        }
                                                    }
                                                }
                                            }
                                            
                                        }
                                    }
                                }
                                
                            }
                        }
                    
                    
                    
                }
            }

            async function getGamesPerYearDetails()
            {
                var years = await load("years", "BaseData");
                var processing = 0;
                for (let index = 0; index < years.length; index++) {
                    const year = years[index];
                    var tables = ["polls", "schedule"];
                    var conferences = [];
                    
                        var isYear = parseInt(year.year_id);
                        if(!isNaN(isYear) && isYear != 2024){ //&& isYear != 2020 && isYear != 2004 && isYear != 2000 && isYear != 1987 && isYear != 1989 && isYear != 1985 && isYear != 1984 && isYear != 1983){
                            conferences = await load("conferences", year.year_id);
                            if(conferences.length > 0){
                                for (let rt = 0; rt < conferences.length; rt++) {
                                    const conference = conferences[rt];
                                    var conf_name = conference.conf_name.replace(" ","_");
                                    var toBeProcessed = [];
                                    try{
                                        toBeProcessed = await load(conf_name + "_standings", year.year_id+"/"+"Conferences");
                                    }
                                    catch(Ex){
                                        
                                    }
                                    
                                    if(toBeProcessed.length > 0)
                                    {
                                        for (let rat = 0; rat < toBeProcessed.length; rat++) {
                                            const school = toBeProcessed[rat];
                                            var school_name = school.school_name.replace(" ","_");
                                            var schedules = []
                                            try{
                                                schedules = await load(school_name + "_schedule", year.year_id+"/"+"Conferences"+"/"+school_name );
                                            }
                                            catch(Ex){
                                        
                                            }
                                            
                                            if(schedules.length > 0){
                                                for (let rat = 0; rat < schedules.length; rat++) {
                                                    const schedule = schedules[rat];
                                                    var schedule_name = schedule.date_game.replace(" ","_").replace(" ","_").replace(",","");
                                                    var isProcessed = false;
                                                    try{
                                                        isProcessed = await load(schedule_name + "_scoring", year.year_id+"/"+"Conferences"+"/"+school_name +"/Games") ? true : false;
                                                    }
                                                    catch(Ex){
                                                        if(schedule.date_gameLink){
                                                            var isException = exceptions.filter(function(item){return item == schedule.date_gameLink });
                                                            if(!isProcessed && schedule.date_gameLink && isException.length == 0){
                                                                processing = processing + await getTableData(schedule.date_gameLink , schedule_name, year.year_id+"/"+"Conferences"+"/"+school_name+"/Games");
                                                                if(processing == 1)
                                                                {
                                                                    throw new Error("Restart");
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                }
                                            }
                                            
                                        }
                                    }
                                }
                                
                            }
                        }
                    
                    
                    
                }
            }

             async function load(filename, foldername = null)
            {
                if(foldername)
                {
                    const data = fs.readFileSync("./"+foldername+"/"+filename+".json");
                    return JSON.parse(data);
                }
                else{
                    var folder = "";
                        if(filename.indexOf("th") >= 0)
                        {
                            folder = filename.split("th")[0]+"th";
                        }
                        else if(filename.indexOf("rd") >= 0){
                            folder = filename.split("rd")[0]+"rd";
                        }
                        else if(filename.indexOf("nd") >= 0){
                            folder = filename.split("nd")[0]+"nd";
                        }
                        else if(filename.indexOf("st") >= 0){
                            folder = filename.split("st")[0]+"st";
                            if(filename.indexOf("August1st") >= 0)
                            {
                                folder = filename.split("1st")[0]+"1st";
                            }
                            else if(filename.indexOf("August21st") >= 0)
                            {
                                folder = filename.split("21st")[0]+"21st";
                            }
                            else if(filename.indexOf("August31st") >= 0)
                            {
                                folder = filename.split("31st")[0]+"31st";
                            }
                        }
                    const data = fs.readFileSync("./"+filename.split(/[0-9]/)[0]+"/"+folder+"/"+filename+".json");
                    return JSON.parse(data);
                }

            }


            async function save(fileName, jsonObject, callback, appendOrReplace, foldername = null)
            {
                if(foldername)
                {
                    if(appendOrReplace == "replace")
                    {
                        var dir = "./"+foldername+"/";
                        if (!fs.existsSync(dir)){
                            fs.mkdirSync(dir, { recursive: true });
                        }  
                        fs.writeFileSync(dir+fileName + '.json', JSON.stringify(jsonObject) , 'utf8', callback);
                    }
                }
                else{
                    if(appendOrReplace == "replace")
                    {
                        var folder = "";
                        if(fileName.indexOf("th") >= 0)
                        {
                            folder = fileName.split("th")[0]+"th";
                        }
                        else if(fileName.indexOf("rd") >= 0){
                            folder = fileName.split("rd")[0]+"rd";
                        }
                        else if(fileName.indexOf("nd") >= 0){
                            folder = fileName.split("nd")[0]+"nd";
                        }
                        else if(fileName.indexOf("st") >= 0){
                            folder = fileName.split("st")[0]+"st";
                            if(fileName.indexOf("August1st") >= 0)
                            {
                                folder = fileName.split("1st")[0]+"1st";
                            }
                            else if(fileName.indexOf("August21st") >= 0)
                            {
                                folder = fileName.split("21st")[0]+"21st";
                            }
                            else if(fileName.indexOf("August31st") >= 0)
                            {
                                folder = fileName.split("31st")[0]+"31st";
                            }
                        }

                        var dir = "./"+fileName.split(/[0-9]/)[0]+"/"+folder+"/";
                        if (!fs.existsSync(dir)){
                            fs.mkdirSync(dir, { recursive: true });
                        }  

                        fs.writeFileSync(dir+fileName + '.json', JSON.stringify(jsonObject) , 'utf8', callback);
                    }
                }
            }

})();


async function JSgetResultDetails(){
    var script =  "var resultTable = document.getElementsByClassName('linescore nohover stats_table no_freeze')[0].getElementsByTagName('td');";
    script +=  "var result = {'home': {'team': resultTable[1].innerText, 'Q1':resultTable[2].innerText,'Q2':resultTable[3].innerText,'Q3':resultTable[4].innerText,'Q4':resultTable[5].innerText,'Final':resultTable[6].innerText}, 'away': {'team': resultTable[8].innerText, 'Q1':resultTable[9].innerText,'Q2':resultTable[10].innerText,'Q3':resultTable[11].innerText,'Q4':resultTable[12].innerText,'Final':resultTable[13].innerText} };";
    script +=  "return JSON.stringify(result);";
    return script;

}

async function JSgetTableDetails(tableId){
    var script =  "var data = document.getElementById('"+tableId+"').querySelectorAll('[data-row]');";
    script +=  "if(data.length == 0) { data = document.getElementById('"+tableId+"').getElementsByTagName('tr');}";
    script +=  "var allData = [];";
    script +=  "for (let index = 0; index < data.length; index++) {";
    script +=  "	let dataStatValues = new Set();";
    script +=  "    const dataRow = data[index];";
    script +=  "	dataRow.querySelectorAll('[data-stat]').forEach(child => {";
    script +=  "    let dataStat = child.getAttribute('data-stat');";
    script +=  "    if (dataStat) {";
    script +=  "        dataStatValues.add(dataStat);		";
    script +=  "    }";
    script +=  "	});";
    script +=  "	let uniqueDataStatArray = Array.from(dataStatValues);";
    script +=  "	allData.push(await GetDataPointsFromTable(uniqueDataStatArray, dataRow));";
    script +=  "}";
    script +=  "return JSON.stringify(allData);";
    script +=  "async function GetDataPointsFromTable(uniqueDataStatArray, dataRow)";
    script +=  "{";
    script +=  "	var dataPoint = {};";
    script +=  "	for (let sd = 0; sd < uniqueDataStatArray.length; sd++) {";
    script +=  "		var dataDetail = dataRow.querySelector('[data-stat=\"'+uniqueDataStatArray[sd]+'\"]');";
    script +=  "		if(dataDetail)";
    script +=  "		{";
    script +=  "			dataPoint[uniqueDataStatArray[sd]] = dataDetail.innerText;";
    script +=  "			if(dataDetail.querySelector('a'))";
    script +=  "			{";
    script +=  "				dataPoint[uniqueDataStatArray[sd]+'Link'] = dataDetail.querySelector('a').getAttribute('href');";
    script +=  "			}";
    script +=  "		}";
    script +=  "	}";
    script +=  "	return dataPoint;";
    script +=  "}";
    console.log(script);
    return script;

}