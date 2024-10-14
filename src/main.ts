import "./style.css";

const APP_NAME = "Hello I'm katrina";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement("h1");
title.innerHTML = "Demo 2";
app.append(title);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
if(ctx) {
    ctx.canvas.width = 256;
    ctx.canvas.height = 256;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0, 256, 256);
}

app.append(canvas);