var video;
var button;
var saveButton;
var canvas;
function setup() {
    canvas = createCanvas(320, 240);
    background(255);
    video = createCapture(VIDEO,{
        audio: false,
        video: {
            facingMode: {
                exact: 'environment'
            }
        }
    });
    video.size(320,240);
    var button = createButton('Ta en snap');
    var saveButton = createButton('Ladda ner foto');
    button.mousePressed(takesnap);
    saveButton.mousePressed(savesnap);
    canvas.parent('sketch-holder');
    video.parent('sketch-holder');
    button.parent('sketch-holder');
    saveButton.parent('sketch-holder');
}
function takesnap(){
    image(video, 0, 0);
}
function savesnap(){
    save(canvas, '/images/tmp/duria.se_minSnap.jpg');
}

