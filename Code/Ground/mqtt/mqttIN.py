import paho.mqtt.client as mqtt
import sqlite3
from sqlite3 import Error
from pathlib import Path
import json

clientID = "PiBase"
brokerAddress = "localhost"  # TODO CHANGE THIS
clientTopic = "air/qual"
db = None
dbFile = Path(__file__).parent / "../db/airData.db"
createTableSQL = """ create table if not exists airQuality (
                        timecode INTEGER PRIMARY KEY,
                        temperature REAL NOT NULL,
                        humidity REAL NOT NULL,
                        TVOC REAL,
                        eCO2 REAL,
                        rawH2 REAL,
                        rawEthanol REAL,
                        spm1_0 REAL,
                        spm2_5 REAL,
                        spm10 REAL,
                        ae1_0 REAL,
                        ae2_5 REAL,
                        ae10 REAL
                        ); """


def connectDB(db_file):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        print("Connected to db via SQLite v" + sqlite3.version)
    except Error as e:
        print(e)
    return conn


def createTable(connection, schema):
    try:
        c = connection.cursor()
        c.execute(schema)
    except Error as e:
        print(e)


def insertAirData(connection, dataAsTask):
    try:
        sql = """INSERT INTO airQuality(timecode, temperature, humidity, TVOC, eCO2, rawH2, rawEthanol, spm1_0, spm2_5, spm10, ae1_0, ae2_5, ae10)
                    VALUES(unixepoch('now'),?,?,?,?,?,?,?,?,?,?,?,?)"""
        cur = connection.cursor()
        print(dataAsTask)
        cur.execute(sql, dataAsTask)
        connection.commit()
        print("commit success!!")
    except Error as e:
        print(e)


def dataCallback(client, userData, message):
    # print(message.payload.decode("utf-8"))
    jsonData = json.loads(message.payload.decode('utf-8'))
    # print(jsonData)
    sqlData = (jsonData['temperature'], jsonData['humidity'], jsonData['TVOC'], jsonData['eCO2'], jsonData['rawH2'], jsonData['rawEthanol'], jsonData['PM']
               ['SPM1.0'], jsonData['PM']['SPM2.5'], jsonData['PM']['SPM10'], jsonData['PM']['AE1.0'], jsonData['PM']['AE2.5'], jsonData['PM']['AE10'])
    insertAirData(db, sqlData)


if __name__ == '__main__':
    db = connectDB(dbFile)
    print(db)
    createTable(db, createTableSQL)

    mqttClient = mqtt.Client(clientID)
    mqttClient.connect(brokerAddress)
    mqttClient.subscribe(clientTopic)
    mqttClient.on_message = dataCallback
    mqttClient.loop_forever()
