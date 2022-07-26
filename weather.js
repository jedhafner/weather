const search = document.getElementById("search");
const display = document.getElementsByClassName("display")[0];
const imperial = document.getElementById("imperial");
const windDirection = document.getElementById('windDirection');


//checks DOM to see which unit type is selected (imperial vs metric)
function getUnits(){
    if (standard.checked){
        let units={type:'metric',distance:'km',velocity:'km/h'};
        return units;
    } else {
        let units = {type:'imperial', distance:'miles',velocity:'mph'};
        return units;
    }
    return units;
}
//hits API and returns weatherObject
async function hitWeatherAPI(){
    let locale = document.getElementById("where").value;
    const key = 'e99402f7bff435eb835d69fa748eee0d';
    let units = getUnits();
    let path = `http://api.openweathermap.org/data/2.5/weather?q=${locale}&APPID=${key}&units=${units.type}`;
    const response = await fetch(path, {mode: 'cors'});
    const weatherObject = await response.json();
    return(weatherObject);
}
async function fiveDayAPI(){
    let weather = await hitWeatherAPI();

    let lat = weather.coord.lat;
    let lon = weather.coord.lon;

    let units = getUnits();
    const key = 'e99402f7bff435eb835d69fa748eee0d';
    let path = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=${units.type}`;
    const response = await fetch(path, {mode: 'cors'});
    const fiveDayObject = await response.json();
    console.log(fiveDayObject);
    return(fiveDayObject);
}
//converts hitWeatherAPI object visibility for imperial/metric units
function getVisibility(objectVis){
    let units = getUnits();
    let visibility;
    if (units.type === 'metric'){
        visibility = Math.round(objectVis/1000);
    } else {
        visibility = Math.round(objectVis/1609.344);
            }
    return visibility;
}
//uses hitWeatherAPI wind deg to rotate compass SVG, indicating wind direction.
function getWindDeg(objectWindDeg){
    windDirection.style.transform=`rotate(${objectWindDeg}deg)`;
    console.log('wind');
}
//uses hitWeatherAPI wind deg to generate wind direction desciption.
function getWindDesc(deg){
    let windDesc;
    let step = 90;
    let rose = Math.ceil(deg/step);
    let right = deg%step;

    console.log(right);
    console.log(rose);

    if (right == 0){
        switch(right){
            case 0:
                windDesc = 'N';
                break;
            case 1:
                windDesc = 'E';
                break;
            case 2:
                windDesc = 'S';
                break;
            case 3:
                windDesc = 'W';
                break;
        }
    } else {
        switch(rose){
            case 1:
                windDesc = 'NE';
                break;
            case 2:
                windDesc = 'SE';
                break;
            case 3:
                windDesc = 'SW';
                break;
            case 4:
                windDesc = 'NW';
                break;
        }
    }
    return windDesc;
};
//Finds timezone difference between client and search locale (in hours)
function getTzDiffHours(timezone){
    let clientTzOffset = new Date().getTimezoneOffset();
    let searchTzOffset = timezone/60;
    //subtract tzAdjustHours from hours to get search locale time;
    let tzDiffHours = (clientTzOffset+searchTzOffset)/60;
    return tzDiffHours
};
//takes a timestamp and returns a string of local or client time (i.e. where)
function getTime(timestamp,timezone,location){
    let ts = timestamp*1000;

    //don't forget! using Date() returns a date/time object in reference to the client tz. (e.g. a NYC timestamp for 8pm will become 5pm if client is in LA)
    let date = new Date(ts);

    let hours = date.getHours();
    let minutes = date.getMinutes();
    //write code to output minutes in MM format.
    if (minutes<10){
        minutes=`0${minutes}`;
    } else {};

    let timeLoc = location;
    if(timeLoc === 'locale'){
        hours += getTzDiffHours(timezone);
        if (hours>24){
            hours -= 24;
        } else if (hours<0) {
            hours +=24;
        } else {
        }
    } else {
    }
    let time = `${hours}:${minutes}`;
    return time;
};
function timeTilSun(sunrise, sunset){
    let timeTil=[];
    let now = Date.now()/1000;
    console.log(sunset);
    let hoursTilRise = (sunrise-now)/3600;
    let hoursTilSet = (sunset-now)/3600;

    if(hoursTilSet>0){
        timeTil.push(hoursTilSet);
        timeTil.push('sunset');
    }else{
        timeTil.push(hoursTilRise+24);
        timeTil.push('sunrise');
    };
    let mins = Math.round((timeTil[0]%1)*60);
    let hours = Math.floor(timeTil[0]);

    timeTil.splice(0,1,hours);
    timeTil.splice(1,0,mins);

    return timeTil;
}
//displays weather in DOM;
async function displayCurrentWeather(){
    let units=getUnits();

    let weather = await hitWeatherAPI();
    console.log(weather);
    let temp = Math.round(weather.main.temp);
    let feelsLike = Math.round(weather.main.feels_like);
    let vis = getVisibility(weather.visibility);
    let windSpeed = Math.round(weather.wind.speed);
    let windDir = getWindDesc(weather.wind.deg);
    let sunset =  getTime(weather.sys.sunset,weather.timezone,'locale');
    let sunrise =  getTime(weather.sys.sunrise,weather.timezone,'locale');
    let timeTil = timeTilSun(weather.sys.sunrise,weather.sys.sunset);

    getWindDeg(weather.wind.deg);

    let weatherIcon=weather.weather[0].icon;
    let weatherDesc=weather.weather[0].description;
    
    document.getElementById('weatherDesc').textContent= weatherDesc;
    document.getElementById('weatherIcon').style.display='flex';
    document.getElementById('weatherIcon').src=`https://openweathermap.org/img/wn/${weatherIcon}@2x.png`

    document.getElementById('timeTil').textContent=`${timeTil[0]}h ${timeTil[1]}m`;
    document.getElementById('riseOrSet').textContent=`to ${timeTil[2]}`;
    
    function lightOrDark(timeTil){
        let parent = document.getElementsByClassName('light')[0];
        if (timeTil[2]=='sunrise'){
            parent.style.background = 'black';
        } else{
            parent.style.background = 'skyblue';
        }
    }
    lightOrDark(timeTil);

    document.getElementById('temp').textContent=`${temp}°`;
    document.getElementById('feelsLike').textContent=`feels like: ${feelsLike}°`;
    document.getElementById('visibility').textContent=`visibility: ${vis} ${units.distance}`;
    document.getElementById('windSpeed').textContent=`${windSpeed}${units.velocity} ${windDir}`;

    //show the parent element
    display.style.display='grid';
}
async function getDailyForecast(){
    //set up arrays to collect data for each day in forecast from the hour data:
    const day1=[];
    const day2=[];
    const day3=[];
    const day4=[];
    const day5=[];
    const day6=[];
    const days = [day1,day2,day3,day4,day5,day6];

    let units = getUnits();

    let currentWeather = await hitWeatherAPI();
    console.log(currentWeather);

    let forecast = await fiveDayAPI();
    console.log('daily')
    let hours = forecast.list;

    //set the client timestamp. What this mean: this gives a unix timestamp with the timezone offset figurerd in.
    const today = new Date()
    let timezone =today.getTimezoneOffset()*60;
    let clientTimestamp = today.getTime()/1000;
    const secsInDay = 86400;
    let clientDay = Math.floor(clientTimestamp/secsInDay);
    let weekday = today.getDay();
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    //set locale timestamp
    let UTCtimestamp = currentWeather.dt;
    let localeTimezone = currentWeather.timezone;
    let localDay = UTCtimestamp+localeTimezone;
    const localeDay = Math.floor(localDay/secsInDay);

    //add weekday to days array. Maybe make this its own function;
    //find day of week at locale
    let localeWeekday = weekday+(localeDay-clientDay);

    function getWeekday(established,diff){
        let weekdayNum = established+diff;
        if(weekdayNum>6){
            weekdayNum-=7;
        }else{
        }
        return weekdays[weekdayNum];
    };

    for (i=0;i<days.length;i++){
        let dayX=days[i]
        let weekday = getWeekday(localeWeekday,i);
        dayX.push(weekday);
    };
    //find date in list
    for (i=0; i<hours.length; i++){
        let hour = hours[i];
        hourDateTime = hour.dt+localeTimezone;
        let hourDay = Math.floor(hourDateTime/secsInDay);
    
        //compare date in list
        let dayDiff = hourDay-localeDay;

        let forecastData = [hour.main.temp,hour.pop,hour.weather[0].id]
        //adds data from hour to the appropriate day where it can be averaged.
        switch(dayDiff){
            case 0:
                day1.push(forecastData);
                break;
            case 1:
                day2.push(forecastData);
                break;
            case 2:
                day3.push(forecastData);
                break;
            case 3:
                day4.push(forecastData);
                break;
            case 4:
                day5.push(forecastData);
                break;
            case 5:
                day6.push(forecastData);
                break;
            default:
                console.log('something went wrong');
        };
    };
    return days;
};

