var express = require('express');
var router = express.Router();
var fs = require('fs');
const fr = require('face-recognition');
const recognizer = fr.FaceRecognizer();
const detector = fr.FaceDetector();
var path = require('path');

// options is optional
const testFolder = '../routes/faces/';

var glob = require("glob");
const numJitters = 15;
var array = [];

// options is optional
glob(testFolder+"*.png", function (er, files) {
    files = files.toString();
    files = files.replace(/'/g, '"');
    array = files.split(',');
    var names = [];
    for(var i=0;i<array.length;i++){
        var name = path.basename(array[i]).toString().split('_')[0];
        if(names.indexOf(name)===-1) {
            names.push(name);
        }
    }
    for(i=0;i<names.length;i++){
        var chk = 0;
        var alldetectedFaces = 0;
        var detectedFaces = 0;
        for(var j=0;j<array.length;j++){
            var name = path.basename(array[j]).toString().split('_')[0];
            if(names[i]===name) {
                var img1 = fr.loadImage(array[j]);
                if(chk===0){
                    detectedFaces  = detector.detectFaces(img1);
                    console.log("Initial Face "+names[i]);
                    chk+=1;
                }
                else if(chk>5){
                    break;
                }
                else{
                    var currFace = detector.detectFaces(img1);
                    detectedFaces = detectedFaces.concat(currFace);
                    chk+=1;
                    console.log("ADDED FACE "+chk.toString()+" "+names[i])
                }
            }
        }
        console.log("OUTSIDE FACE DETECT: "+names[i]);
        recognizer.addFaces(detectedFaces, names[i],numJitters);
        console.log("Done Adding "+chk.toString()+" Faces of: "+names[i]);
    }
});

// const howardFaces = ["howard_1.png","howard_2.png","howard_3.png","howard_4.png","howard_5.png","howard_6.png","howard_7.png","howard_8.png","howard_9.png","howard_10.png","howard_11.png","howard_12.png","howard_13.png","howard_14.png","howard_15.png","howard_16.png","howard_17.png","howard_18.png","howard_19.png","howard_20.png","howard_21.png","howard_22.png"];
// const rajFaces = ["raj_1.png","raj_2.png","raj_3.png","raj_4.png","raj_5.png","raj_6.png","raj_7.png","raj_8.png","raj_9.png","raj_10.png","raj_11.png","raj_12.png","raj_13.png","raj_14.png","raj_15.png","raj_16.png","raj_17.png","raj_18.png","raj_19.png","raj_20.png","raj_21.png","raj_22.png"]
// const sheldonFaces = ["sheldon_1.png","sheldon_2.png","sheldon_3.png","sheldon_4.png","sheldon_5.png","sheldon_6.png","sheldon_7.png","sheldon_8.png","sheldon_9.png","sheldon_10.png","sheldon_11.png","sheldon_12.png","sheldon_13.png","sheldon_14.png","sheldon_15.png","sheldon_16.png","sheldon_17.png","sheldon_18.png","sheldon_19.png","sheldon_20.png","sheldon_21.png","sheldon_22.png"];

router.get('/capture', function(req, res, next) {
    res.render('index');
});

router.post('/predict', function(req, res) {
    // console.log(req.body.image);
    console.log("training image");
    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    var randomFileName = Math.random().toString(36).slice(2);
    fs.writeFile(randomFileName+".png", base64Data, 'base64', function(err) {
        if(err){
            console.log(err);
        }
        else {
            const msimg3 = fr.loadImage('../bin/' + randomFileName + ".png");

            const faceImage = detector.detectFaces(msimg3);
            if (Array.isArray(faceImage)) {
                console.log("is array");
            }
            else {
                console.log("not a array");
            }
            if (faceImage.length) {
                const predictionsAll = recognizer.predict(faceImage[0]);
                console.log(predictionsAll);
                const predictions = recognizer.predictBest(faceImage[0]);
                if (predictions['distance'] > 0.5) {
                    res.json({"msg": "NOT REGISTERED"});
                    console.log("Not Registered")
                }
                else {
                    predictions['img'] = req.body.image;
                    res.json(predictions);
                    console.log("PREDICTED ANSWER: " + predictions['className']);
                }
            }
            else{
                res.json({"msg": "No Face Detected in Image"});
            }
        }
        var filePath = '../bin/'+randomFileName+".png";
        fs.unlinkSync(filePath);
    });
});

router.post('/train', function(req, res) {
    // console.log(req.body.image);
    console.log("training image");
    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    var fileName = req.body.name;
    var randomFileName = Math.random().toString(36).slice(2);
    fs.writeFile("../routes/faces/"+fileName+"_"+randomFileName+".png", base64Data, 'base64', function(err) {
        if(err){
            console.log(err);
        }
        else {
            glob(testFolder+"*.png", function (er, files) {
                files = files.toString();
                files = files.replace(/'/g, '"');
                array = files.split(',');
                var chk = 0;
                var detectedFaces = 0;
                for (var j = 0; j < array.length; j++) {
                    var name = path.basename(array[j]).toString().split('_')[0];
                    if (fileName === name) {
                        var img1 = fr.loadImage(array[j]);
                        if (chk === 0) {
                            detectedFaces = detector.detectFaces(img1);
                            console.log("Initial Face " + fileName);
                            chk += 1;
                        }
                        else if (chk > 5) {
                            break;
                        }
                        else {
                            var currFace = detector.detectFaces(img1);
                            detectedFaces = detectedFaces.concat(currFace);
                            chk += 1;
                            console.log("ADDED FACE " + chk.toString() + " " + fileName)
                        }
                    }
                }
                console.log("OUTSIDE FACE DETECT: " + fileName);
                recognizer.addFaces(detectedFaces, fileName, numJitters);
                console.log("Done Adding " + chk.toString() + " Faces of: " + fileName);
                res.json({"status": "success", "image": req.body.image});
            });
        }
    });
});

module.exports = router;
