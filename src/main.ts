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
canvasCol.className = "column";
canvasCol.style.flex = "1";
container.append(canvasCol);

const brushSettings = document.createElement("div");
brushSettings.className = "column";
container.append(brushSettings);

const canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 400;
canvasCol.append(canvas);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, 400, 400);
ctx.font = "32px monospace";

const clearBut = document.createElement("button");
createButton(clearBut, "Clear", false, clear);
const undoBut = document.createElement("button");
createButton(undoBut, "Undo", false, () => undoRedo(lines, redoLines));
const redoBut = document.createElement("button");
createButton(redoBut, "Redo", false, () => undoRedo(redoLines, lines));
const exportCan = document.createElement("button");
createButton(exportCan, "Export", false, () => exportDialog.showModal());

// export button
const exportDialog = document.getElementById(
  "exportDialog"
) as HTMLDialogElement;
const transparentButton = document.getElementById(
  "transparent"
) as HTMLButtonElement;
const closeDialogButton = document.getElementById(
  "closeDialog"
) as HTMLButtonElement;

const opaqueButton = document.getElementById("opaque") as HTMLButtonElement;

transparentButton.addEventListener("click", () => {
  exportCanvas(true);
});

opaqueButton.addEventListener("click", () => {
  exportCanvas(false);
});

closeDialogButton.addEventListener("click", () => {
  exportDialog.close();
});

const thin = document.createElement("button");
createButton(thin, "Thin", true, () => size(thin, thick, 2));
thin.className = "selected";
const thick = document.createElement("button");
createButton(thick, "Thick", true, () => size(thick, thin, 5));

const emoji1 = document.createElement("button");
createButton(emoji1, "✨", true, stamp);
const emoji2 = document.createElement("button");
createButton(emoji2, "❤️", true, stamp);
const emoji3 = document.createElement("button");
createButton(emoji3, "💋", true, stamp);
const customEmo = document.createElement("button");
createButton(customEmo, "Create Stamp", false, customEmoji);

const slideCon = document.createElement("div");
slideCon.className = "sliderContainer";
const slider = document.createElement("input");
slider.type = "range";
slider.min = "0";
slider.max = "1530";
slider.value = "0";
slider.className = "slider";
slider.style.setProperty("--thumb-color", "rgb(255,0,0)");
app.append(slideCon);
slideCon.append(slider);

let r: number = 255;
let g: number = 0;
let b: number = 0;
slider.oninput = function () {
  const val = Number(slider.value);
  if (val < 255) {
    r = 255;
    g = val;
    b = 0;
  } else if (val < 510) {
    r = 510 - val;
    g = 255;
    b = 0;
  } else if (val < 765) {
    r = 0;
    g = 255;
    b = val - 510;
  } else if (val < 1020) {
    r = 0;
    g = 1020 - val;
    b = 255;
  } else if (val < 1275) {
    r = val - 1020;
    g = 0;
    b = 255;
  } else {
    r = 255;
    g = 0;
    b = 1530 - val;
  }
  color = `rgb(${r},${g},${b})`;
  slider.style.setProperty("--thumb-color", color);
};

// functions ----------------------------------------------------------------
let isDrawing = false;
const lines: mark[] = [];
const redoLines: mark[] = [];
let currentLine: Line | null;
const drawEvent = new CustomEvent("drawing-changed");
const toolEvent = new CustomEvent("tool-moved");
let strokeSize = 2;
let cursor: Cursor | null;
let emojiButton: HTMLButtonElement | null;
let currentEmoji: placedStamp | null;
let initialPosition: { x: number; y: number };
let color = "rgb(255,0,0)";

interface mark {
  lineObject: Line | undefined;
  stampObject: placedStamp | undefined;
}

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
  private points: { x: number; y: number }[] = [];
  private stroke: number;
  private stokeColor: string;

  constructor(startX: number, startY: number) {
    this.points.push({ x: startX, y: startY });
    this.stroke = strokeSize;
    this.stokeColor = color;
  }

  mouseMove(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = this.stokeColor;
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

  if (emojiButton) {
    currentEmoji = {
      shape: emojiButton.innerHTML,
      x: pos.offsetX,
      y: pos.offsetY,
      rotation: 0,
    };
    lines.push({ lineObject: undefined, stampObject: currentEmoji });
    initialPosition = { x: pos.offsetX, y: pos.offsetY };
  } else {
    currentLine = new Line(pos.offsetX, pos.offsetY);
    lines.push({ lineObject: currentLine, stampObject: undefined });
  }
});

