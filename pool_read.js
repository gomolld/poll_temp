#!/usr/local/bin/node


"use strict";

var http = require("http");
const fs = require('fs');
var url = require('url');
const util = require('util')
var moment = require('moment');
const mysql = require('mysql');
var Twitter = require('twitter');


var Slack = require('slack-node');
 



// var Person = require('./mylib');
// 
 var counter=1;
 
 
 //var command = "/usr/bin/curl 'http://decent-destiny-704.appspot.com/laxservices/device_info.php?&deviceid=0001A95A5DD37162&limit=288&timezone=2&metric=0' -H 'Accept: application/json, text/javascript, */*; q=0.01' -H 'Referer: http://www.lacrossealertsmobile.com/v1.2/' -H 'Origin: http://www.lacrossealertsmobile.com' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36' --compressed";


 //var command = "/usr/bin/curl 'https://decent-destiny-704.appspot.com/laxservices/user-api.php?pkey=Dyd7kC4wxLDFz0rQ6W5T28DPgrM6SOBe&ref=47870iya647&action=refreshdeviceinfo' -H 'authority: decent-destiny-704.appspot.com'   -H 'sec-ch-ua: ' Not A;Brand';v='99', 'Chromium';v='90', 'Google Chrome';v='90''   -H 'accept: */*'   -H 'sec-ch-ua-mobile: ?0'   -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'   -H 'origin: https://www.lacrossealertsmobile.com' -H 'sec-fetch-site: cross-site' -H 'sec-fetch-mode: cors' -H 'sec-fetch-dest: empty' -H 'referer: https://www.lacrossealertsmobile.com/' -H 'accept-language: en-US,en;q=0.9' --compressed


//this works
// var command = "/usr/bin/curl 'https://decent-destiny-704.appspot.com/laxservices/user-api.php?pkey=Dyd7kC4wxLDFz0rQ6W5T28DPgrM6SOBe&ref=47870iya647&action=refreshdeviceinfo' -H 'authority: decent-destiny-704.appspot.com' -H 'accept: */*'   -H 'sec-ch-ua-mobile: ?0'   -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'   -H 'origin: https://www.lacrossealertsmobile.com' -H 'sec-fetch-site: cross-site' -H 'sec-fetch-mode: cors' -H 'sec-fetch-dest: empty'";



var command = "/usr/bin/curl 'https://decent-destiny-704.appspot.com/laxservices/user-api.php?pkey=Dyd7kC4wxLDFz0rQ6W5T28DPgrM6SOBe&ref=47870iya647&action=refreshdeviceinfo' \
  -H 'authority: decent-destiny-704.appspot.com' \
  -H 'sec-ch-ua: \" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"' \
  -H 'accept: */*' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' \
  -H 'origin: https://www.lacrossealertsmobile.com' \
  -H 'sec-fetch-site: cross-site' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-dest: empty' \
  -H 'referer: https://www.lacrossealertsmobile.com/' \
  -H 'accept-language: en-US,en;q=0.9' \
  --compressed";
  
// 


const shell = require('shelljs');

var result = shell.exec(command, {silent:true}).stdout;
console.log(result);

var data = JSON.parse(result);



// alternative shortcut
//console.log(util.inspect(data, false, null))




const connection = mysql.createConnection({
  host: process.env.MYSQL_ADDRESS,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
});

//console.log (data.device0.obs[0]);

connection.on('error', function(err) {
  console.log("[mysql error]",err);
});


data.device0.obs.forEach(function (item) {


    item.timestamp=moment(Date.parse(item.timestamp)).format('YYYY-MM-DD HH:mm:ss');

    if (item.probe_temp == 'N/C') {
        delete item.probe_temp;
    }

    if (item.ambient_temp == 'N/C') {
        delete item.ambient_temp;
    }

        connection.query('INSERT INTO readings SET ?', item, (err, res) => {
          if(err) {
              if(err.code == 'ER_DUP_ENTRY') {
               // console.log('dup');
              } else {
                throw(err);
              }
            }

        });




})


// const reading = { id: 100, probe_temp: 20.5 };
// connection.query('INSERT INTO readings SET ?', reading, (err, res) => {
//   if(err) throw err;
// 
//   console.log('Last insert ID:', res.insertId);
// });



// process.argv.forEach(function (val, index, array) {
//   console.log(index + ': ' + val);
// });

var forced=false;

if (process.argv[2] == 'force') forced=true;

    connection.query('SELECT * from readings order by timestamp desc limit 1', function(err, rows, fields) {
    //connection.end();
      if (!err) {
        console.log(rows[0].id);
        var message;
        if (rows[0].probe_temp > 81) {
             message = "Current pool temp at the Gomolls' is "  + rows[0].probe_temp + "°F.  That's warm enough for @dan_g, @rachel_gumball AND @gomollk !  😀 👙 🏊‍♀️\n";
        } else if (rows[0].probe_temp > 74) {
            message = "Current pool temp at the Gomolls' is "  + rows[0].probe_temp + "°F.  That's too cold for @gomollk 😞, but plenty warm for @dan_g and @rachel_gumball.\n";
         } else {
            message = "Current pool temp at the Gomolls' is "  + rows[0].probe_temp + "°F.  That's too cold for all the Gomolls.\n";

         }
         
         if (forced) {

            var client = new Twitter({
                consumer_key: process.env.TWITTER_CONSUMER_KEY,
                consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
                access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
                access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
            });
        
        
            client.post('statuses/update', {status: message}, function(error, tweet, response) {
              if (!error) {
                console.log('tweet sent successfully');
              } else {
                console.log ('error tweeting');
                console.log (error);
              }
            });
        } 
        console.log(message);
        
        if (rows[0].lowbattery !== 0) {
        
        
        
        
            var webhookUri = process.env.SLACK_WEBHOOK;
 
            var slack = new Slack();
            slack.setWebhook(webhookUri);
 
            slack.webhook({
              channel: "#kelly_dan",
              username: "gomoll_pool",
              text: "Pool probe battery may be low.",
            icon_emoji:  "http://dkgsoftware.com/images/pool_icon2.jpg"

            }, function(err, response) {
              console.log(response);
            });
            }

      } else
        console.log('Error while performing Query.');
    });



connection.end((err) => {
  // The connection is terminated gracefully
  // Ensures all previously enqueued queries are still
  // before sending a COM_QUIT packet to the MySQL server.
});

console.log("end");

//console.log('Server running at http://127.0.0.1:8081/');


