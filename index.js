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
            //await getGamesPerYearDetails();

            var years = [2017];//[2023, 2022, 2021, 2020];
            for (let index = 0; index < years.length; index++) {
                const yearTo = years[index];
                await prepareData(yearTo);
                await formatGamesPerTeam(yearTo);
                await generateAverages(yearTo);
            }

            var years = [2022, 2021, 2020, 2019, 2018, 2017];
            for (let index = 0; index < years.length; index++) {
                const yearTo = years[index];
                var toBeEvaluated = false;
                await generateMLRecords(yearTo, toBeEvaluated);
            }

            // var years = [2023];
            // for (let index = 0; index < years.length; index++) {
            //     const yearTo = years[index];
            //     var toBeEvaluated = true;
            //     await generateMLRecords(yearTo, toBeEvaluated);
            // }
            


          } 
          catch(Ex){
              console.log(Ex);
              await driver.quit();
              await example();
          } finally {
              //await driver.quit();
              //await example();
          }

          function isWithin8Days(date1, date2) {
            // Convert the date strings to Date objects
            let d1 = new Date(date1.replace(/_/g, ' '));
            let d2 = new Date(date2.replace(/_/g, ' '));
        
            // Calculate the difference in time (in milliseconds)
            let timeDifference = Math.abs(d2 - d1);
        
            // Convert time difference from milliseconds to days
            let dayDifference = timeDifference / (1000 * 60 * 60 * 24);
        
            // Return true if the difference is 8 days or less, false otherwise
            return dayDifference <= 8;
        }

          function sortByDate(arr) {
            return arr.sort((a, b) => {
                // Convert the date strings to Date objects
                let dateA = new Date(a.date.replace(/_/g, ' '));
                let dateB = new Date(b.date.replace(/_/g, ' '));
        
                // Compare the two dates
                return dateA - dateB;
            });
        }
        function appendProperties(finalObject, originalObject, prefix) {
            for (let key in originalObject) {
                if (originalObject.hasOwnProperty(key)) {
                    // Check if the key starts with "def" or "offense"
                    if (key.startsWith("def") || key.startsWith("offense")) {
                        // Create a new key with the prefix
                        let newKey = prefix + key.charAt(0).toUpperCase() + key.slice(1);
                        // Add the new key to finalObject with the original value
                        finalObject[newKey] = originalObject[key];
                    }
                }
            }
            return finalObject;
        }

        async function generateMLRecords(yearToProcess, toBeEvaluated)
        {
            try{
                if(!toBeEvaluated){
                    var MLData = await load("MLData", "AnalysisData");
                }
                else{
                    var MLData = await load("MLDataToEvaluate", "AnalysisData");
                }
            }
            catch{
                var MLData = [];
            }
            var years = await load("years", "BaseData");
            var processing = 0;
            for (let index = 0; index < years.length; index++) {
                const year = years[index];
                var tables = ["polls", "schedule"];
                var conferences = [];
                
                    var isYear = parseInt(year.year_id);
                    if(!isNaN(isYear) && isYear == yearToProcess){ //&& isYear != 2020 && isYear != 2004 && isYear != 2000 && isYear != 1987 && isYear != 1989 && isYear != 1985 && isYear != 1984 && isYear != 1983){
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
                                            for (let rat = (schedules.length-1); rat >= 0; rat--) {
                                                const schedule = schedules[rat];
                                                var schedule_name = schedule.date_game.replace(" ","_").replace(" ","_").replace(",","");
                                                var gameRecords = [];
                                                var gameResults = [];
                                                var averageRecords = [];
                                                try{
                                                    gameRecords = await load("gameRecords","AnalysisData/" + year.year_id);
                                                    gameResults = await load("formatedRecords","AnalysisData/" + year.year_id);
                                                    averageRecords = await load("averageRecords","AnalysisData/" + year.year_id);

                                                    var gameRecord = gameRecords.filter(function(item){return (item.homeTeam == school_name || item.awayTeam == school_name) && item.date == schedule_name});
                                                    var opponentName = gameRecord[0].homeTeam == school_name ? gameRecord[0].awayTeam : gameRecord[0].homeTeam;
                                                    var selectedAverage = averageRecords.filter(function(item){return item.team == school_name && item.date == schedule_name});
                                                    var opponentAverage = averageRecords.filter(function(item){return item.team == opponentName && item.date == schedule_name});
                                                    var selectedGameResults = gameResults.filter(function(item){return item.team == school_name});
                                                    var selectedIndex = selectedGameResults.findIndex(x =>x.date == schedule_name);
                                                    if(selectedIndex > 0)
                                                    {
                                                        var selectedGameResult = selectedGameResults[selectedIndex-1];
                                                    }
                                                    else{

                                                        //TO DO: Check for previous year data
                                                        var selectedGameResult = null;
                                                        var stopHere = "";
                                                    }
                                                    var opponentGameResults = gameResults.filter(function(item){return item.team == opponentName});
                                                    var opponentIndex = opponentGameResults.findIndex(x =>x.date == schedule_name);
                                                    if(opponentIndex > 0)
                                                    {
                                                        var opponentGameResult = opponentGameResults[opponentIndex-1];
                                                    }
                                                    else{
                                                        //TO DO: Check for previous year data
                                                        var opponentGameResult = null;
                                                        var stopHere = "";
                                                    }

                                                    
                                                if(gameRecord.length > 0 && selectedAverage.length > 0 && selectedGameResult && opponentAverage.length > 0 && opponentGameResult)
                                                {
                                                    var MLRecord = {};
                                                    MLRecord.key = gameRecord[0].key;
                                                    MLRecord.date = gameRecord[0].date;
                                                    if(!toBeEvaluated){
                                                        MLRecord.isHomeWinner = gameRecord[0].isHomeWinner;
                                                        MLRecord.scoreDiff = gameRecord[0].scoreDiff;
                                                    }
                                                    else{
                                                        MLRecord.isHomeWinner = 0;
                                                        MLRecord.scoreDiff = 0;
                                                    }
                                                    MLRecord.homeTeam = gameRecord[0].homeTeam;
                                                    MLRecord.awayTeam = gameRecord[0].awayTeam;
                                                    var homeRecords = gameRecord[0].homeTeam == selectedGameResult.team ? selectedGameResult : opponentGameResult;
                                                    MLRecord = appendProperties(MLRecord, homeRecords, "home");
                                                    var awayRecords = gameRecord[0].awayTeam == opponentGameResult.team ? opponentGameResult : selectedGameResult;
                                                    MLRecord = appendProperties(MLRecord, awayRecords, "away");
                                                    var homeAverageRecords = gameRecord[0].homeTeam == selectedAverage[0].team ? selectedAverage[0] : opponentAverage[0];
                                                    MLRecord = appendProperties(MLRecord, homeAverageRecords, "homeAvg");
                                                    var awayAverageRecords = gameRecord[0].awayTeam == opponentAverage[0].team ? opponentAverage[0] : selectedAverage[0];
                                                    MLRecord = appendProperties(MLRecord, awayAverageRecords, "awayAvg");
                                                    var stopHere = ""
                                                    var isThere = MLData.filter(function(item){return item.key == MLRecord.key });
                                                    if(isThere.length == 0){
                                                        MLData.push(MLRecord);
                                                        if(!toBeEvaluated){
                                                            await save("MLData",MLData, function(){}, "replace" ,"AnalysisData");
                                                        }
                                                        else{
                                                            await save("MLDataToEvaluate",MLData, function(){}, "replace" ,"AnalysisData");
                                                        }
                                                    }
                                                }
                                                }
                                                catch(Ex){
                                                    
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

        async function generateAverages(yearToProcess)
        {
          var data = await load("formatedRecords","AnalysisData/"+yearToProcess);
          try{
              var averageRecords = await load("averageRecords","AnalysisData/"+yearToProcess);
          }
          catch{
              var averageRecords = [];
          }
          var teams = data.map(function(item){
              return item.team;
          });
          var uniqueValues = Array.from(new Set(teams));
          for (let index = 0; index < uniqueValues.length; index++) {
              const team = uniqueValues[index];
              var games = data.filter(function(item){
                  return item.team == team;
              });
              var sortedGames = sortByDate(games);
              var averageGames = calculateAverages(sortedGames);
              averageRecords = averageRecords.concat(averageGames);
              await save("averageRecords",averageRecords, function(){}, "replace" ,"AnalysisData/"+yearToProcess);
          }
          
        }

        function calculateAverages(data) {
            let result = [];
        
            for (let i = 0; i < data.length; i++) {
                let current = data[i];
                let newObject = {};
        
                if (i === 0) {
                    // For the first object, set all numeric values to 0
                    for (let key in current) {
                        if (typeof current[key] === 'number') {
                            newObject[key] = 0;
                        } else {
                            newObject[key] = current[key];
                        }
                    }
                } else {
                    // For subsequent objects, calculate the averages based on previous objects
                    for (let key in current) {
                        if (typeof current[key] === 'number') {
                            let sum = 0;
                            for (let j = 0; j < i; j++) {
                                sum += data[j][key];
                            }
                            newObject[key] = Math.round(sum / i);
                        } else {
                            newObject[key] = current[key];
                        }
                    }
                }
        
                result.push(newObject);
            }
        
            return result;
        }
        


          async function formatGamesPerTeam(yearToProcess)
          {
            var data = await load("gameRecords","AnalysisData/"+yearToProcess);
            try{
                var formatedRecords = await load("formatedRecords","AnalysisData/"+yearToProcess);
            }
            catch{
                var formatedRecords = [];
            }
            var teams = data.map(function(item){
                return item.homeTeam;
            });
            var uniqueValues = Array.from(new Set(teams));
            for (let index = 0; index < uniqueValues.length; index++) {
                const team = uniqueValues[index];
                var games = data.filter(function(item){
                    return item.homeTeam == team || item.awayTeam == team;
                });
                var sortedGames = sortByDate(games);
                var week = 0
                for (let i = 0; i < sortedGames.length; i++) {
                    const game = sortedGames[i];
                    var teamRecord = {};
                    teamRecord.team = team;
                    teamRecord.date = game.date;
                    teamRecord.key = team + "_" + game.date;
                    var isOffense = game.homeTeam == team ? "home" : "away";
                    var transformmedRecords = transformPropertyNames(game, isOffense);
                    teamRecord.defAllowedPoints = transformmedRecords.defenseFinalScore == null || isNaN(transformmedRecords.defenseFinalScore) ? 0 : transformmedRecords.defenseFinalScore;
                    teamRecord.defAllowedFirstDowns = transformmedRecords.defenseFirstDowns == null || isNaN(transformmedRecords.defenseFirstDowns) ? 0 : transformmedRecords.defenseFirstDowns;
                    teamRecord.defCreatedFumbles = transformmedRecords.defenseFumbles == null || isNaN(transformmedRecords.defenseFumbles) ? 0 : transformmedRecords.defenseFumbles;
                    teamRecord.defInterceptions = transformmedRecords.defenseLost == null || isNaN(transformmedRecords.defenseLost) ? 0 : transformmedRecords.defenseLost;
                    teamRecord.defAllowedPassAttemps = transformmedRecords.defensePassAtts == null || isNaN(transformmedRecords.defensePassAtts) ? 0 : transformmedRecords.defensePassAtts;
                    teamRecord.defAllowedPassCpm = transformmedRecords.defensePassCmp == null || isNaN(transformmedRecords.defensePassCmp) ? 0 : transformmedRecords.defensePassCmp;
                    teamRecord.defAllowedPassTD = transformmedRecords.defensepassTd == null || isNaN(transformmedRecords.defensepassTd) ? 0 : transformmedRecords.defensepassTd;
                    teamRecord.defAllowedPassYD = transformmedRecords.defensePassYds == null || isNaN(transformmedRecords.defensePassYds) ? 0 : transformmedRecords.defensePassYds;
                    teamRecord.defCreatedPenalties = transformmedRecords.defensePenalties == null || isNaN(transformmedRecords.defensePenalties) ? 0 : transformmedRecords.defensePenalties;
                    teamRecord.defCreatedPenaltiesYDs = transformmedRecords.defensePenaltiesYards == null || isNaN(transformmedRecords.defensePenaltiesYards) ? 0 : transformmedRecords.defensePenaltiesYards;

                    teamRecord.defAllowedPointsQ1 = transformmedRecords.defenseQ1 == null || isNaN(transformmedRecords.defenseQ1) ? 0 : transformmedRecords.defenseQ1;
                    teamRecord.defAllowedPointsQ2 = transformmedRecords.defenseQ2 == null || isNaN(transformmedRecords.defenseQ2) ? 0 : transformmedRecords.defenseQ2;
                    teamRecord.defAllowedPointsQ3 = transformmedRecords.defenseQ3 == null || isNaN(transformmedRecords.defenseQ3) ? 0 : transformmedRecords.defenseQ3;
                    teamRecord.defAllowedPointsQ4 = transformmedRecords.defenseQ4 == null || isNaN(transformmedRecords.defenseQ4) ? 0 : transformmedRecords.defenseQ4;
                    teamRecord.defAllowedRushAttemps = transformmedRecords.defenseRushAtts == null || isNaN(transformmedRecords.defenseRushAtts) ? 0 : transformmedRecords.defenseRushAtts;
                    teamRecord.defAllowedRushTD = transformmedRecords.defenseRushTd == null || isNaN(transformmedRecords.defenseRushTd) ? 0 : transformmedRecords.defenseRushTd;
                    teamRecord.defAllowedRushYD = transformmedRecords.defenseRushYds == null || isNaN(transformmedRecords.defenseRushYds) ? 0 : transformmedRecords.defenseRushYds;
                    teamRecord.defAllowedTotalYD = transformmedRecords.defenseTotalYards == null || isNaN(transformmedRecords.defenseTotalYards) ? 0 : transformmedRecords.defenseTotalYards;
                    teamRecord.defTurnovers = transformmedRecords.defenseTurnovers == null || isNaN(transformmedRecords.defenseTurnovers) ? 0 : transformmedRecords.defenseTurnovers;

                    teamRecord.offensePoints = transformmedRecords.offenseFinalScore == null || isNaN(transformmedRecords.offenseFinalScore) ? 0 : transformmedRecords.offenseFinalScore;
                    teamRecord.offenseFirstDowns = transformmedRecords.offenseFirstDowns == null || isNaN(transformmedRecords.offenseFirstDowns) ? 0 : transformmedRecords.offenseFirstDowns;
                    teamRecord.offenseCreatedFumbles = transformmedRecords.offenseFumbles == null || isNaN(transformmedRecords.offenseFumbles) ? 0 : transformmedRecords.offenseFumbles;
                    teamRecord.offenseInterceptions = transformmedRecords.offenseLost == null || isNaN(transformmedRecords.offenseLost) ? 0 : transformmedRecords.offenseLost;
                    teamRecord.offensePassAttemps = transformmedRecords.offensePassAtts == null || isNaN(transformmedRecords.offensePassAtts) ? 0 : transformmedRecords.offensePassAtts;
                    teamRecord.offensePassCpm = transformmedRecords.offensePassCmp == null || isNaN(transformmedRecords.offensePassCmp) ? 0 : transformmedRecords.offensePassCmp;
                    teamRecord.offensePassTD = transformmedRecords.offensepassTd == null || isNaN(transformmedRecords.offensepassTd) ? 0 : transformmedRecords.offensepassTd;
                    teamRecord.offensePassYD = transformmedRecords.offensePassYds == null || isNaN(transformmedRecords.offensePassYds) ? 0 : transformmedRecords.offensePassYds;
                    teamRecord.offenseCreatedPenalties = transformmedRecords.offensePenalties == null || isNaN(transformmedRecords.defenseQ1) ? 0 : transformmedRecords.offensePenalties;
                    teamRecord.offenseCreatedPenaltiesYDs = transformmedRecords.offensePenaltiesYards == null || isNaN(transformmedRecords.defenseQ1) ? 0 : transformmedRecords.offensePenaltiesYards;
                    teamRecord.offensePointsQ1 = transformmedRecords.offenseQ1 == null || isNaN(transformmedRecords.offenseQ1)  ? 0 : transformmedRecords.offenseQ1;
                    teamRecord.offensePointsQ2 = transformmedRecords.offenseQ2 == null || isNaN(transformmedRecords.offenseQ2)  ? 0 : transformmedRecords.offenseQ2;
                    teamRecord.offensePointsQ3 = transformmedRecords.offenseQ3 == null || isNaN(transformmedRecords.offenseQ3)  ? 0 : transformmedRecords.offenseQ3;
                    teamRecord.offensePointsQ4 = transformmedRecords.offenseQ4 == null || isNaN(transformmedRecords.offenseQ4)  ? 0 : transformmedRecords.offenseQ4;
                    teamRecord.offenseRushAttemps = transformmedRecords.offenseRushAtts == null || isNaN(transformmedRecords.offenseRushAtts) ? 0 : transformmedRecords.offenseRushAtts;
                    teamRecord.offenseRushTD = transformmedRecords.offenseRushTd == null || isNaN(transformmedRecords.offenseRushTd) ? 0 : transformmedRecords.offenseRushTd;
                    teamRecord.offenseRushYD = transformmedRecords.offenseRushYds == null || isNaN(transformmedRecords.offenseRushYds) ? 0 : transformmedRecords.offenseRushYds;
                    teamRecord.offenseTotalYD = transformmedRecords.offenseTotalYards == null || isNaN(transformmedRecords.offenseTotalYards) ? 0 : transformmedRecords.offenseTotalYards;
                    teamRecord.offenseTurnovers = transformmedRecords.offenseTurnovers == null || isNaN(transformmedRecords.offenseTurnovers) ? 0 : transformmedRecords.offenseTurnovers;
                    formatedRecords.push(teamRecord);
                    await save("formatedRecords",formatedRecords, function(){}, "replace" ,"AnalysisData/"+yearToProcess);
                    var stopHere = "";
                }
                var stopHere = "";
            }
            
          }

          function transformPropertyNames(obj, isOffense) {
            let transformedObj = {};
        
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let newKey = key;
        
                    // Replace "home" with "offense"
                    if(isOffense == "home"){
                        if (key.includes("home")) {
                            newKey = key.replace("home", "offense");
                        }
            
                        // Replace "away" with "defense"
                        if (key.includes("away")) {
                            newKey = key.replace("away", "defense");
                        }
                    }
                    else{
                        if (key.includes("home")) {
                            newKey = key.replace("home", "defense");
                        }
            
                        // Replace "away" with "defense"
                        if (key.includes("away")) {
                            newKey = key.replace("away", "offense");
                        }
                    }
        
                    // Add the transformed key and its value to the new object
                    transformedObj[newKey] = obj[key];
                }
            }
        
            return transformedObj;
        }

            async function prepareData(yearToProcess)
            {
                var years = await load("years", "BaseData");
                var processing = 0;
                for (let index = 0; index < years.length; index++) {
                    const year = years[index];
                    var tables = ["polls", "schedule"];
                    var conferences = [];
                    
                        var isYear = parseInt(year.year_id);
                        if(!isNaN(isYear) && isYear == yearToProcess){ //&& isYear != 2020 && isYear != 2004 && isYear != 2000 && isYear != 1987 && isYear != 1989 && isYear != 1985 && isYear != 1984 && isYear != 1983){
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
                                                    var results = [];
                                                    var team_stats = [];
                                                    try{
                                                        results = await load(schedule_name + "_results", year.year_id+"/"+"Conferences"+"/"+school_name +"/Games");
                                                        team_stats = await load(schedule_name + "_team_stats", year.year_id+"/"+"Conferences"+"/"+school_name +"/Games");
                                                        
                                                    if(results && team_stats.length > 0)
                                                    {
                                                        await addStatRecord(results, team_stats, schedule_name, year.year_id);
                                                    }
                                                    }
                                                    catch(Ex){
                                                        
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


            async function addStatRecord(results, team_stats, date, year)
            {
                var stopHere = "";
                var data = {};
                data.key = results.away.team.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '')+ "@" + results.home.team.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '') + "@" + date;
                data.date = date;
                data.homeTeam = results.home.team.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '');
                data.awayTeam = results.away.team.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '');
                data.homeFirstDowns = parseFloat(team_stats.filter(function(item){return item.stat == "First Downs"})[0].home_stat);
                data.awayFirstDowns = parseFloat(team_stats.filter(function(item){return item.stat == "First Downs"})[0].vis_stat);
                data.homeTotalYards = parseFloat(team_stats.filter(function(item){return item.stat == "Total Yards"})[0].home_stat);
                data.awayTotalYards = parseFloat(team_stats.filter(function(item){return item.stat == "Total Yards"})[0].vis_stat);
                data.homeTurnovers = parseFloat(team_stats.filter(function(item){return item.stat == "Turnovers"})[0].home_stat);
                data.awayTurnovers = parseFloat(team_stats.filter(function(item){return item.stat == "Turnovers"})[0].vis_stat);
                var homeRushYdsTd = team_stats.filter(function(item){return item.stat == "Rush-Yds-TDs"})[0].home_stat.split("-");
                data.homeRushAtts = parseFloat(homeRushYdsTd[0]);
                data.homeRushYds = parseFloat(homeRushYdsTd[1]);
                data.homeRushTd = parseFloat(homeRushYdsTd[2]);
                var awayRushYdsTd = team_stats.filter(function(item){return item.stat == "Rush-Yds-TDs"})[0].vis_stat.split("-");
                data.awayRushAtts = parseFloat(awayRushYdsTd[0]);
                data.awayRushYds = parseFloat(awayRushYdsTd[1]);
                data.awayRushTd = parseFloat(awayRushYdsTd[2]);
                var homeCmpAttYdTDINT = team_stats.filter(function(item){return item.stat == "Cmp-Att-Yd-TD-INT"})[0].home_stat.split("-");
                data.homePassCmp = parseFloat(homeCmpAttYdTDINT[0]);
                data.homePassAtts = parseFloat(homeCmpAttYdTDINT[1]);
                data.homePassYds = parseFloat(homeCmpAttYdTDINT[2]);
                data.homepassTd = parseFloat(homeCmpAttYdTDINT[3]);
                var awayCmpAttYdTDINT = team_stats.filter(function(item){return item.stat == "Cmp-Att-Yd-TD-INT"})[0].vis_stat.split("-");
                data.awayPassCmp = parseFloat(awayCmpAttYdTDINT[0]);
                data.awayPassAtts = parseFloat(awayCmpAttYdTDINT[1]);
                data.awayPassYds = parseFloat(awayCmpAttYdTDINT[2]);
                data.awaypassTd = parseFloat(awayCmpAttYdTDINT[3]);
                var homeFumblesLost = team_stats.filter(function(item){return item.stat == "Fumbles-Lost"})[0].home_stat.split("-");
                data.homeFumbles = parseFloat(homeFumblesLost[0]);
                data.homeLost = parseFloat(homeFumblesLost[1]);
                var awayFumblesLost = team_stats.filter(function(item){return item.stat == "Fumbles-Lost"})[0].vis_stat.split("-");
                data.awayFumbles = parseFloat(awayFumblesLost[0]);
                data.awayLost = parseFloat(awayFumblesLost[1]);
                var homePenaltiesYards = team_stats.filter(function(item){return item.stat == "Penalties-Yards"})[0].home_stat.split("-");
                data.homePenalties = parseFloat(homePenaltiesYards[0]);
                data.homePenaltiesYards = parseFloat(homePenaltiesYards[1]);
                var awayPenaltiesYards = team_stats.filter(function(item){return item.stat == "Penalties-Yards"})[0].vis_stat.split("-");
                data.awayPenalties = parseFloat(awayPenaltiesYards[0]);
                data.awayPenaltiesYards = parseFloat(awayPenaltiesYards[1]);
                data.homeQ1 = parseInt(results.home.Q1);
                data.homeQ2 = parseInt(results.home.Q2);
                data.homeQ3 = parseInt(results.home.Q3);
                data.homeQ4 = parseInt(results.home.Q4);
                data.homeFinalScore = parseInt(results.home.Final);
                data.awayQ1 = parseInt(results.away.Q1);
                data.awayQ2 = parseInt(results.away.Q2);
                data.awayQ3 = parseInt(results.away.Q3);
                data.awayQ4 = parseInt(results.away.Q4);
                data.awayFinalScore = parseInt(results.away.Final);
                data.scoreDiff = Math.abs(data.homeFinalScore - data.awayFinalScore);
                data.isHomeWinner = data.homeFinalScore > data.awayFinalScore ? 1 : 0;
                try{
                    var records = await load("gameRecords","AnalysisData/"+year);
                }
                catch{
                    var records = [];
                }
                var exitingRecord = records.filter(function(item){return item.key == data.key});
                if(exitingRecord.length == 0)
                {
                    records.push(data);
                    await save("gameRecords", records, function(){}, "replace","AnalysisData/"+year);
                }
                else{
                    var stopHere = "";
                }
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