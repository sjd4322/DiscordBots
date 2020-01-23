var http = require('http');

require('dotenv').config();
const serverRequest = require('request');
const port = 3000;

//All the bs for jQuery to work on node.js
var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
var $ = jQuery = require('jquery')(window);

http.createServer(function (request, response) {
    const auth = require('./auth.json');

    //Discord connect
    const Discord = require('discord.js');
    const client = new Discord.Client();

    //Connect to mongo and create a connection
    const MongoClient = require('mongodb').MongoClient;
    //const uri = process.env.connectionString;
    const uri = require('./mongoConnection.json');
    const mongoClient = new MongoClient(uri.connectionString, { useNewUrlParser: true });
    const connection = mongoClient.connect();
    
    var express = require('express'); // Express web server framework
    var app = express();

    app.use(express.urlencoded({ useUnifiedTopology: true }));

    client.on("ready", () => {
        $.ajax({
            url: 'https://api.twitch.tv/helix/users?login=Clavaat',
            type: "GET",
            headers: {
                'Client-ID': "o87hugnzwpgqe275s3g83hptpmkea2"
            },
            success: function(baseStream) {
                var options = {
                    url: 'https://api.twitch.tv/helix/webhooks/hub',
                    method: 'POST',
                    headers: {
                        'Client-ID': "o87hugnzwpgqe275s3g83hptpmkea2",
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'hub.mode':'subscribe',
                        'hub.topic':'https://api.twitch.tv/helix/streams?user_id=' + baseStream.data[0].id,
                        'hub.callback':'http://odinpi:3000/streamChanged',
                        'hub.lease_seconds':'864000'
                    })
                };
        
                serverRequest.post(options);     
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) { 
                console.log("Status: " + textStatus); 
                console.log("Error: " + errorThrown); 
            }    
        });

    });

    // client.on("presenceUpdate", (oldUser, newUser) => {
    //     //Exclude title changes and typing
    //     if(oldUser.presence.game != null && oldUser.presence.game.streaming 
    //         && newUser.presence.clientStatus !== "desktop"
    //         && oldUser.presence.clientStatus !== "desktop"
    //         || oldUser.guild.name !== "Clavaats Server") return;
        
    //     if(oldUser.displayName === "Clavaat" && newUser.presence != null){
    //         if(newUser.presence.game != null && newUser.presence.game.streaming){
    //             client.channels.get("617196134536052737").send("test");               
    //         }
    //     }
    // });

    client.on("message", (message) => {
        if(message.channel.name === "recommendations"){
            if(message.content.startsWith("!addrec")){
                var game = message.content.substr(message.content.indexOf(" ") + 1);
                const connect = connection;
                connect.then(() => {
                    var dbo = mongoClient.db("StevesBotDb").collection("Recommendations");
                    dbo.insert({ "game" : game, "suggestedBy" : message.author.username });
                    message.channel.send(message.author.username + ", your game has been added to the list!");    
                });
            }else
            if(message.content === "!listrec"){
                const connect = connection;
                connect.then(() => {
                    var dbo = mongoClient.db("StevesBotDb").collection("Recommendations");
                    dbo.find().toArray(function (err, result){
                        var listString = "```";
                        result.forEach(function(item){
                            listString += item.game + "\n";
                        });

                        listString += "```";
                        message.channel.send(listString);
                    });
                });
            }
        }
    });

    app.get('/streamChanged', function (req, res) {
        res.send(req.query['hub.challenge']);             
    });

    app.post('/streamChanged', function(req, res){
        res.sendStatus(202);
        client.channels.get("617196134536052737").send("test");     
    });

    client.login(auth.token);    
}).listen(port);
