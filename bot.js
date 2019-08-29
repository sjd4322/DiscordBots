const auth = require('./auth.json');

//Discord connect
const Discord = require('discord.js')
const client = new Discord.Client()

//Connect to mongo and create a connection
const MongoClient = require('mongodb').MongoClient;
const uri = require('./mongoConnection.json');
const mongoClient = new MongoClient(uri.connectionString, { useNewUrlParser: true });
const connection = mongoClient.connect()

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

client.login(auth.token);