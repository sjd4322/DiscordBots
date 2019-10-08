//const auth = require('./auth.json');
var http = require('http');

require('dotenv').config();
const port = process.env.PORT || 3000;

http.createServer(function (request, response) {
    //Discord connect
    const Discord = require('discord.js')
    const client = new Discord.Client();

    //Connect to mongo and create a connection
    const MongoClient = require('mongodb').MongoClient;
    //const uri = process.env.connectionString;
    const mongoClient = new MongoClient(process.env.connectionString, { useNewUrlParser: true });
    const connection = mongoClient.connect(function(err){
        if(err != null){
            console.log(err);
        }

    });

    client.on("presenceUpdate", (oldUser, newUser) => {
        //Exclude title changes and typing
        if(oldUser.presence.game != null && oldUser.presence.game.streaming 
            && newUser.presence.clientStatus !== "desktop"
            && oldUser.presence.clientStatus !== "desktop"
            || oldUser.guild.name !== "Clavaats Server") return;
        
        if(oldUser.displayName === "Clavaat" && newUser.presence != null){
            if(newUser.presence.game != null && newUser.presence.game.streaming){
                client.channels.get("617196134536052737").send("@everyone Clavaat has started streaming! https://www.twitch.tv/clavaat");               
            }
        }
    });

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

    client.login(process.env.token);    
}).listen(port);
