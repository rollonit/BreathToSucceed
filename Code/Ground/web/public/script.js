
idealValues = JSON.parse('[{"temperatureMin":18,"temperatureMax":22,"humidityMin":40, "humidityMax":70,"TVOCMin":0,"TVOCMax":200, "eCO2Min":0,"eCO2Max":600,"rawH2Min":900,"rawH2Max":4100,"rawEthanolMin":0,"rawEthanolMax":20000,"spm1_0Min":0,"spm1_0Max":15,"spm2_5Min":0,"spm2_5Max":15,"spm10Min":0,"spm10Max":15,"ae1_0Min":6,"ae1_0Max":10,"ae2_5Min":10,"ae2_5Max":16,"ae10Min":18,"ae10Max":18}]')

window.onload = loadResponse();
window.addEventListener('load', function(){
    var fetchInterval = 30000;
    this.setInterval(loadResponse, fetchInterval);
    
})

function loadResponse(){
    fetch('http://localhost:8000/latest', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
})

.then(response => response.json())
.then(response => buildTable(JSON.stringify(response)))

console.log("another load");}

function buildTable(data){
    var obj = JSON.parse(data)
    tableHead = "<thead><tr>"
    tableBody = "<tbody>"

    //here we are going through all the datasets one by one
    for(let i = 0; i < obj.length; i++) {
        //m(measurement) equals one measurement with all the parameters
        let m = obj[i];


        //goes through all keys and adds a table header the first time
        tableHead += "<th>" + formatTimecode(obj[i]["timecode"]) + "</th><th>Value</th><th>Minimal Value</th><th>Maximal Value</th><th>Instruction</th>"
        

        for(key in obj[i]){
            if(key != "timecode"){
                //access to the retrieved data and compare with ideal values
                displayIdealValues(obj[i], key);
            }
        }
        break
    }

    //fill variables with html structure and put it together as a string to use
    tableHead += "</tr></thead>"
    tableBody += "</tbody>"
    table = "<table class='table'>" + tableHead + tableBody + "</table>"
    //creates a div with raw html table
    document.getElementById("table").innerHTML = table;

}

function formatTimecode(timecode){
    var a = new Date(timecode * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

function displayIdealValues(obj, key){
    minVal = idealValues[0][key+"Min"];
    maxVal = idealValues[0][key+"Max"];
    var instruction = "Test";

    if(obj[key] < minVal || obj[key] > maxVal){
        tableBody += "<tr class='danger'>"
    }else{

        tableBody += "<tr class='success'>"
    }
    tableBody += "<th>"+key+"</th>"

    if(key == "temperature" || key == "humidity"){
        tableBody += "<td>" + Number(obj[key]).toFixed(2) + "</td>"
    }else{
        tableBody += "<td>" + obj[key] + "</td>"
    }

    switch(key){
        case "temperature":
            if(obj["temperature"] < idealValues[0]["temperatureMin"]){
                instruction = "Check the heating system. It's too cold.";
            }
            else if(obj["temperature"] > idealValues[0]["temperatureMax"]){
                instruction = "Check the ventilation system. It's getting to warm for optimal performance."
            }
            else instruction="";
        break;
        case "humidity":
            if(obj["humidity"] < idealValues[0]["humidityMin"]){
                instruction = "The air is too dry. Check the ventilation, buy plants or get a humidifier.";
            }
            else if(obj["humidity"] > idealValues[0]["humidityMax"]){
                instruction = "The air is too humid. Please open the windows. Check air conditioner if the humidity is always high."
            }
            else instruction = "";
        break;
        case "TVOC":
            if(obj["TVOC"] < idealValues[0]["TVOCMin"]){
                instruction = "";
            }
            else if(obj["TVOC"] > idealValues[0]["TVOCMax"]){
                instruction = "The TVOC level is too high. Open all the windows to make sure the air quality improves."
            }
            else instruction = "";
        break;
        case "eCO2":
            if(obj["eCO2"] <= idealValues[0]["eCO2Min"]){
                instruction = "";
            }
            else if(obj["eCO2"]>= idealValues[0]["eCO2Max"]){
                instruction = "Open the window until the value is under 600ppm again. If it is very high - leave the room for some minutes."
            }
            else instruction = "";
        break;
        case "rawH2":
            if(obj["rawH2"] <= idealValues[0]["rawH2Min"]){
                instruction = "";
            }
            else if(obj["rawH2"]>= idealValues[0]["rawH2Max"]){
                instruction = ""
            }
            else instruction = "";
        break;
        case "rawEthanol":
            if(obj["rawEthanol"] <= idealValues[0]["rawEthanolMin"]){
                instruction = "";
            }
            else if(obj["rawEthanol"]>= idealValues[0]["rawEthanolMax"]){
                instruction = ""
            }
            else instruction = "";
        break;
        case "spm1_0":
            if(obj["spm1_0"] <= idealValues[0]["spm1_0Min"]){
                instruction = "";
            }
            else if(obj["spm1_0"]>= idealValues[0]["spm1_0Max"]){
                instruction = "Open the window to optimize the air quality in the"
            }
            else instruction = "";
        break;
        case "spm2_5":
            if(obj["spm2_5"] <= idealValues[0]["spm2_5Min"]){
                instruction = "";
            }
            else if(obj["spm2_5"]>= idealValues[0]["spm2_5Max"]){
                instruction = "Open the window to optimize the air quality in the room."
            }
            else instruction = "";
        break;
        case "spm10":
            if(obj["spm10"] <= idealValues[0]["spm10Min"]){
                instruction = "";
            }
            else if(obj["spm10"]>= idealValues[0]["spm10Max"]){
                instruction = "Open the window to optimize the air quality in the room."
            }
            else instruction = "";
        break;
        case "ae1_0":
            if(obj["ae1_0"] <= idealValues[0]["ae1_0Min"]){
                instruction = "";
            }
            else if(obj["ae1_0"]>= idealValues[0]["ae1_0Max"]){
                instruction = ""
            }
            else instruction = "";
        break;
        case "ae2_5":
            if(obj["ae2_5"] <= idealValues[0]["ae2_5Min"]){
                instruction = "";
            }
            else if(obj["ae2_5"]>= idealValues[0]["ae2_5Max"]){
                instruction = ""
            }
            else instruction = "";
        break;
        case "ae10":
            if(obj["ae10"] <= idealValues[0]["ae10"]){
                instruction = "";
            }
            else if(obj["ae10"]>= idealValues[0]["ae10"]){
                instruction = ""
            }
            else instruction = "";
        break;
    }

    tableBody += "<td>"+ minVal + "</td><td>"+ maxVal + "</td><td>"+ instruction + "</td>"
    
}