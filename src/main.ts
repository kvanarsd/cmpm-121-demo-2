import "./style.css";

const APP_NAME = "Hello I'm katrina";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
header.innerHTML = "Demo 2";
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;;
ctx.fillStyle = "white";
ctx.fillRect(0,0, 256, 256);
app.append(canvas);

const clearBut = document.createElement("button");
clearBut.innerHTML = "Clear";
app.append(clearBut);

const undoBut = document.createElement("button");
undoBut.innerHTML = "Undo";
app.append(undoBut);

const redoBut = document.createElement("button");
redoBut.innerHTML = "Redo";
app.append(redoBut);

// functions ----------------------------------------------------------------
let isDrawing = false;
let x = 0;
let y = 0;
let lines: { x: number; y: number; }[][][] = [];
let currentLine: { x: number; y: number; }[][] = [];
let currentStroke: { x: number; y: number; }[];
let lastLine;
const drawEvent = new CustomEvent("drawing-changed")

class Line {
    private points: { x: number; y: number; }[] = [];

    constructor(startX: number, startY: number) {
        this.points.push({x: startX, y: startY});
    }

    mouseMove(x: number, y: number) {
        this.points.push({x, y});
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 0; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        ctx.closePath();
    }
}

canvas.addEventListener("mousedown", (pos) => {
    isDrawing = true;
    lastLine = [];
    currentStroke = [{x:pos.offsetX, y:pos.offsetY}];
});

canvas.addEventListener("mousemove", (pos) => {
    if (isDrawing) {
        currentStroke.push({x:pos.offsetX, y:pos.offsetY});
        currentLine.push([...currentStroke]);
        currentStroke.shift();
        canvas.dispatchEvent(drawEvent);
    }
});

canvas.addEventListener("mouseup", (pos) => {
    if (isDrawing) {
        isDrawing = false;
        currentStroke.push({x:pos.offsetX, y:pos.offsetY});
        currentLine.push([...currentStroke]);
        lines.push([...currentLine]);
        currentLine = [];
        canvas.dispatchEvent(drawEvent);
        
    }
});

function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

canvas.addEventListener("drawing-changed", function(drawEvent) {
    ctx.fillRect(0,0, 256, 256);
    for (const line of lines) {
        for(const stroke of line) {
            drawLine(ctx, stroke[0].x, stroke[0].y, stroke[1].x, stroke[1].y);
        }
    }
    if (currentLine.length > 0) {
        for(const stroke of currentLine) {
            drawLine(ctx, stroke[0].x, stroke[0].y, stroke[1].x, stroke[1].y);
        }
    }
})

clearBut.addEventListener("mousedown", () => {
    lines = [];
    currentLine = [];
    canvas.dispatchEvent(drawEvent);
});

undoBut.addEventListener("mousedown", () => {
    if(lines.length > 0) {
        lastLine.push(lines.pop()); 
        canvas.dispatchEvent(drawEvent);
    }
})

redoBut.addEventListener("mousedown", () => {
    if(lastLine.length > 0) {
        lines.push(lastLine.pop());
        canvas.dispatchEvent(drawEvent);
    }
})

