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

            //await LogIn();
            //await getTableData("/cfb/years/" ,"years", "BaseData");
            //await getConferencesPerYear();
            //await getConferencesPerYearDetails();
            //await getSchoolPerYearDetails();
            //await getSchedulePerYearDetails();
            //await getGamesPerYearDetails();

            // var years =[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005];
            // for (let index = 0; index < years.length; index++) {
            //     const yearTo = years[index];
            //     await prepareData(yearTo);
            //     await formatGamesPerTeam(yearTo);
            //     await generateAverages(yearTo);
            // }

            var years = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005];
            // for (let index = 0; index < years.length; index++) {
            //     const yearTo = years[index];
            //     var toBeEvaluated = false;
            //     await generateMLRecords(yearTo, toBeEvaluated);
            // }
            var MLData = [];
            for (let index = 0; index < years.length; index++) {
                const yearTo = years[index];
                var data = await load(yearTo+"MLData", "AnalysisData")
                MLData = MLData.concat(data);
                await save("MLData",MLData, function(){}, "replace", "AnalysisData")
            }

            // var years = [2024, 2023];
            // for (let index = 0; index < years.length; index++) {
            //     const yearTo = years[index];
            //     var toBeEvaluated = true;
            //     await generateMLRecords(yearTo, toBeEvaluated);
            // }
            
            await enrichMLResults("2024NewMLResults", 2024);

          } 
          catch(Ex){
              console.log(Ex);
              await driver.quit();
              await example();
          } finally {
              //await driver.quit();
              //await example();
          }

          function findMatchesScoreDiff(objectsArray, targetObject, topN = 5) {
            const keyWeights = {
                awayAvgDefAllowedFirstDowns: 1, // Consider only this key
                awayAvgDefAllowedPassTD: 2,
                awayAvgDefAllowedPassCpm:1,
                awayAvgDefAllowedPassYD:2,
                awayAvgDefAllowedPoints:1,
                awayAvgDefAllowedRushTD:2,
                awayAvgDefAllowedRushYD:2,
                awayAvgOffenseFirstDowns: 1, // Consider only this key
                awayAvgOffensePassTD: 2,
                awayAvgOffensePassCpm:1,
                awayAvgOffensePassYD:2,
                awayAvgOffensePoints:1,
                awayAvgOffenseRushTD:2,
                awayAvgOffenseRushYD:2,
                homeAvgDefAllowedFirstDowns: 1, // Consider only this key
                homeAvgDefAllowedPassTD: 2,
                homeAvgDefAllowedPassCpm:1,
                homeAvgDefAllowedPassYD:2,
                homeAvgDefAllowedPoints:1,
                homeAvgDefAllowedRushTD:2,
                homeAvgDefAllowedRushYD:2,
                homeAvgOffenseFirstDowns: 1, // Consider only this key
                homeAvgOffensePassTD: 2,
                homeAvgOffensePassCpm:1,
                homeAvgOffensePassYD:2,
                homeAvgOffensePoints:1,
                homeAvgOffenseRushTD:2,
                homeAvgOffenseRushYD:2
                 // And this key
            };
            const distances = [];
        
            // Calculate min and max for each key in keyWeights to normalize distances
            const minMaxValues = {};
        
            for (let key in keyWeights) {
                if (keyWeights.hasOwnProperty(key) && typeof targetObject[key] === 'number') {
                    let values = objectsArray.map(obj => obj[key]).filter(val => typeof val === 'number');
                    minMaxValues[key] = {
                        min: Math.min(...values),
                        max: Math.max(...values),
                    };
                }
            }
        
            for (let i = 0; i < objectsArray.length; i++) {
                const currentObject = objectsArray[i];
                let distance = 0;
        
                for (let key in keyWeights) {
                    if (
                        keyWeights.hasOwnProperty(key) &&
                        targetObject.hasOwnProperty(key) &&
                        currentObject.hasOwnProperty(key) &&
                        key !== 'isHomeWinner' // Skip the 'isHomeWinner' property
                    ) {
                        const targetValue = targetObject[key];
                        const currentValue = currentObject[key];
        
                        // Only calculate distance for numerical properties defined in keyWeights
                        if (typeof targetValue === 'number' && typeof currentValue === 'number') {
                            const { min, max } = minMaxValues[key];
                            const normalizedDifference = (currentValue - targetValue) / (max - min || 1); // Prevent division by zero
                            const weight = keyWeights[key]; // Use weight from keyWeights
                            distance += weight * normalizedDifference ** 2;
                        }
                    }
                }
        
                distances.push({
                    index: i,
                    object: currentObject,
                    distance: Math.sqrt(distance), // Use Euclidean distance
                });
            }
        
            // Sort the objects by distance
            distances.sort((a, b) => a.distance - b.distance);
        
            // Return the top N closest matches
            return distances.slice(0, topN).map(item => item.object);
        }
        

        function calculateAverage(numbers) {
            if (numbers.length === 0) return 0; // Handle empty array case
        
            const sum = numbers.reduce((acc, num) => acc + num, 0);
            const average = sum / numbers.length;
            
            return average;
        }

          function findMatches(objectsArray, targetObject, topN = 5) {
            const distances = [];

            for (let i = 0; i < objectsArray.length; i++) {
                const currentObject = objectsArray[i];
                let distance = 0;
        
                for (let key in targetObject) {
                    if (
                        targetObject.hasOwnProperty(key) && 
                        currentObject.hasOwnProperty(key) &&
                        key !== 'isHomeWinner' // Skip the 'isHomeWinner' property
                    ) {
                        const targetValue = targetObject[key];
                        const currentValue = currentObject[key];
        
                        // Only calculate distance for numerical properties
                        if (typeof targetValue === 'number' && typeof currentValue === 'number') {
                            distance += Math.abs(currentValue - targetValue);
                        }
                    }
                }
        
                distances.push({
                    index: i,
                    object: currentObject,
                    distance: distance,
                });
            }
        
            // Sort the objects by distance
            distances.sort((a, b) => a.distance - b.distance);
        
            // Return the top N closest matches
            return distances.slice(0, topN).map(item => item.object);
        }
        
        
        
        

          async function LogIn(){
                    var loginUrl = "https://stathead.com/users/login.cgi?token=1&_gl=1*isv5wn*_ga*MTM5MDMxMzA2NS4xNzI0ODc1NTMx*_ga_80FRT7VJ60*MTcyNDg3NTUzMC4xLjAuMTcyNDg3NTUzMC4wLjAuMA..&redirect_uri=https%3A//www.sports-reference.com/cfb/years/2023.html";
                        var data = [];
                    //await driver.manage().setTimeouts({ explicit: 3000 });
                    
                    await driver.manage().setTimeouts({ implicit: 200 });
                    await driver.get(loginUrl);
                    // await driver.wait(until.elementLocated(By.id(tables[tables.length-1])), // Condition to wait for
                    //     3000 // Timeout in milliseconds (10 seconds)
                    // );
                    let loginElement = await driver.wait(until.elementLocated(By.id('username')), 10000);
                    await driver.wait(until.elementIsVisible(loginElement), 10000);

                    await driver.findElement(By.id('username')).sendKeys('jose.carbajal.salinas@gmail.com');
                    await driver.findElement(By.id('password')).sendKeys('Lom@s246', Key.RETURN);
                    
                    
                    let loadElement = await driver.wait(until.elementLocated(By.id('all_awards')), 10000);
                    await driver.wait(until.elementIsVisible(loadElement), 10000);
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

        function calculateStandardDeviation(values) {
            const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
        
            const squaredDifferences = values.map(val => {
                const difference = val - mean;
                return difference ** 2;
            });
        
            const meanSquaredDifference = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
        
            const standardDeviation = Math.sqrt(meanSquaredDifference);
            return standardDeviation;
        }

        async function enrichMLResults(fileToEnrich, yearToProcess)
        {
            var allMLRecords = await load(fileToEnrich,"AnalysisData");
            try{
            var yearResults = await load("gameRecords","AnalysisData/"+yearToProcess);
            allMLRecords.forEach(record => {
                var keyParts = record.key.split("@");

                var sel = yearResults.filter(function(item){return (item.key.indexOf(keyParts[0])>=0 && item.key.indexOf(keyParts[1])>=0 && item.key.indexOf(keyParts[2])>=0)});
                if(sel.length > 0)
                {
                    record.isHomeWinner = sel[0].isHomeWinner;
                    record.scoreDiff = sel[0].scoreDiff;
                    record.totalPoints = sel[0].totalPoints;
                }
                else{
                    record.isHomeWinner = 0;
                    record.scoreDiff = 0;
                    record.totalPoints = 0;
                }
            });
            }
            catch{}

            
            var analysisArray = await load("MLData", "AnalysisData");
            var targetData = await load(yearToProcess+"MLDataToEvaluate", "AnalysisData");
            allMLRecords.forEach(game => {
                var keyParts = game.key.split("@");
                var targetGame = targetData.filter(function(item){return (item.key.indexOf(keyParts[0])>=0 && item.key.indexOf(keyParts[1])>=0 && item.key.indexOf(keyParts[2])>=0)})[0];
                const matches = findMatches(analysisArray, targetGame, 5);
                const scoreMatches =  findMatchesScoreDiff(analysisArray, targetGame, 10);
//---------------------------------------------------------------------------------------------------------------
                var similarMatchesGamesWinner = matches.map(n => n.isHomeWinner);
                var similarMatchesProbabilities = calculateAverage(similarMatchesGamesWinner);
                var similarMatchesPrediction = similarMatchesProbabilities <= .5 ? 0 : 1;
                var similarMatchesProbability = similarMatchesPrediction == 0 ? 1-similarMatchesProbabilities : similarMatchesProbabilities;

                game.predictions.isHomeWinner["SimilarMatches"] = { prediction: similarMatchesPrediction, probability: similarMatchesProbability};

                var similarScoreGamesWinner = scoreMatches.map(n => n.isHomeWinner);
                var similarScoreProbabilities = calculateAverage(similarScoreGamesWinner);
                var similarScorePrediction = similarScoreProbabilities <= .5 ? 0 : 1;
                var similarScoreProbability = similarScorePrediction == 0 ? 1-similarScoreProbabilities : similarScoreProbabilities;
                game.predictions.isHomeWinner["SimilarScore"] = { prediction: similarScorePrediction, probability: similarScoreProbability};
//---------------------------------------------------------------------------------------------------------------

                var similarMatchesScoreDiff = matches.map(n => Math.abs(n.scoreDiff));
                var similarMatchesScoreDiffAvg = Math.round(calculateAverage(similarMatchesScoreDiff));
                var similarMatchesScoreDiffStdDev = Math.round(calculateStandardDeviation(similarMatchesScoreDiff));

                game.predictions.scoreDiff = {"SimilarMatches":{},"SimilarScore":{} };
                game.predictions.scoreDiff["SimilarMatches"] = { prediction: similarMatchesScoreDiffAvg, stdDev: similarMatchesScoreDiffStdDev};

                var similarScoreScoreDiff = scoreMatches.map(n => Math.abs(n.scoreDiff));
                var similarScoreScoreDiffAvg = Math.round(calculateAverage(similarScoreScoreDiff));
                var similarScoreScoreDiffStdDev = Math.round(calculateStandardDeviation(similarScoreScoreDiff));

                game.predictions.scoreDiff["SimilarScore"] = { prediction: similarScoreScoreDiffAvg, stdDev: similarScoreScoreDiffStdDev};
//---------------------------------------------------------------------------------------------------------------

                var similarMatchesTotalPoints = matches.map(n => n.totalPoints);
                var similarMatchesTotalPointsAvg = Math.round(calculateAverage(similarMatchesTotalPoints));
                var similarMatchesTotalPointsStdDev = Math.round(calculateStandardDeviation(similarMatchesTotalPoints));

                game.predictions.totalPoints = {"SimilarMatches":{},"SimilarScore":{} };
                game.predictions.totalPoints["SimilarMatches"] = { prediction: similarMatchesTotalPointsAvg, stdDev: similarMatchesTotalPointsStdDev};

                var similarScoreTotalPoints = scoreMatches.map(n => Math.abs(n.totalPoints));
                var similarScoreTotalPointsAvg = Math.round(calculateAverage(similarScoreTotalPoints));
                var similarScoreTotalPointsStdDev = Math.round(calculateStandardDeviation(similarScoreTotalPoints));

                game.predictions.totalPoints["SimilarScore"] = { prediction: similarScoreTotalPointsAvg, stdDev: similarScoreTotalPointsStdDev};
//---------------------------------------------------------------------------------------------------------------

                var similarMatchesAwayDefPoints = matches.map(n => n.awayAvgDefAllowedPoints);
                var similarMatchesAwayDefPointsAvg = Math.round(calculateAverage(similarMatchesAwayDefPoints));
                var similarMatchesAwayDefPointsStdDev = Math.round(calculateStandardDeviation(similarMatchesAwayDefPoints));

                game.predictions.awayAvgDefAllowedPoints = {"SimilarMatches":{},"SimilarScore":{} };
                game.predictions.awayAvgDefAllowedPoints["SimilarMatches"] = { prediction: similarMatchesAwayDefPointsAvg, stdDev: similarMatchesAwayDefPointsStdDev};

                var similarScoreAwayDefPoints = scoreMatches.map(n => n.awayAvgDefAllowedPoints);
                var similarScoreAwayDefPointsAvg = Math.round(calculateAverage(similarScoreAwayDefPoints));
                var similarScoreAwayDefPointsStdDev = Math.round(calculateStandardDeviation(similarScoreAwayDefPoints));

                game.predictions.awayAvgDefAllowedPoints["SimilarScore"] = { prediction: similarScoreAwayDefPointsAvg, stdDev: similarScoreAwayDefPointsStdDev};
 //---------------------------------------------------------------------------------------------------------------     
               
                var similarMatchesHomeDefPoints = matches.map(n => n.homeAvgDefAllowedPoints);
                var similarMatcheHomeScorePointsAvg = Math.round(calculateAverage(similarMatchesHomeDefPoints));
                var similarMatchesHomeScorePointsStdDev = Math.round(calculateStandardDeviation(similarMatchesHomeDefPoints));

                game.predictions.homeAvgDefAllowedPoints = {"SimilarMatches":{},"SimilarScore":{} };
                game.predictions.homeAvgDefAllowedPoints["SimilarMatches"] = { prediction: similarMatcheHomeScorePointsAvg, stdDev: similarMatchesHomeScorePointsStdDev};

                var similarScoreHomeDefPoints = scoreMatches.map(n => n.homeAvgDefAllowedPoints);
                var similarMatcheHomeScorePointsAvg = Math.round(calculateAverage(similarScoreHomeDefPoints));
                var similarScoreHomeScorePointsStdDev = Math.round(calculateStandardDeviation(similarScoreHomeDefPoints));

                game.predictions.homeAvgDefAllowedPoints["SimilarScore"] = { prediction: similarMatcheHomeScorePointsAvg, stdDev: similarScoreHomeScorePointsStdDev};


//---------------------------------------------------------------------------------------------------------------

                var similarMatchesAwayOffPoints = matches.map(n => n.awayAvgOffensePoints);
                var similarMatchesAwayScorePoints = Math.round(calculateAverage(similarMatchesAwayOffPoints));
                var similarMatchesAwayScorePointsStdDev = Math.round(calculateStandardDeviation(similarMatchesAwayOffPoints));

                game.predictions.awayAvgOffensePoints = {"SimilarMatches":{},"SimilarScore":{} };
                game.predictions.awayAvgOffensePoints["SimilarMatches"] = { prediction: similarMatchesAwayScorePoints, stdDev: similarMatchesAwayScorePointsStdDev};

                var similarScoreAwayOffPoints = scoreMatches.map(n => n.awayAvgOffensePoints);
                var similarScoreAwayScorePoints = Math.round(calculateAverage(similarScoreAwayOffPoints));
                var similarScoreAwayScorePointsStdDev = Math.round(calculateStandardDeviation(similarScoreAwayOffPoints));

                game.predictions.awayAvgOffensePoints["SimilarScore"] = { prediction: similarScoreAwayScorePoints, stdDev: similarScoreAwayScorePointsStdDev};

//---------------------------------------------------------------------------------------------------------------
                
                var similarMatchesHomeOffPoints = matches.map(n => n.homeAvgOffensePoints);
                var similarMatchesHomeScorePoints = Math.round(calculateAverage(similarMatchesHomeOffPoints));
                var similarMatchesHomeScorePointsStdDev = Math.round(calculateStandardDeviation(similarMatchesHomeOffPoints));

                game.predictions.homeAvgOffensePoints = {"SimilarMatches":{},"SimilarScore":{} };
                game.predictions.homeAvgOffensePoints["SimilarMatches"] = { prediction: similarMatchesHomeScorePoints, stdDev: similarMatchesHomeScorePointsStdDev};

                var similarScoreHomeOffPoints = scoreMatches.map(n => n.homeAvgOffensePoints);
                var similarScoreHomeScorePoints = Math.round(calculateAverage(similarScoreHomeOffPoints));
                var similarScoreHomeScorePointsStdDev = Math.round(calculateStandardDeviation(similarScoreHomeOffPoints));

                game.predictions.homeAvgOffensePoints["SimilarScore"] = { prediction: similarScoreHomeScorePoints, stdDev: similarScoreHomeScorePointsStdDev};

                
                game.date = game.key.split("@")[2];
            });

            allMLRecords.forEach(game => {
                var team1 = game.key.split("@")[0];
                var team2 = game.key.split("@")[1];
                if(team1 =="SouthernUtah"){
                    var stopHere = "";
                }
                var matches = analysisArray.filter(function(item){
                    var away = item.key.split("@")[0];
                    var home = item.key.split("@")[1];
                    return ((away == team1 && home == team2) || (away == team2 && home == team1) && (item.awayAvgDefAllowedTotalYD >0 && item.homeAvgDefAllowedTotalYD > 0)) });
                // const matches = findMatches(analysisArray, targetGame, 5);
                // var similarGamesWinner = matches.map(n => n.isHomeWinner);
                // var probabilities = calculateAverage(similarGamesWinner);
                if(matches.length > 0){
                    var previousScoreDiff = matches.map(n => Math.abs(n.scoreDiff));
                    game.previousScoreDiffAvg = Math.round(calculateAverage(previousScoreDiff));
                    game.previousScoreDiffStdDev = Math.round(calculateStandardDeviation(previousScoreDiff));
                    game.previousCount = previousScoreDiff.length;


                    var previousMatchesGamesWinner = matches.map(n => n.isHomeWinner);
                    var previousMatchesProbabilities = calculateAverage(previousMatchesGamesWinner);
                    var previousMatchesPrediction = previousMatchesProbabilities <= .5 ? 0 : 1;
                    var previousMatchesProbability = game.previousMatchesPrediction == 0 ? 1-previousMatchesProbabilities : previousMatchesProbabilities;

                    game.predictions.isHomeWinner["PreviousMatches"] = { prediction: previousMatchesPrediction, count: previousMatchesGamesWinner.length};

                    var previousMatchesScoreDiff = matches.map(n => Math.abs(n.scoreDiff));
                    var previousMatchesScoreDiffAvg = Math.round(calculateAverage(previousMatchesScoreDiff));
                    var previousMatchesScoreDiffStdDev = Math.round(calculateStandardDeviation(previousMatchesScoreDiff));

                    game.predictions.scoreDiff["PreviousMatches"] = { prediction: previousMatchesScoreDiffAvg, count: previousMatchesScoreDiff.length};

                    var previousMatchesTotalPoints = matches.map(n => n.totalPoints);
                    var previousMatchesTotalPointsAvg = Math.round(calculateAverage(previousMatchesTotalPoints));
                    var previousMatchesTotalPointsStdDev = Math.round(calculateStandardDeviation(previousMatchesTotalPoints));
    
                    game.predictions.totalPoints["PreviousMatches"] = { prediction: previousMatchesTotalPointsAvg, count: previousMatchesTotalPoints.length};


                }
                else{
                    game.predictions.isHomeWinner["PreviousMatches"] = { prediction: 0, count: 0};
                    game.predictions.scoreDiff["PreviousMatches"] = { prediction: 0, count: 0};  
                    game.predictions.totalPoints["PreviousMatches"] = { prediction: 0, count: 0};
                }
            });


            allMLRecords.forEach(game => {
                game.projectedResults = {"homeScorePoints":0, "awayScorePoints":0, "scoreDiff":0};
                game.projectedResults["homeScorePoints"] = CalculateScorePoints(game, "home");
                game.projectedResults["awayScorePoints"] = CalculateScorePoints(game, "away");
                game.projectedResults["scoreDiff"] = CalculateScoreDiff(game);
                game.projectedResults["totalPoints"] = CalculateTotalPoints(game);
                game.projectedResults["isHomeWinner"] = CalculateHomeWinner(game);
                var stopHere = "";
            });



            // var spreads = await load("August31thBets", "BetsData");
            // allMLRecords.forEach(game => {
            //     var team1 = game.key.split("@")[0];
            //     var team2 = game.key.split("@")[1];
            //     if(team1 =="SouthernUtah"){
            //         var stopHere = "";
            //     }
            //     var matches = spreads.filter(function(item){
            //         return ((item.team.replace(/\s+/g, '') == team1 || item.team.replace(/\s+/g, '') == team2));
            //     });
            //     if(matches.length >0)
            //     {
            //         game.spread = Math.abs(parseFloat(matches[0].handicap.replace("+","").replace("-","")));
            //         var stopHere = "";
            //     }
                
                
            // });


        //     allMLRecords.forEach(game => {
        //         if(game.spread){
        //         var maxValue = (game.similarScoreDiffAvg + game.similarScoreDiffStandardDeviation) >= (game.spread < game.previousScoreDiff) ? (game.similarScoreDiffAvg + game.similarScoreDiffStandardDeviation) : (game.spread < game.previousScoreDiff);
        //         maxValue = maxValue > (game.predictions.scoreDiff.LogisticRegression.prediction + game.predictions.scoreDiff.RandomForest.prediction) ? maxValue : (game.predictions.scoreDiff.LogisticRegression.prediction + game.predictions.scoreDiff.RandomForest.prediction);
                
        //         var minMLValue = game.predictions.scoreDiff.LogisticRegression.prediction <= game.predictions.scoreDiff.RandomForest.prediction ? game.predictions.scoreDiff.LogisticRegression.prediction : game.predictions.scoreDiff.RandomForest.prediction;
        //         var minSimilar = (game.similarScoreDiffAvg - game.similarScoreDiffStandardDeviation);
        //         var minPrevious = game.previousScoreDiffAvg;
        //         if(minPrevious)
        //         {
        //             game.minValue = Math.min(minMLValue, minSimilar, minPrevious);
        //         }
        //         else{
        //             game.minValue = Math.min(minMLValue, minSimilar);
        //         }

        //         var maxMLValue = game.predictions.scoreDiff.LogisticRegression.prediction >= game.predictions.scoreDiff.RandomForest.prediction ? game.predictions.scoreDiff.LogisticRegression.prediction : game.predictions.scoreDiff.RandomForest.prediction;
        //         var maxSimilar = (game.similarScoreDiffAvg + game.similarScoreDiffStandardDeviation);
        //         var maxPrevious = game.previousScoreDiffAvg;
        //         if(maxPrevious)
        //         {
        //             game.maxValue = Math.max(maxMLValue, maxSimilar, maxPrevious);
        //         }
        //         else{
        //             game.maxValue = Math.max(maxMLValue, maxSimilar);
        //         }

        //         game.maxDiff = Math.abs(game.spread - game.maxValue);
        //         game.minDiff = Math.abs(game.spread - game.minValue);

        //         if(game.maxValue > game.spread &&  game.minValue > game.spread ){
        //             game.spreadSelection = "winner";
        //             game.advantageDiff = game.maxValue - game.spread;
        //         }
        //         else if(game.maxValue < game.spread &&  game.minValue < game.spread){
        //             game.spreadSelection = "loser";
        //             game.advantageDiff = game.spread - game.maxValue;
        //         }
        //         else{
        //             game.spreadSelection = "to evaluate";
        //             game.advantageDiff = 0;
        //         }
                
                
        //     }
        //     else{
        //         game.maxValue = 0;
        //         game.minValue = 0;
        //         game.maxDiff = 0;
        //         game.minDiff = 0;
        //         game.advantageDiff = 0;
        //         game.spreadSelection = "no data";
        //     }
        // });

        



            await save(fileToEnrich, allMLRecords, function(){},"replace" ,"AnalysisData");

        }

        function CalculateScoreDiff(game)
        {
            var projectedScore = {prediction:0, stdDev:0, min:0, max:0};
            var scoreDiffAverage =  getAverageStdDevProperty(game.predictions.scoreDiff);            

            projectedScore.prediction = Math.round(scoreDiffAverage.averages.average);
            projectedScore.stdDev = Math.round(scoreDiffAverage.averages.stdDev);
            projectedScore.min = projectedScore.prediction - projectedScore.stdDev;
            projectedScore.max = projectedScore.prediction + projectedScore.stdDev;
            
            return projectedScore;
        }


        function CalculateHomeWinner(game)
        {
            var projectedScore = {isHomeWinner:0, chances:0 ,probability:0};
            var homeWinnerCount = 0;
            var awayWinnerCount = 0;
            var homeWinnerProb = [];
            var awayWinnerProb = [];

            awayWinnerCount = awayWinnerCount + game.predictions.isHomeWinner.RandomForest.prediction == 0 ? 1:0;
            game.predictions.isHomeWinner.RandomForest.prediction == 0 ? awayWinnerProb.push(game.predictions.isHomeWinner.RandomForest.probability):0;
            
            homeWinnerCount = homeWinnerCount + game.predictions.isHomeWinner.RandomForest.prediction == 1 ? 1:0;
            game.predictions.isHomeWinner.RandomForest.prediction == 1 ? homeWinnerProb.push(game.predictions.isHomeWinner.RandomForest.probability):0;

            awayWinnerCount = awayWinnerCount + game.predictions.isHomeWinner.LogisticRegression.prediction == 0 ? 1:0;
            game.predictions.isHomeWinner.LogisticRegression.prediction == 0 ? awayWinnerProb.push(game.predictions.isHomeWinner.LogisticRegression.probability):0;
            
            homeWinnerCount = homeWinnerCount + game.predictions.isHomeWinner.LogisticRegression.prediction == 1 ? 1:0;
            game.predictions.isHomeWinner.LogisticRegression.prediction == 1 ? homeWinnerProb.push(game.predictions.isHomeWinner.LogisticRegression.probability):0;

            awayWinnerCount = awayWinnerCount + game.predictions.isHomeWinner.SimilarMatches.prediction == 0 ? 1:0;
            game.predictions.isHomeWinner.SimilarMatches.prediction == 0 ? awayWinnerProb.push(game.predictions.isHomeWinner.SimilarMatches.probability):0;
            
            homeWinnerCount = homeWinnerCount + game.predictions.isHomeWinner.SimilarMatches.prediction == 1 ? 1:0;
            game.predictions.isHomeWinner.SimilarMatches.prediction == 1 ? homeWinnerProb.push(game.predictions.isHomeWinner.SimilarMatches.probability):0;

            awayWinnerCount = awayWinnerCount + game.predictions.isHomeWinner.SimilarScore.prediction == 0 ? 1:0;
            game.predictions.isHomeWinner.SimilarScore.prediction == 0 ? awayWinnerProb.push(game.predictions.isHomeWinner.SimilarScore.probability):0;
            
            homeWinnerCount = homeWinnerCount + game.predictions.isHomeWinner.SimilarScore.prediction == 1 ? 1:0;
            game.predictions.isHomeWinner.SimilarScore.prediction == 1 ? homeWinnerProb.push(game.predictions.isHomeWinner.SimilarScore.probability):0;
            //To do previous
            projectedScore.isHomeWinner = homeWinnerProb.length > awayWinnerProb.length ? 1 : homeWinnerProb.length < awayWinnerProb.length ? 0 : Math.round(calculateAverage(homeWinnerProb)*100) >= Math.round(calculateAverage(awayWinnerProb)*100) ? 1:0;
            projectedScore.chances = projectedScore.isHomeWinner == 1 ? Math.round(((homeWinnerProb.length /(awayWinnerProb.length+homeWinnerProb.length))*100)) : Math.round(((awayWinnerProb.length /(awayWinnerProb.length+homeWinnerProb.length))*100));
            projectedScore.probability =   projectedScore.isHomeWinner == 1 ? Math.round(calculateAverage(homeWinnerProb)*100) : Math.round(calculateAverage(awayWinnerProb)*100);
         
            
            return projectedScore;
        }

        function CalculateTotalPoints(game)
        {
            var projectedScore = {prediction:0, stdDev:0, min:0, max:0};
            var totalPointsAverage =  getAverageStdDevProperty(game.predictions.totalPoints);            

            projectedScore.prediction = Math.round(totalPointsAverage.averages.average);
            projectedScore.stdDev = Math.round(totalPointsAverage.averages.stdDev);
            projectedScore.min = projectedScore.prediction - projectedScore.stdDev;
            projectedScore.max = projectedScore.prediction + projectedScore.stdDev;
            
            return projectedScore;
        }

        function CalculateScorePoints(game, homeorAway)
        {
            var scores = [];
            var projectedScore = {prediction:0, stdDev:0, min:0, max:0};
            if(homeorAway == "home")
            {
                var awayExpectedReceivedPoints =  getAverageStdDevProperty(game.predictions.awayAvgDefAllowedPoints);
                scores.push(awayExpectedReceivedPoints.averages.average);
                var homeExpectedScoringPoints =  getAverageStdDevProperty(game.predictions.homeAvgOffensePoints);
                scores.push(homeExpectedScoringPoints.averages.average);

                projectedScore.prediction = Math.round(calculateAverage(scores));
                projectedScore.stdDev = Math.round(calculateStandardDeviation(scores));
                projectedScore.min = projectedScore.prediction - projectedScore.stdDev;
                projectedScore.max = projectedScore.prediction + projectedScore.stdDev;
            }
            else if(homeorAway == "away")
            {
                var homeExpectedReceivedPoints =  getAverageStdDevProperty(game.predictions.homeAvgDefAllowedPoints);
                scores.push(homeExpectedReceivedPoints.averages.average);
                var awayExpectedScoringPoints =  getAverageStdDevProperty(game.predictions.awayAvgOffensePoints);
                scores.push(awayExpectedScoringPoints.averages.average);

                projectedScore.prediction = Math.round(calculateAverage(scores));
                projectedScore.stdDev = Math.round(calculateStandardDeviation(scores));
                projectedScore.min = projectedScore.prediction - projectedScore.stdDev;
                projectedScore.max = projectedScore.prediction + projectedScore.stdDev;
            }
            return projectedScore;
        }

        function getAverageStdDevProperty(data)
        {
            var arrayOfValues = [];
            // var mlValues = [];
            // var similarValues = [];
            // var coreValues = [];
            // arrayOfValues.push(data.RandomForest.prediction);
            // coreValues.push(data.RandomForest.prediction);
            // mlValues.push(data.RandomForest.prediction);
            // arrayOfValues.push(data.LogisticRegression.prediction);
            // coreValues.push(data.LogisticRegression.prediction);
            // mlValues.push(data.LogisticRegression.prediction);
            arrayOfValues.push(data.SimilarMatches.prediction);
            //coreValues.push(data.SimilarMatches.prediction);
            arrayOfValues.push(data.SimilarMatches.prediction + data.SimilarMatches.stdDev);
            arrayOfValues.push(data.SimilarMatches.prediction - data.SimilarMatches.stdDev);
            arrayOfValues.push(data.SimilarScore.prediction);
            //coreValues.push(data.SimilarScore.prediction);
            arrayOfValues.push(data.SimilarScore.prediction + data.SimilarScore.stdDev);
            arrayOfValues.push(data.SimilarScore.prediction - data.SimilarScore.stdDev);
            //similarValues.push(data.SimilarMatches.prediction);
            //coreValues.push(data.SimilarMatches.prediction);
            // similarValues.push(data.SimilarMatches.prediction + data.SimilarMatches.stdDev);
            // similarValues.push(data.SimilarMatches.prediction - data.SimilarMatches.stdDev);
            // similarValues.push(data.SimilarScore.prediction);
            //coreValues.push(data.SimilarScore.prediction);
            // similarValues.push(data.SimilarScore.prediction + data.SimilarScore.stdDev);
            // similarValues.push(data.SimilarScore.prediction - data.SimilarScore.stdDev);
            if(data.PreviousMatches && data.PreviousMatches.prediction != 0)
            {
                arrayOfValues.push(data.PreviousMatches.prediction);
            }
            var average = calculateAverage(arrayOfValues);
            var stdDev = calculateStandardDeviation(arrayOfValues);
            // var averageML = calculateAverage(mlValues);
            // var stdDevML = calculateStandardDeviation(mlValues);
            // var averageSimilar = calculateAverage(similarValues);
            // var stdDevSimilar = calculateStandardDeviation(similarValues);
            // var averageCore = calculateAverage(coreValues);
            // var stdDevCore= calculateStandardDeviation(coreValues);
            // var allAverages = [];
            // allAverages.push(averageAll);
            // allAverages.push(averageML);
            // allAverages.push(averageSimilar);
            // allAverages.push(averageCore);
            // var average = calculateAverage(allAverages);
            // var stdDev = calculateStandardDeviation(allAverages);
            data.averages = {average: average, stdDev:stdDev };
            return data;
        }

        async function generateMLRecords(yearToProcess, toBeEvaluated)
        {
            console.log("Generating ML data for: "+ yearToProcess);
            try{
                if(!toBeEvaluated){
                    var MLData = [];//await load(yearToProcess+"MLData", "AnalysisData");
                }
                else{
                    var MLData = await load(yearToProcess+"MLDataToEvaluate", "AnalysisData");
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
                                        
                                        if(schedules.length > 0 && year.year_id != 2024){
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
                                                        try{
                                                            gameResults = await load("formatedRecords","AnalysisData/" + (year.year_id-1));
                                                            var selectedGameResults = gameResults.filter(function(item){return item.team == school_name});
                                                            var selectedGameResult = selectedGameResults[selectedGameResults.length-1];
                                                        }
                                                        catch{
                                                            var selectedGameResult = null;
                                                            var stopHere = "";
                                                        }
                                                    }
                                                    if(selectedAverage[0].defAllowedFirstDowns == 0 && selectedAverage[0].offenseFirstDowns == 0)
                                                    {
                                                        try{
                                                            var arr = [];
                                                            averageRecords = await load("averageRecords","AnalysisData/" + (year.year_id-1));
                                                            var selectedAverage = averageRecords.filter(function(item){return item.team == school_name});
                                                            var selectedAvg = selectedAverage[selectedAverage.length-1];
                                                            arr.push(selectedAvg);
                                                            selectedAverage = arr;
                                                        }
                                                        catch{
                                                            var selectedAverage = [];
                                                        }
                                                        var stopHere = "";
                                                        //todo
                                                    }
                                                    var opponentGameResults = gameResults.filter(function(item){return item.team == opponentName});
                                                    var opponentIndex = opponentGameResults.findIndex(x =>x.date == schedule_name);
                                                    if(opponentIndex > 0)
                                                    {
                                                        var opponentGameResult = opponentGameResults[opponentIndex-1];
                                                    }
                                                    else{
                                                        try{
                                                            gameResults = await load("formatedRecords","AnalysisData/" + (year.year_id-1));
                                                            var opponentGameResults = gameResults.filter(function(item){return item.team == opponentName});
                                                            var opponentGameResult = opponentGameResults[opponentGameResults.length-1];
                                                        }
                                                        catch{
                                                            var opponentGameResult = null;
                                                            var stopHere = "";
                                                        }
                                                        
                                                    }
                                                    if(opponentAverage[0].defAllowedFirstDowns == 0 && opponentAverage[0].offenseFirstDowns == 0)
                                                    {
                                                        try{
                                                            var arr = [];
                                                            averageRecords = await load("averageRecords","AnalysisData/" + (year.year_id-1));
                                                            var opponentAverage = averageRecords.filter(function(item){return item.team == opponentName});
                                                            var opponentAvg = opponentAverage[opponentAverage.length-1];
                                                            arr.push(opponentAvg);
                                                            opponentAverage = arr;
                                                        }
                                                        catch{
                                                            var opponentAverage = [];
                                                        }
                                                        var stopHere = "";
                                                        //todo
                                                    }
                                                    
                                                if(gameRecord.length > 0 && selectedAverage.length > 0 && selectedGameResult && opponentAverage.length > 0 && opponentGameResult)
                                                {
                                                    var MLRecord = {};
                                                    MLRecord.key = gameRecord[0].key;
                                                    MLRecord.date = gameRecord[0].date;
                                                    
                                                    MLRecord.homeTeam = gameRecord[0].homeTeam;
                                                    MLRecord.awayTeam = gameRecord[0].awayTeam;
                                                    // var homeRecords = gameRecord[0].homeTeam == selectedGameResult.team ? selectedGameResult : opponentGameResult;
                                                    // MLRecord = appendProperties(MLRecord, homeRecords, "home");
                                                    // var awayRecords = gameRecord[0].awayTeam == opponentGameResult.team ? opponentGameResult : selectedGameResult;
                                                    // MLRecord = appendProperties(MLRecord, awayRecords, "away");
                                                    var homeAverageRecords = gameRecord[0].homeTeam == selectedAverage[0].team ? selectedAverage[0] : opponentAverage[0];
                                                    MLRecord = appendProperties(MLRecord, homeAverageRecords, "homeAvg");
                                                    var awayAverageRecords = gameRecord[0].awayTeam == opponentAverage[0].team ? opponentAverage[0] : selectedAverage[0];
                                                    MLRecord = appendProperties(MLRecord, awayAverageRecords, "awayAvg");

                                                    if(!toBeEvaluated){
                                                        MLRecord.isHomeWinner = gameRecord[0].isHomeWinner;
                                                        MLRecord.scoreDiff = gameRecord[0].scoreDiff;
                                                        MLRecord.totalPoints = gameRecord[0].totalPoints;
                                                    }
                                                    else{
                                                        MLRecord.isHomeWinner = 0;
                                                        // MLRecord.scoreDiff = 0;
                                                        // MLRecord.totalPoints = 0;
                                                        // MLRecord.awayAvgDefAllowedPoints = 0;
                                                        // MLRecord.awayAvgOffensePoints = 0;
                                                        // MLRecord.homeAvgDefAllowedPoints = 0;
                                                        // MLRecord.homeAvgOffensePoints = 0;
                                                    }
                                                    if(MLRecord.homeAvgOffenseTotalYD  == 0 || MLRecord.awayAvgOffenseTotalYD  == 0){
                                                    var stopHere = ""
                                                    }
                                                    var isThere = MLData.filter(function(item){return item.key == MLRecord.key });
                                                    if(isThere.length == 0){
                                                        MLData.push(MLRecord);
                                                        if(!toBeEvaluated){
                                                            await save(yearToProcess+"MLData",MLData, function(){}, "replace" ,"AnalysisData");
                                                        }
                                                        else{
                                                            await save(yearToProcess+"MLDataToEvaluate",MLData, function(){}, "replace" ,"AnalysisData");
                                                        }
                                                    }
                                                }
                                                }
                                                catch(Ex){
                                                    
                                                }
                                                
                                            }
                                        }
                                        else{
                                            for (let rat = 0; rat < schedules.length; rat++) {
                                                if(rat == 0 || rat == 1){
                                                    var stopHere = "";
                                                
                                                const schedule = schedules[rat];
                                                var homePossibleTeam = extractTextBetween(schedule.date_gameLink);
                                                var opponentName = schedule.opp_name.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '').replace("_","");
                                                school_name = school_name.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '').replace("_","");
                                                var home_name = null;
                                                var away_name = null;
                                                if(homePossibleTeam.indexOf("-")<0)
                                                {
                                                   home_name = school_name.toLowerCase().indexOf(homePossibleTeam.toLowerCase()) >=0 ? school_name : opponentName.toLowerCase().indexOf(homePossibleTeam.toLowerCase()) >=0 ? opponentName : null;
                                                   if(home_name){
                                                        away_name = home_name == school_name ? opponentName : school_name;
                                                   }
                                                }
                                                else{
                                                    var option1 = homePossibleTeam.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '').replace("_","").replace(/-/g,"");
                                                    home_name = school_name.toLowerCase().indexOf(option1.toLowerCase()) >=0 ? school_name : opponentName.toLowerCase().indexOf(option1.toLowerCase()) >=0 ? opponentName : null;
                                                    if(home_name){
                                                        away_name = home_name == school_name ? opponentName : school_name;
                                                   }
                                                }
                                                if(!home_name)
                                                {
                                                    var options = homePossibleTeam.split("-");
                                                    for (let index = 0; index < options.length; index++) {
                                                        const option = options[index];
                                                        home_name = school_name.toLowerCase().indexOf(option.toLowerCase()) >=0 ? school_name : opponentName.toLowerCase().indexOf(option1.toLowerCase()) >=0 ? opponentName : null;
                                                        if(home_name){
                                                            away_name = home_name == school_name ? opponentName : school_name;
                                                            break;
                                                        }
                                                    }
                                                    
                                                    if(!home_name){
                                                        var lastOption = "";
                                                        for (let index = 0; index < options.length; index++) {
                                                            const option = options[index];
                                                            lastOption += option.charAt(0);
                                                        }
                                                        home_name = school_name.toLowerCase().indexOf(lastOption.toLowerCase()) >=0 ? school_name : opponentName.toLowerCase().indexOf(lastOption.toLowerCase()) >=0 ? opponentName : null;
                                                        if(home_name){
                                                            away_name = home_name == school_name ? opponentName : school_name;
                                                        }
                                                        else{
                                                            var stopHere = "";
                                                        }
                                                   }
                                                }
                                                var schedule_name = schedule.date_game.replace(" ","_").replace(" ","_").replace(",","");
                                                var gameRecords = [];
                                                var gameResults = [];
                                                var averageRecords = [];
                                                

                                                try{
                                                    //gameRecords = await load("gameRecords","AnalysisData/" + year.year_id);
                                                    
                                                    try{
                                                        if(rat == 0){
                                                        gameResults = await load("formatedRecords","AnalysisData/" + (year.year_id-1));
                                                        var selectedGameResults = gameResults.filter(function(item){return item.team == home_name});
                                                        var selectedGameResult = selectedGameResults[selectedGameResults.length-1];
                                                        }
                                                        else{
                                                            gameResults = await load("formatedRecords","AnalysisData/" + (year.year_id));
                                                            var selectedGameResults = gameResults.filter(function(item){return item.team == home_name});
                                                            var selectedGameResult = selectedGameResults[rat-1];
                                                        }
                                                    }
                                                    catch{
                                                        var selectedGameResult = null;
                                                        var stopHere = "";
                                                    }
                                                    
                                                    try{
                                                        if(rat == 0){
                                                        var arr = [];
                                                        averageRecords = await load("averageRecords","AnalysisData/" + (year.year_id-1));
                                                        var selectedAverage = averageRecords.filter(function(item){return item.team == home_name});
                                                        var selectedAvg = selectedAverage[selectedAverage.length-1];
                                                        arr.push(selectedAvg);
                                                        selectedAverage = arr;
                                                        }
                                                        else{
                                                            var arr = [];
                                                            averageRecords = await load("averageRecords","AnalysisData/" + (year.year_id));
                                                            var selectedAverage = averageRecords.filter(function(item){return item.team == home_name});
                                                            var selectedAvg = selectedAverage[rat-1];
                                                            if((rat-1) ==0 )
                                                            {
                                                                selectedAvg = selectedGameResult;
                                                            }
                                                            arr.push(selectedAvg);
                                                            selectedAverage = arr;
                                                        }
                                                    }
                                                    catch{
                                                        var selectedAverage = [];
                                                    }
                                                    var stopHere = "";
                                                    //todo
                                                    
                                                    
                                                    try{
                                                        if(rat ==0){
                                                        gameResults = await load("formatedRecords","AnalysisData/" + (year.year_id-1));
                                                        var opponentGameResults = gameResults.filter(function(item){return item.team == away_name});
                                                        var opponentGameResult = opponentGameResults[opponentGameResults.length-1];
                                                        }
                                                        else{
                                                            gameResults = await load("formatedRecords","AnalysisData/" + (year.year_id));
                                                            var opponentGameResults = gameResults.filter(function(item){return item.team == away_name});
                                                            var opponentGameResult = opponentGameResults[rat-1];
                                                            
                                                        }
                                                    }
                                                    catch{
                                                        var opponentGameResult = null;
                                                        var stopHere = "";
                                                    }
                                                     
                                                    try{
                                                        if(rat==0){
                                                        var arr = [];
                                                        averageRecords = await load("averageRecords","AnalysisData/" + (year.year_id-1));
                                                        var opponentAverage = averageRecords.filter(function(item){return item.team == away_name});
                                                        var opponentAvg = opponentAverage[opponentAverage.length-1];
                                                        arr.push(opponentAvg);
                                                        opponentAverage = arr;
                                                        }
                                                        else{
                                                            var arr = [];
                                                            averageRecords = await load("averageRecords","AnalysisData/" + (year.year_id));
                                                            var opponentAverage = averageRecords.filter(function(item){return item.team == away_name});
                                                            var opponentAvg = opponentAverage[rat-1];
                                                            if((rat-1) ==0 )
                                                                {
                                                                    opponentAvg = opponentGameResult;
                                                                }
                                                            arr.push(opponentAvg);
                                                            opponentAverage = arr;
                                                        }
                                                    }
                                                    catch{
                                                        var opponentAverage = [];
                                                    }

                                                   var homeTeam = home_name;
                                                   var awayTeam = away_name;
                                                   var key = awayTeam.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '')+ "@" + homeTeam.replace(/\s+/g, '').replace(/\(\d{1,2}\)/, '') + "@" + schedule_name;
                                                   var record = {key:key, date: schedule_name,homeTeam:homeTeam, awayTeam:awayTeam};
                                                   var gameRecord =[];
                                                   gameRecord.push(record);

                                                if(gameRecord.length > 0 && selectedAverage.length > 0 && selectedGameResult && opponentAverage.length > 0 && opponentGameResult)
                                                {
                                                    var MLRecord = {};
                                                    MLRecord.key = gameRecord[0].key;
                                                    MLRecord.date = gameRecord[0].date;
                                                    if(!toBeEvaluated){
                                                        MLRecord.isHomeWinner = gameRecord[0].isHomeWinner;
                                                        //MLRecord.scoreDiff = gameRecord[0].scoreDiff;
                                                    }
                                                    else{
                                                        MLRecord.isHomeWinner = 0;
                                                        //MLRecord.scoreDiff = 0;
                                                    }
                                                    MLRecord.homeTeam = gameRecord[0].homeTeam;
                                                    MLRecord.awayTeam = gameRecord[0].awayTeam;
                                                    //var homeRecords = gameRecord[0].homeTeam == selectedGameResult.team ? selectedGameResult : opponentGameResult;
                                                    //MLRecord = appendProperties(MLRecord, homeRecords, "home");
                                                    //var awayRecords = gameRecord[0].awayTeam == opponentGameResult.team ? opponentGameResult : selectedGameResult;
                                                    //MLRecord = appendProperties(MLRecord, awayRecords, "away");
                                                    var homeAverageRecords = gameRecord[0].homeTeam == selectedAverage[0].team ? selectedAverage[0] : opponentAverage[0];
                                                    MLRecord = appendProperties(MLRecord, homeAverageRecords, "homeAvg");
                                                    var awayAverageRecords = gameRecord[0].awayTeam == opponentAverage[0].team ? opponentAverage[0] : selectedAverage[0];
                                                    MLRecord = appendProperties(MLRecord, awayAverageRecords, "awayAvg");
                                                    var stopHere = ""
                                                    var isThere = MLData.filter(function(item){return item.key == MLRecord.key });
                                                    if(isThere.length == 0){
                                                        MLData.push(MLRecord);
                                                        if(!toBeEvaluated){
                                                            await save(yearToProcess+"MLData",MLData, function(){}, "replace" ,"AnalysisData");
                                                        }
                                                        else{
                                                            await save(yearToProcess+"MLDataToEvaluate",MLData, function(){}, "replace" ,"AnalysisData");
                                                        }
                                                    }
                                                }
                                                else{
                                                    var stopHere = "";
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
        }

        function extractTextBetween(inputString) {
            const regex = /\d{4}-\d{2}-\d{2}-(.*)\.html/;
            const match = inputString.match(regex);
        
            if (match && match[1]) {
                return match[1];
            } else {
                return null; // Return null if no match is found
            }
        }

        async function generateAverages(yearToProcess)
        {
           console.log("Averaging data for: "+ yearToProcess);
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
              if(team == "Florida_Atlantic" || team == "FloridaAtlantic")
              {
                var stopHere = "";
              }
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
            console.log("Formatting data for: "+ yearToProcess);
            var data = await load("gameRecords","AnalysisData/"+yearToProcess);
            try{
                var formatedRecords = await load("formatedRecords","AnalysisData/"+yearToProcess);
            }
            catch{
                var formatedRecords = [];
            }
            var homeTeams = data.map(function(item){
                return item.homeTeam;
            });
            var awayTeams = data.map(function(item){
                return item.awayTeam;
            });

            var teams = homeTeams.concat(awayTeams);
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
                console.log("Preparing data for: "+ yearToProcess);
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
                                                if(school_name == "TexasTech" || school_name == "Texas_Tech")
                                                {
                                                    var stopHere = "";
                                                }
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
                data.totalPoints = Math.abs(data.homeFinalScore + data.awayFinalScore);
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
                            if(tableId  && tableId == "team_stats"){
                                await driver.executeScript(await JSgetTableDetails(tableId)).then(function(return_value) {
                                    console.log(return_value);
                                    data = JSON.parse(return_value);
                                });  
                                var name = fileName != tableId ? fileName+"_"+tableId : fileName;
                                await save(name, data,function(){}, "replace", foldername);
                            }
                            else if(!tableId){
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
                    try{
                        const searchText2 = "We apologize, but we could not find the page requested by your device";
                        let paragraph2 = await driver.findElement(By.xpath(`//p[contains(text(), "${searchText2}")]`));
                        if (paragraph2) {
                            exceptions.push(url);
                            await save("exceptions", exceptions, function(){}, "replace", "BaseData");
                        }
                    }
                    catch{}
                    const searchText3 = "Cancelled";
                        let paragraph2 = await driver.findElement(By.xpath(`//div[contains(text(), "${searchText3}")]`));
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
                        if(!isNaN(isYear) /*&& (isYear == 2023)*/){ //&& isYear != 2020 && isYear != 2004 && isYear != 2000 && isYear != 1987 && isYear != 1989 && isYear != 1985 && isYear != 1984 && isYear != 1983){
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
                                                if(school_name == "Texas_Tech")
                                                {
                                                    var stopHere = "";
                                                }
                                            }
                                            catch(Ex){
                                        
                                            }
                                            
                                            if(schedules.length > 0){
                                                for (let rat = 0; rat < schedules.length; rat++) {
                                                    const schedule = schedules[rat];
                                                    var schedule_name = schedule.date_game.replace(" ","_").replace(" ","_").replace(",","");
                                                    var isProcessed = false;
                                                    try{
                                                        // try{
                                                            isProcessed = await load(schedule_name + "_team_stats", year.year_id+"/"+"Conferences"+"/"+school_name +"/Games") ? true : false;
                                                            isProcessed = await load(schedule_name + "_results", year.year_id+"/"+"Conferences"+"/"+school_name +"/Games");
                                                            
                                                            //console.log(isProcessed.away.team);
                                                            if(isProcessed.away.team == "")
                                                            {
                                                                var stopHere = "";
                                                            }
                                                            isProcessed = isProcessed.away.team == "" ? false : true;
                                                            if(!isProcessed){
                                                                throw new Error("reprocess");
                                                            }
                                                        // }
                                                        // catch{
                                                            
                                                        // }
                                                    }
                                                    catch(Ex){
                                                        if(schedule.date_gameLink && (schedule.date_gameLink.indexOf("2024-") < 0)){//} || schedule.date_gameLink.indexOf("2024-09-0") >= 0 ) && (schedule.date_gameLink.indexOf("2024-09-07") < 0 && schedule.date_gameLink.indexOf("2024-09-06") < 0 ) ){
                                                            var isException = exceptions.filter(function(item){return item == schedule.date_gameLink });
                                                            if(!isProcessed && schedule.date_gameLink && isException.length == 0){
                                                                processing = processing + await getTableData(schedule.date_gameLink , schedule_name, year.year_id+"/"+"Conferences"+"/"+school_name+"/Games");
                                                                // if(processing == 1)
                                                                // {
                                                                //     throw new Error("Restart");
                                                                // }
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
    var script = "var resultTable = document.getElementsByClassName('linescore nohover stats_table no_freeze')[0].getElementsByTagName('td');";
script += "if(resultTable.length == 14){					";
script += "	var result = {                                  ";
script += "		'home': {                                   ";
script += "			'team': resultTable[1].innerText,       ";
script += "			'Q1': resultTable[2].innerText,         ";
script += "			'Q2': resultTable[3].innerText,         ";
script += "			'Q3': resultTable[4].innerText,         ";
script += "			'Q4': resultTable[5].innerText,         ";
script += "			'Final': resultTable[6].innerText       ";
script += "		},                                          ";
script += "		'away': {                                   ";
script += "			'team': resultTable[8].innerText,       ";
script += "			'Q1': resultTable[9].innerText,         ";
script += "			'Q2': resultTable[10].innerText,        ";
script += "			'Q3': resultTable[11].innerText,        ";
script += "			'Q4': resultTable[12].innerText,        ";
script += "			'Final': resultTable[13].innerText      ";
script += "		}                                           ";
script += "	};                                              ";
script += "}else if(resultTable.length == 16){                 ";
script += "	var result = {                                  ";
script += "		'home': {                                   ";
script += "			'team': resultTable[1].innerText,       ";
script += "			'Q1': resultTable[2].innerText,         ";
script += "			'Q2': resultTable[3].innerText,         ";
script += "			'Q3': resultTable[4].innerText,         ";
script += "			'Q4': resultTable[5].innerText,         ";
script += "			'QT1': resultTable[6].innerText,        ";
script += "			'Final': resultTable[7].innerText       ";
script += "		},                                          ";
script += "		'away': {                                   ";
script += "			'team': resultTable[9].innerText,       ";
script += "			'Q1': resultTable[10].innerText,        ";
script += "			'Q2': resultTable[11].innerText,        ";
script += "			'Q3': resultTable[12].innerText,        ";
script += "			'Q4': resultTable[13].innerText,        ";
script += "			'OT1': resultTable[14].innerText,       ";
script += "			'Final': resultTable[15].innerText      ";
script += "		}                                           ";
script += "	};                                              ";
script += "}else if(resultTable.length == 18){                 ";
script += "	var result = {                                  ";
script += "		'home': {                                   ";
script += "			'team': resultTable[1].innerText,       ";
script += "			'Q1': resultTable[2].innerText,         ";
script += "			'Q2': resultTable[3].innerText,         ";
script += "			'Q3': resultTable[4].innerText,         ";
script += "			'Q4': resultTable[5].innerText,         ";
script += "			'QT1': resultTable[6].innerText,        ";
script += "			'QT2': resultTable[7].innerText,        ";
script += "			'Final': resultTable[8].innerText       ";
script += "		},                                          ";
script += "		'away': {                                   ";
script += "			'team': resultTable[10].innerText,      ";
script += "			'Q1': resultTable[11].innerText,        ";
script += "			'Q2': resultTable[12].innerText,        ";
script += "			'Q3': resultTable[13].innerText,        ";
script += "			'Q4': resultTable[14].innerText,        ";
script += "			'OT1': resultTable[15].innerText,       ";
script += "			'OT2': resultTable[16].innerText,       ";
script += "			'Final': resultTable[17].innerText      ";
script += "		}                                           ";
script += "	};                                              ";
script += "}                                                ";
script += "return JSON.stringify(result);                   ";
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

async function JSgetHandicapData()
{
    var teams = document.getElementsByClassName("sac-ParticipantFixtureDetailsHigherAmericanFootball_TeamWrapper");

    var handicaps = document.getElementsByClassName("sac-ParticipantCenteredStacked50OTB_Handicap");
    var initialUnderIndex = handicaps.length/2;
    var handicapData = [];
    for(var i=0; i< teams.length; i++)
    {
      var handicap ={ team:teams[i].innerText, handicap:handicaps[i].innerText, overUnder:handicaps[initialUnderIndex].innerText};
      handicapData.push(handicap);
        initialUnderIndex++;
    }
    var jdata = JSON.stringify(handicapData);
    console.log(jdata);
}