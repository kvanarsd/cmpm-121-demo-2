import "./style.css";

const APP_NAME = "Paint";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const header = document.createElement("h2");
header.innerHTML = APP_NAME;
app.append(header);

const container = document.createElement("div");
container.style.display = "flex";
container.style.justifyContent = "space-between";
container.style.margin = "20px";

app.append(container);
const settings = document.createElement("div");
settings.className = "column";
container.append(settings);
const canvasCol = document.createElement("div");
container.append(canvasCol);
canvasCol.className = "column";
canvasCol.style.flex = "1";
const brushSettings = document.createElement("div");
brushSettings.className = "column";
container.append(brushSettings);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvasCol.append(canvas);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;;
ctx.fillStyle = "white";
ctx.fillRect(0,0, 256, 256);
ctx.font = "32px monospace";

const clearBut = document.createElement("button");
createButtons(clearBut, "Clear", false, clear);
const undoBut = document.createElement("button");
createButtons(undoBut, "Undo", false);
undoBut.addEventListener("click", () => undoRedo(lines, redoLines));
const redoBut = document.createElement("button");
createButtons(redoBut, "Redo", false);
redoBut.addEventListener("click", () => undoRedo(redoLines, lines));
const exportCan = document.createElement("button");
createButtons(exportCan, "Export", false);

const thin = document.createElement("button");
createButtons(thin, "Thin", true);
thin.className = "selected"
thin.addEventListener("click", () => size(thin, thick, 1));
const thick = document.createElement("button");
createButtons(thick, "Thick", true);
thick.addEventListener("click", () => size(thick, thin, 3));
const emoji1 = document.createElement("button");
createButtons(emoji1, "✨", true, stamp);
const emoji2 = document.createElement("button");
createButtons(emoji2, "❤️", true, stamp);
const emoji3 = document.createElement("button");
createButtons(emoji3, "💋", true, stamp);
const customEmo = document.createElement("button");
createButtons(customEmo, "Create Stamp", false);

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
let initialPos: {x: number, y: number};
const placedEmojis: placedStamp[] = [];

interface placedStamp {
    shape: string;
    x: number;
    y: number;
    rotation: number;
}

interface Cursor {
    shape: string;
    x: number;
    y: number;
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

    if (emojiBut) {
        curEmoji = {shape: emojiBut.innerHTML, x: pos.offsetX, y: pos.offsetY, rotation: 0}
        placedEmojis.push(curEmoji);
        initialPos = {x: pos.offsetX, y: pos.offsetY};
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
            const dx = pos.offsetX - initialPos.x;
            const dy = pos.offsetY - initialPos.y;
            const angle = Math.atan2(dy, dx);
            curEmoji.rotation = angle;
        }
        canvas.dispatchEvent(drawEvent);
    } else if(cursor) {
        cursor.x = pos.offsetX;
        cursor.y = pos.offsetY;
        canvas.dispatchEvent(toolEvent);
    }
    
});

canvas.addEventListener("mouseup", (pos) => {
    if (isDrawing) {
        isDrawing = false;
        if (currentLine) {
            currentLine.mouseMove(pos.offsetX, pos.offsetY);
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
    cursor = {shape: "*", x: 0, y: 0};
});

function draw(cursor: Cursor, ctx: CanvasRenderingContext2D) {
    if(emojiBut) {
        cursor.shape = emojiBut.innerHTML;
    } else {
        cursor.shape = "*"
    }
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(cursor.shape, cursor.x - 8,cursor.y + 16);
}

// events ---------------------------------------------------
canvas.addEventListener("drawing-changed", function() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0, 256, 256);
    for (const line of lines) {
        line.display(ctx);
    }
    for (const emoji of placedEmojis) {
        ctx.save();
        ctx.translate(emoji.x, emoji.y); 
        ctx.rotate(emoji.rotation || 0); 
        ctx.fillStyle = 'black';
        ctx.fillText(emoji.shape, -8,16);
        ctx.restore();
    }
})

canvas.addEventListener("tool-moved", function() {
    if(!isDrawing) {
        canvas.dispatchEvent(drawEvent);
    }
    if(cursor) {
        draw(cursor, ctx);    
    }
})

// button functions -----------------------------------------
function createButtons(button: HTMLButtonElement, value: string, brush: boolean, 
    func?: (button: HTMLButtonElement) => void | void | undefined) {
    button.innerHTML = value;
    if (func) {
        button.addEventListener("click", () => func(button));
    }
    
    if(!brush) {
        settings.appendChild(button);
    } else {
        brushSettings.appendChild(button);
    }
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

function clear() {
    lines.splice(0, lines.length);
    currentLine = null;
    canvas.dispatchEvent(drawEvent);
}

function undoRedo(remove: Array<Line>, add: Array<Line>) {
    const removedLine = remove.pop();
    if(removedLine) {
        add.push(removedLine); 
        canvas.dispatchEvent(drawEvent);
    }
}

function size(newSize: HTMLButtonElement, oldSize: HTMLButtonElement, size: number) {
    strokeSize = size;
    changeClass(newSize);
    if (emojiBut) {
        changeClass(emojiBut);
        emojiBut = null;
    } else {
        changeClass(oldSize);
    }
}

customEmo.addEventListener("click", () => {
    const sticker = prompt("Custom stamp", "❤️");
    if(sticker) {
        const newButton = document.createElement("button");
        createButtons(newButton, sticker, true, stamp);
    }
    
})

