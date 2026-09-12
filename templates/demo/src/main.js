import "./style.css";
import "../../shared/theme-toggle.css";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
    bindViewControls,
    createDemoTitle,
    isTypingTarget,
} from "../../shared/demo-chrome.js";
import {
    createThemeToggle,
    hexColor,
    palette,
} from "../../shared/theme.js";

createThemeToggle();
createDemoTitle("__TITLE__");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);

camera.position.set(4, 4, 4);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
bindViewControls(camera, controls);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

function tintGrid(grid, color) {
    const attr = grid.geometry.getAttribute("color");
    if (!attr) return;

    const c = new THREE.Color(color);
    for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
}

function makeLabel(text, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = hexColor(color);
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 140);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(0.5, 0.5, 0.5);
    sprite.userData.text = text;
    return sprite;
}

function paintLabel(sprite, text, color) {
    const canvas = sprite.material.map.image;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = hexColor(color);
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 140);
    sprite.material.map.needsUpdate = true;
}

const colors = palette();

const axes = new THREE.AxesHelper(3);
scene.add(axes);

const labelX = makeLabel("x", colors.red);
labelX.position.set(3.2, 0, 0);
scene.add(labelX);

const labelY = makeLabel("y", colors.green);
labelY.position.set(0, 3.2, 0);
scene.add(labelY);

const labelZ = makeLabel("z", colors.blue);
labelZ.position.set(0, 0, 3.2);
scene.add(labelZ);

const gridXYBack = new THREE.GridHelper(4, 10, colors.grey, colors.grey);
gridXYBack.position.set(0, -2, 0);
scene.add(gridXYBack);

const gridXZBack = new THREE.GridHelper(4, 10, colors.grey, colors.grey);
gridXZBack.position.set(0, 0, -2);
gridXZBack.rotateX(Math.PI / 2);
scene.add(gridXZBack);

const gridYZBack = new THREE.GridHelper(4, 10, colors.grey, colors.grey);
gridYZBack.position.set(-2, 0, 0);
gridYZBack.rotateZ(Math.PI / 2);
scene.add(gridYZBack);

const grids = [gridXYBack, gridXZBack, gridYZBack];

const params = {
    showAxes: true,
    showGrid: true,
};

function setAxesVisible(visible) {
    params.showAxes = visible;
    axes.visible = visible;
    labelX.visible = visible;
    labelY.visible = visible;
    labelZ.visible = visible;
}

function setGridsVisible(visible) {
    params.showGrid = visible;
    for (const grid of grids) {
        grid.visible = visible;
    }
}

function applyTheme() {
    const next = palette();
    renderer.setClearColor(next.background);
    paintLabel(labelX, "x", next.red);
    paintLabel(labelY, "y", next.green);
    paintLabel(labelZ, "z", next.blue);
    for (const grid of grids) {
        tintGrid(grid, next.grey);
    }
}

const gui = new GUI();
gui.add(params, "showAxes").name("axes").onChange(setAxesVisible);
const gridController = gui.add(params, "showGrid").name("grid").onChange(setGridsVisible);

window.addEventListener("keydown", (event) => {
    if (event.repeat || isTypingTarget(event)) return;
    if (event.key.toLowerCase() === "g") {
        setGridsVisible(!params.showGrid);
        gridController.updateDisplay();
    }
});

applyTheme();
window.addEventListener("themechange", applyTheme);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
