import "./style.css";

const APP_NAME = "Hello I'm katrina";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
header.innerHTML = "Demo 2";
app.append(header);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
if(ctx) {
    ctx.canvas.width = 256;
    ctx.canvas.height = 256;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0, 256, 256);
}
app.append(canvas);

// functions ----------------------------------------------------------------
let isDrawing = false;
let x = 0;
let y = 0;

canvas.addEventListener("mousedown", (pos) => {
    x = pos.offsetX;
    y = pos.offsetY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (pos) => {
    if (isDrawing) {
        drawLine(ctx, x, y, pos.offsetX, pos.offsetY);
        x = pos.offsetX;
        y = pos.offsetY;
    }
});

canvas.addEventListener("mouseup", (pos) => {
    if (isDrawing) {
        drawLine(ctx, x, y, pos.offsetX, pos.offsetY);
        isDrawing = false;
    }
});


function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}