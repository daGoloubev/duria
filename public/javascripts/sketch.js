var video;
var canvas;
var button;
var saveButton;
function setup() {
    canvas = createCanvas(320, 240);
    background(255);
    video = createCapture(VIDEO,{
        audio: false,
        video: {
            facingMode: "environment"
        }
    });
    //video = createCapture(VIDEO);
    video.size(320,240);
    button = createButton('Knäpp en bild');
    button.mousePressed(takesnap);

    //saveButton = createButton('Ladda ner foto');
    //saveButton.mousePressed(savesnap);

    canvas.parent('sketch-holder');
    video.parent('sketch-holder');

    button.parent('sketch-holder');

    //saveButton.parent('sketch-holder');
}
function takesnap(){
    image(video, 0, 0);
}
function savesnap(){
    save(canvas, 'duria.se_minSnap.jpg');
}

