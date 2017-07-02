var video;
var canvas;
var button;
var saveButton;
var reset;
function setup() {
    canvas = createCanvas(390, 240);
    background(255);
    canvas.size(320, 240);
    video = createCapture(VIDEO,{
        audio: false,
        video: {
            facingMode: "environment"
        }
    });
    canvas.hide();
    //video = createCapture(VIDEO);
    //video.size(320, 240);

    button = createButton('Fotografera');
    button.mousePressed(takesnap);
    reset = createButton('Börja om.');
    reset.mousePressed(resetVideo);

    //saveButton = createButton('Ladda ner foto');
    //saveButton.mousePressed(savesnap);

    canvas.parent('sketch-holder');
    video.parent('sketch-holder');

    button.parent('sketch-holder');
    reset.parent('sketch-holder');

    //saveButton.parent('sketch-holder');
}
function takesnap(){
    image(video, 0 , 0, 320, 240);
    video.hide();
    canvas.show();
}
function savesnap(){
    save(canvas, 'duria.se_minSnap.jpg');
}
function resetVideo(){
    canvas.hide();
    video.show();
}