async function displayDailyForecast(){
    const days = await getDailyForecast();
    const dailyForecasts = [];

    const daily=document.getElementsByClassName('daily')[0]

    while(daily.firstChild){
        daily.removeChild(daily.firstChild)
    };

    function dataManager(dataArray){
        let dailyForecast = [];
        dailyForecast.push(dataArray[0]);

        let dailyTemps=[];
        let dailyPop=[];
        let dailyCond=[];

        for (j=1; j<dataArray.length; j++){
            let hourMeasurements = dataArray[j]
            dailyTemps.push(hourMeasurements[0])
            dailyPop.push(hourMeasurements[1])
            dailyCond.push(hourMeasurements[2])
        }
        
        dailyForecast.push(Math.max(...dailyTemps));
        dailyForecast.push(Math.min(...dailyTemps));
        dailyForecast.push(Math.max(...dailyPop));

        function avgCond(condArray){
            let sum=0;
            for (let i=0;i<condArray.length;i++){
                sum+=condArray[i];
            }
            let avg = sum/condArray.length;
            console.log(`avgCond running!`);
            return avg;
        }
        dailyForecast.push(avgCond(dailyCond));
        dailyForecasts.push(dailyForecast);
    };
    //populates dailyForecasts array with daily data and weekday
    for (i=0;i<days.length;i++){
        dataManager(days[i]);
    }; 

    for (i=0; i<dailyForecasts.length;i++){
        let dailyForecast = dailyForecasts[i];
        console.log(dailyForecast);

        let day = document.createElement('div');
        day.className='day';

        let wkDay  = document.createElement('div');
        wkDay.className = 'wkDay';
        wkDay.textContent= dailyForecast[0];

        let hiTemp = document.createElement('div');
        hiTemp.className='hiTemp';
        hiTemp.textContent=`${Math.round(dailyForecast[1])}°`;

        let loTemp = document.createElement('div');
        loTemp.className='loTemp';
        loTemp.textContent=`${Math.round(dailyForecast[2])}°`;

        let hiLo=document.createElement('div');
        hiLo.id = 'hiLo';
        
        let pop = document.createElement('div');
        pop.className='pop';
        pop.textContent=`${Math.round(dailyForecast[3])}%`;

        let iconDiv = document.createElement('img');
        iconDiv.className="weatherIcon";
        function getIcon(avgCond){
            console.log(`getIcon running!`)
            let icon;
            if (avgCond<300){
                icon = '11d';
            } else if(avgCond<500 || (avgCond<505 &&avgCond<600)){
                icon = '09d';
            } else if(avgCond<505){
                icon = '10d';
            } else if(avgCond<700){
                icon = '50d';
            } else if(avgCond===800){
                icon = '01d';
            } else if (avgCond<802){
                icon = '02d';
            } else if (avgCond==802){
                icon = '03d';
            } else {
                icon = '04d';
            }
            return icon;
            }
        let weatherIcon = getIcon(dailyForecast[4]);
        iconDiv.src=`https://openweathermap.org/img/wn/${weatherIcon}.png`;

        day.appendChild(wkDay);
        day.appendChild(hiLo);
        hiLo.appendChild(loTemp);
        hiLo.appendChild(hiTemp);
        day.appendChild(iconDiv);
        day.appendChild(pop);

        daily.appendChild(day);
    };
};
async function displayHourlyForecast(){
    let units=getUnits();
    let weather = await fiveDayAPI();
    let hours = weather.list;

    let hourly = document.getElementsByClassName('hourly')[0];
    const days = hourly.childNodes;

    while(hourly.firstChild){
        hourly.removeChild(hourly.firstChild)
    };

    for (i=0; i<8; i++){
        let hour = hours[i];
        let time = getTime(hour.dt, weather.city.timezone,'locale');
        let weatherIcon = hour.weather[0].icon;
        let temp = Math.round(hour.main.temp);
        let pop = hour.pop;

        let hourDiv = document.createElement('div');
        hourDiv.className='hour';
        hourly.appendChild(hourDiv);

        //could simplify this with a loop, maybe
        let dayTemp = document.createElement('div');
        dayTemp.className='dayTemp';
        dayTemp.textContent = `${temp}°`;

        let hourOfDay = document.createElement('div');
        hourOfDay.textContent=`${time}`;
        hourOfDay.className="hourOfDay";
        let popDiv= document.createElement('div');
        popDiv.className="pop";
        popDiv.textContent=`${Math.round(pop*100)}%`;
        let iconDiv = document.createElement('img');
        iconDiv.className="weatherIcon";
        iconDiv.src=`https://openweathermap.org/img/wn/${weatherIcon}.png`;

        hourDiv.appendChild(hourOfDay);
        hourDiv.appendChild(dayTemp);
        hourDiv.appendChild(iconDiv);
        hourDiv.appendChild(popDiv);
    }
}
//manages Go! search button
search.onclick = (event) => {
    console.log("button clicked.");
    displayCurrentWeather();
    fiveDayAPI();
    displayHourlyForecast();
    displayDailyForecast();
};
//listens for 'enter' key push
document.body.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        displayCurrentWeather();
        fiveDayAPI();
        displayHourlyForecast();
        displayDailyForecast();
    }
});
//manages unit selection
const unitSelecta = document.getElementById('unitSelecta');
unitSelecta.addEventListener('change',function(){
displayCurrentWeather();
fiveDayAPI();
displayHourlyForecast();
displayDailyForecast();
});

//Add any styling you like!

//search for specific location
//display temperature in fahrenheit
//display temperature in celsius

//hits API and returns weatherObject