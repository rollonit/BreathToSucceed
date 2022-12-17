

let data = '[{"timecode":1671009439,"temperature":23.89999962,"humidity":28.20000076,"TVOC":66,"eCO2":400,"rawH2":13614,"rawEthanol":18880,"spm1_0":8,"spm2_5":11,"spm10":11,"ae1_0":8,"ae2_5":11,"ae10":11},{"timecode":1671009440,"temperature":23.89999962,"humidity":28.10000038,"TVOC":60,"eCO2":400,"rawH2":13610,"rawEthanol":18875,"spm1_0":8,"spm2_5":11,"spm10":11,"ae1_0":8,"ae2_5":11,"ae10":11},{"timecode":1671009442,"temperature":23.89999962,"humidity":28.10000038,"TVOC":64,"eCO2":400,"rawH2":13610,"rawEthanol":18872,"spm1_0":8,"spm2_5":11,"spm10":11,"ae1_0":8,"ae2_5":11,"ae10":11}]'
idealValues = '[{"temperatureMin":18,"temperatureMax":22,"humidityMin":40, "humidityMax":70,"TVOCMin":36,"TVOCMax":66, "eCO2Min":400,"eCO2Max":600,"rawH2Min":1000,"rawH2Max":15000,"rawEthanolMin":20000,"rawEthanolMax":20000,"spm1_0Min":7,"spm1_0Max":9,"spm2_5Min":10,"spm2_5Max":14,"spm10Min":10,"spm10Max":15,"ae1_0Min":6,"ae1_0Max":10,"ae2_5Min":10,"ae2_5Max":16,"ae10Min":18,"ae10Max":18}]'
/*fetch('./idealValues.json')
    .then((response) => response.json())
    .then((json) =>{idealValues = json});*/

idealValues = JSON.parse(idealValues)


//im file hesch denn anstatt d 'onload funktion das grad ide Response ihne chasch eifach "data" mmit de response variable ersetze
// je nach dem mümmers json no umformatiere aber so vill theorie chani au ned zum das eif sege chönne hahaah
window.onload = function () {

    fetch('http://localhost:8000/data', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "timeStart": 1671009438, "timeEnd": 1671009540 })
    })
        .then(response => response.json())
        .then(response => buildTable(JSON.stringify(response)))




}

function buildTable(data) {
    var obj = JSON.parse(data)
    tableHead = "<thead><tr>"
    tableBody = "<tbody>"

    //here we are going through all the datasets one by one
    for (let i = 0; i < obj.length; i++) {
        //m(measurement) equals one measurement with all the parameters
        let m = obj[i];


        //goes through all keys and adds a table header the first time
        tableHead += "<th>" + formatTimecode(obj[i]["timecode"]) + "</th><th>Value</th><th>Minimal Value</th><th>Maximal Value</th><th>Instruction</th>"


        for (key in obj[i]) {
            if (key != "timecode") {
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

function formatTimecode(timecode) {
    var a = new Date(timecode * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

function displayIdealValues(obj, key) {
    minVal = idealValues[0][key + "Min"];
    maxVal = idealValues[0][key + "Max"];
    var instruction = "Test";

    if (obj[key] <= minVal || obj[key] >= maxVal) {
        console.log(idealValues[0]["temperatureMin"] + " - " + obj["temperature"]);
        tableBody += "<tr class='danger'>"
    } else {

        tableBody += "<tr class='success'>"
    }
    tableBody += "<th>" + key + "</th>"

    if (key == "temperature" || key == "humidity") {
        tableBody += "<td>" + Number(obj[key]).toFixed(2) + "</td>"
    } else {
        tableBody += "<td>" + obj[key] + "</td>"
    }

    tableBody += "<td>" + minVal + "</td><td>" + maxVal + "</td><td>" + instruction + "</td>"

}

/*function createAccurateInstruction(obj, key){
    instruction = "Test Text";
    console.log("hello - " + idealValues[0]["temperatureMin"] + "// " + instruction);
    switch(key){
        case "temperature":
            //console.log("result: " + obj[0]["temperature"]);
            if(obj["temperature"] <= idealValues["temperatureMin"]){
                instruction = "Check the heating system. It's too cold.";
                console.log("1");
            }
            if(obj["temperature"]>= idealValues["temperatureMax"]){
                instruction = "Check the ventilation system. It's getting to warm for optimal performance."
                console.log("2");
            }
        break;
        case "humidity":
            console.log("Hum Case");
            if(obj["humidity"] <= idealValues["humidityMin"]){
                instruction = "Check the heating system. It's too cold.";
            }
            if(obj["humidity"]>= idealValues["humidityMax"]){
                instruction = "Check the ventilation system. It's getting to warm for optimal performance."
            }
        break;
    }
    return instruction;
   
}*/