canvas.addEventListener("mousemove", (pos) => {
  if (isDrawing) {
    if (currentLine) {
      currentLine.mouseMove(pos.offsetX, pos.offsetY);
    }
    if (emojiButton && currentEmoji) {
      const dx = pos.offsetX - initialPosition.x;
      const dy = pos.offsetY - initialPosition.y;
      const angle = Math.atan2(dy, dx);
      currentEmoji.rotation = angle;
    }
    canvas.dispatchEvent(drawEvent);
  } else if (cursor) {
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
  cursor = { shape: "*", x: 0, y: 0 };
});

function draw(cursor: Cursor, ctx: CanvasRenderingContext2D) {
  if (emojiButton) {
    cursor.shape = emojiButton.innerHTML;
  } else {
    cursor.shape = "*";
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillText(cursor.shape, cursor.x - 8, cursor.y + 16);
}

// events ---------------------------------------------------
function drawCanvasContent(ctxCan: CanvasRenderingContext2D) {
  ctxCan.fillStyle = "white";
  ctxCan.fillRect(0, 0, 400, 400);
  for (const { lineObject, stampObject } of lines) {
    if (lineObject) {
      lineObject.display(ctxCan);
    }
    if (stampObject) {
      ctxCan.save();
      ctxCan.translate(stampObject.x, stampObject.y);
      ctxCan.rotate(stampObject.rotation || 0);
      ctxCan.fillStyle = "black";
      ctxCan.fillText(stampObject.shape, -8, 16);
      ctxCan.restore();
    }
  }
}

canvas.addEventListener("drawing-changed", function () {
  drawCanvasContent(ctx);
});

canvas.addEventListener("tool-moved", function () {
  if (!isDrawing) {
    canvas.dispatchEvent(drawEvent);
  }
  if (cursor) {
    draw(cursor, ctx);
  }
});

// button functions -----------------------------------------
function createButton(
  button: HTMLButtonElement,
  value: string,
  brush: boolean,
  func?: (button: HTMLButtonElement) => void | void | undefined
) {
  button.innerHTML = value;
  if (func) {
    button.addEventListener("click", () => func(button));
  }

  if (!brush) {
    settings.appendChild(button);
  } else {
    brushSettings.appendChild(button);
  }
  if (button.innerHTML != "Thin" && brush) {
    button.className = "not-selected";
  }
}

function stamp(button: HTMLButtonElement) {
  if (emojiButton) {
    changeClass(emojiButton);
  }
  emojiButton = button;
  changeClass(button);
  if (thin.className == "selected") {
    changeClass(thin);
  } else if (thick.className == "selected") {
    changeClass(thick);
  }
}

function changeClass(button: HTMLButtonElement) {
  if (button.className == "not-selected") {
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

function undoRedo(remove: Array<mark>, add: Array<mark>) {
  const removedLine = remove.pop();
  if (removedLine) {
    add.push(removedLine);
    canvas.dispatchEvent(drawEvent);
  }
}

function customEmoji() {
  const sticker = prompt("Custom stamp", "❤️");
  if (sticker) {
    const newButton = document.createElement("button");
    createButton(newButton, sticker, true, stamp);
  }
}

function exportCanvas(transparent: boolean) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 1200;
  tempCanvas.height = 1200;
  const tempCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D;
  if (!transparent) {
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, 400, 400);
  }
  tempCtx.scale(3, 3);
  tempCtx.font = "32px monospace";

  for (const { lineObject, stampObject } of lines) {
    if (lineObject) {
      lineObject.display(tempCtx);
    }
    if (stampObject) {
      tempCtx.save();
      tempCtx.translate(stampObject.x, stampObject.y);
      tempCtx.rotate(stampObject.rotation || 0);
      tempCtx.fillStyle = "black";
      tempCtx.fillText(stampObject.shape, -8, 16);
      tempCtx.restore();
    }
  }

  const anchor = document.createElement("a");
  anchor.href = tempCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
}

function size(
  newSize: HTMLButtonElement,
  oldSize: HTMLButtonElement,
  size: number
) {
  if (strokeSize != size || emojiButton) {
    strokeSize = size;
    changeClass(newSize);
    if (emojiButton) {
      changeClass(emojiButton);
      emojiButton = null;
    } else {
      changeClass(oldSize);
    }
  }
}
