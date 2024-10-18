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
ctx.font = "32px monospace";
app.append(canvas);

const clearBut = document.createElement("button");
createButtons(clearBut, "Clear", false);
const undoBut = document.createElement("button");
createButtons(undoBut, "Undo", false);
const redoBut = document.createElement("button");
createButtons(redoBut, "Redo", false);
const thin = document.createElement("button");
createButtons(thin, "Thin", true);
thin.className = "selected"
const thick = document.createElement("button");
createButtons(thick, "Thick", true);
const emoji1 = document.createElement("button");
createButtons(emoji1, "✨", true);
emoji1.addEventListener("click", () => stamp(emoji1));
const emoji2 = document.createElement("button");
createButtons(emoji2, "❤️", true);
emoji2.addEventListener("click", () => stamp(emoji2));
const emoji3 = document.createElement("button");
createButtons(emoji3, "💋", true);
emoji3.addEventListener("click", () => stamp(emoji3));

// functions ----------------------------------------------------------------
let isDrawing = false; 
const lines: Line[] = [];
const redoLines: Line[] = [];
let currentLine: Line | null;
const drawEvent = new CustomEvent("drawing-changed");
const toolEvent = new CustomEvent("tool-moved");
let strokeSize = 1;
let cursor: Cursor | null;
let emojiBut: HTMLButtonElement | null;
let curEmoji: placedStamp | null;
const placedEmojis: placedStamp[] = [];

interface placedStamp {
    shape: string;
    x: number;
    y: number;
}

class Cursor {
    private x: number;
    private y: number;
    public shape: string;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        if(emojiBut) {
            this.shape = emojiBut.innerHTML;
        } else {
            this.shape = "*";
        }
        
    }

    position(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if(emojiBut) {
            this.shape = emojiBut.innerHTML;
        } else {
            this.shape = "*"
        }
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillText(this.shape, this.x - 8,this.y + 16);
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

// canvas mouse movements -------------------------------------------
canvas.addEventListener("mousedown", (pos) => {
    isDrawing = true;
    redoLines.splice(0, redoLines.length);
    //currentLine = null;

    if (emojiBut) {
        curEmoji = {shape: emojiBut.innerHTML, x: pos.offsetX, y: pos.offsetY}
        placedEmojis.push(curEmoji);
    } else {
        currentLine = new Line(pos.offsetX, pos.offsetY);
        lines.push(currentLine);
    }
});

canvas.addEventListener("mousemove", (pos) => {
    if (isDrawing) {
        if (currentLine) {
            currentLine.mouseMove(pos.offsetX, pos.offsetY);
        }
        if (emojiBut && curEmoji) { 
            //placedEmojis[placedEmojis.length].x = pos.offsetX;
            //placedEmojis[placedEmojis.length].y = pos.offsetY;\
            curEmoji.x = pos.offsetX;
            curEmoji.y = pos.offsetY;
        }
        canvas.dispatchEvent(drawEvent);
    } else if(cursor) {
        cursor.position(pos.offsetX, pos.offsetY);
        canvas.dispatchEvent(toolEvent);
    }
    
});

canvas.addEventListener("mouseup", (pos) => {
    if (isDrawing) {
        isDrawing = false;
        if (currentLine) {
            currentLine.mouseMove(pos.offsetX, pos.offsetY);
        }
        if(emojiBut && curEmoji) {
            curEmoji.x = pos.offsetX;
            curEmoji.y = pos.offsetY;
        }
        canvas.dispatchEvent(drawEvent);    
    }
});

canvas.addEventListener("mouseout", () => {
    if (isDrawing || currentLine) {
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
    for (const emoji of placedEmojis) {
        ctx.font = "32px monospace";
        ctx.fillStyle = 'black';
        ctx.fillText(emoji.shape, emoji.x - 8,emoji.y + 16);
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
function createButtons(button: HTMLButtonElement, value: string, brush: boolean) {
    button.innerHTML = value;
    app.append(button);
    if(button.innerHTML != "Thin" && brush) {
        button.className = "not-selected";
    }
}

function stamp(button: HTMLButtonElement) {
    if(emojiBut) {
        changeClass(emojiBut);
    }
    emojiBut = button;
    changeClass(button);
    if (thin.className == "selected") {
        changeClass(thin);
    } else if (thick.className == "selected") {
        changeClass(thick);
    }
}

function changeClass(button: HTMLButtonElement) {
    if(button.className == "not-selected") {
        button.classList.add("selected");
        button.classList.remove("not-selected");
    } else {
        button.classList.add("not-selected");
        button.classList.remove("selected");
    }
}

clearBut.addEventListener("click", () => {
    lines.splice(0, lines.length);
    currentLine = null;
    canvas.dispatchEvent(drawEvent);
});

undoBut.addEventListener("click", () => {
    const undo = lines.pop();
    if(undo) {
        redoLines.push(undo); 
        canvas.dispatchEvent(drawEvent);
    }
})

redoBut.addEventListener("click", () => {
    const redo = redoLines.pop();
    if(redo) {
        lines.push(redo);
        canvas.dispatchEvent(drawEvent);
    }
})

thin.addEventListener("click", () => {
    strokeSize = 1;
    changeClass(thin);
    if (emojiBut) {
        changeClass(emojiBut);
        emojiBut = null;
    } else {
        changeClass(thick);
    }
})

thick.addEventListener("click", () => {
    strokeSize = 3;
    changeClass(thick);
    if (emojiBut) {
        changeClass(emojiBut);
        emojiBut = null;
    } else {
        changeClass(thin);
    }
})

