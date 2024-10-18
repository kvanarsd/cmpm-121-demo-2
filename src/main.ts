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

const thin = document.createElement("button");
thin.innerHTML = "Thin";
app.append(thin);
thin.className = "selected"

const thick = document.createElement("button");
thick.innerHTML = "Thick";
app.append(thick);
thick.className = "not-selected"

// functions ----------------------------------------------------------------
let isDrawing = false; 
const lines: Line[] = [];
const redoLines: Line[] = [];
let currentLine: Line | null;
const drawEvent = new CustomEvent("drawing-changed");
const toolEvent = new CustomEvent("tool-moved");
let strokeSize = 1;
let cursor: Cursor | null;

class Cursor {
    private x: number;
    private y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    position(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "32px monospace";
        ctx.fillStyle = 'black';
        ctx.fillText("*", this.x - 8,this.y + 16);
    }
}

class Line {
    private points: { x: number; y: number; }[] = [];
    private stroke: number;

    constructor(startX: number, startY: number) {
        this.points.push({x: startX, y: startY});
        this.stroke = strokeSize;
    }

    mouseMove(x: number, y: number) {
        this.points.push({x, y});
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = this.stroke;
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 0; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        ctx.closePath();
    }
}

// canvas mouse movements ------------------------------------------
canvas.addEventListener("mousedown", (pos) => {
    isDrawing = true;
    redoLines.splice(0, redoLines.length);
    currentLine = new Line(pos.offsetX, pos.offsetY);
    lines.push(currentLine);
});

canvas.addEventListener("mousemove", (pos) => {
    if (isDrawing) {
        if (currentLine) {currentLine.mouseMove(pos.offsetX, pos.offsetY);}
        canvas.dispatchEvent(drawEvent);
    }

    if(cursor) {
        cursor.position(pos.offsetX, pos.offsetY);
        canvas.dispatchEvent(toolEvent);
    }
    
});

canvas.addEventListener("mouseup", (pos) => {
    if (isDrawing) {
        isDrawing = false;
        if (currentLine) {currentLine.mouseMove(pos.offsetX, pos.offsetY);}
        canvas.dispatchEvent(drawEvent);    
    }
});

canvas.addEventListener("mouseout", () => {
    if (isDrawing) {
        isDrawing = false;
        currentLine = null;
    }
    cursor = null;
    canvas.dispatchEvent(drawEvent);
});

canvas.addEventListener("mouseenter", () => {
    cursor = new Cursor(0,0);
});

// events ---------------------------------------------------
canvas.addEventListener("drawing-changed", function() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0, 256, 256);
    for (const line of lines) {
        line.display(ctx);
    }
})

canvas.addEventListener("tool-moved", function() {
    if(!isDrawing) {
        canvas.dispatchEvent(drawEvent);
    }
    if(cursor) {
        cursor.draw(ctx);    
    }
})

// button functions -----------------------------------------
clearBut.addEventListener("mousedown", () => {
    lines.splice(0, lines.length);
    currentLine = null;
    canvas.dispatchEvent(drawEvent);
});

undoBut.addEventListener("mousedown", () => {
    const undo = lines.pop();
    if(undo) {
        redoLines.push(undo); 
        canvas.dispatchEvent(drawEvent);
    }
})

redoBut.addEventListener("mousedown", () => {
    const redo = redoLines.pop();
    if(redo) {
        lines.push(redo);
        canvas.dispatchEvent(drawEvent);
    }
})

thin.addEventListener("mousedown", () => {
    strokeSize = 1;
    thin.classList.add("selected");
    thin.classList.remove("not-selected");
    thick.classList.add("not-selected");
    thick.classList.remove("selected");
})

thick.addEventListener("mousedown", () => {
    strokeSize = 3;
    thick.classList.add("selected");
    thick.classList.remove("not-selected");
    thin.classList.add("not-selected");
    thin.classList.remove("selected");
})

