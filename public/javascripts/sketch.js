var w = 320;
var h = 240
function setup() {
    var canvas = createCanvas(w, h);
    capture = createCapture({
        audio: false,
        video: {
            facingMode: {
                exact: 'environment'
            }
        }
    });
    capture.size(w, h);
    capture.hide();
    canvas.parent('sketch-holder2');
    background(255, 0, 200);
}

function draw() {
    background(255);
    image(capture, 0, 0, w, h);
    //filter('INVERT');
}