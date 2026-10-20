import "./style.css";
import "../../shared/theme-toggle.css";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
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
createDemoTitle("Exercise 25");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);

camera.position.set(5, -5, 4);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.75, 0.75, 0);
bindViewControls(camera, controls);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
scene.add(new THREE.DirectionalLight(0xffffff, 0.5));

const lineMats = [];

function makeLineMat(color, linewidth, opacity = 1) {
    const mat = new LineMaterial({
        color,
        linewidth,
        transparent: opacity < 1,
        opacity,
    });
    lineMats.push(mat);
    return mat;
}

function updateLineResolutions() {
    for (const mat of lineMats) {
        mat.resolution.set(window.innerWidth, window.innerHeight);
    }
}

updateLineResolutions();

function tintGrid(grid, color) {
    const attr = grid.geometry.getAttribute("color");
    if (!attr) return;

    const c = new THREE.Color(color);
    for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
}

function makeLabel(text, color, scale = 0.6) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = hexColor(color);
    ctx.font = "96px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 150);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, depthTest: false }),
    );
    sprite.scale.set(scale, scale, scale);
    sprite.userData.text = text;
    return sprite;
}

function paintLabel(sprite, text, color) {
    const canvas = sprite.material.map.image;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = hexColor(color);
    ctx.font = "96px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 150);
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
gridXYBack.position.set(0, 0, -2);
gridXYBack.rotateX(Math.PI / 2);
scene.add(gridXYBack);

const gridXZBack = new THREE.GridHelper(4, 10, colors.grey, colors.grey);
gridXZBack.position.set(0, -2, 0);
scene.add(gridXZBack);

const gridYZBack = new THREE.GridHelper(4, 10, colors.grey, colors.grey);
gridYZBack.position.set(-2, 0, 0);
gridYZBack.rotateZ(Math.PI / 2);
scene.add(gridYZBack);

const grids = [gridXYBack, gridXZBack, gridYZBack];

const STRIP_HALF_Z = 5;

const params = {
    a: 1.5,
    showAxes: true,
    showGrid: true,
};

const contentGroup = new THREE.Group();
scene.add(contentGroup);

const stripXMaterial = new THREE.MeshBasicMaterial({
    color: colors.blue,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const stripYMaterial = new THREE.MeshBasicMaterial({
    color: colors.purple,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const stripXEdgeMat = makeLineMat(colors.blue, 2.5);
const stripYEdgeMat = makeLineMat(colors.purple, 2.5);
const pointMaterial = new THREE.MeshBasicMaterial({ color: colors.fg });

const pointM = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 24, 24),
    pointMaterial,
);
contentGroup.add(pointM);

const labelM = makeLabel("M", colors.fg, 0.7);
contentGroup.add(labelM);

const labelA = makeLabel("a", colors.fg, 0.5);
contentGroup.add(labelA);

function stripMesh(width, material, axis) {
    const geometry = new THREE.PlaneGeometry(width, 2 * STRIP_HALF_Z);
    if (axis === "x") {
        geometry.rotateX(Math.PI / 2);
    } else {
        geometry.rotateZ(Math.PI / 2);
    }
    return new THREE.Mesh(geometry, material);
}

function stripEdge(width, axis, material) {
    const halfW = width / 2;
    const halfZ = STRIP_HALF_Z;
    const points =
        axis === "x"
            ? [
                  new THREE.Vector3(-halfW, 0.002, -halfZ),
                  new THREE.Vector3(halfW, 0.002, -halfZ),
                  new THREE.Vector3(halfW, 0.002, halfZ),
                  new THREE.Vector3(-halfW, 0.002, halfZ),
                  new THREE.Vector3(-halfW, 0.002, -halfZ),
              ]
            : [
                  new THREE.Vector3(0.002, -halfW, -halfZ),
                  new THREE.Vector3(0.002, halfW, -halfZ),
                  new THREE.Vector3(0.002, halfW, halfZ),
                  new THREE.Vector3(0.002, -halfW, halfZ),
                  new THREE.Vector3(0.002, -halfW, -halfZ),
              ];
    const geometry = new LineGeometry();
    geometry.setPositions(points.flatMap((p) => [p.x, p.y, p.z]));
    return new Line2(geometry, material);
}

function buildContent() {
    for (const child of [...contentGroup.children]) {
        if (child !== pointM && child !== labelM && child !== labelA) {
            contentGroup.remove(child);
        }
    }

    const a = params.a;

    const stripX = stripMesh(a, stripXMaterial, "x");
    stripX.position.set(a / 2, 0, 0);
    contentGroup.add(stripX);

    const stripY = stripMesh(a, stripYMaterial, "y");
    stripY.position.set(0, a / 2, 0);
    contentGroup.add(stripY);

    const edgeX = stripEdge(a, "x", stripXEdgeMat);
    contentGroup.add(edgeX);

    const edgeY = stripEdge(a, "y", stripYEdgeMat);
    contentGroup.add(edgeY);

    pointM.position.set(a, a, 0);
    labelM.position.set(a + 0.3, a + 0.15, 0);
    labelA.position.set(a, a + 0.25, -0.25);
}

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
    paintLabel(labelM, "M", next.fg);
    paintLabel(labelA, "a", next.fg);
    for (const grid of grids) {
        tintGrid(grid, next.grey);
    }
    stripXMaterial.color.setHex(next.blue);
    stripYMaterial.color.setHex(next.purple);
    stripXEdgeMat.color.setHex(next.blue);
    stripYEdgeMat.color.setHex(next.purple);
    pointMaterial.color.setHex(next.fg);
    buildContent();
}

const gui = new GUI();
gui.add(params, "a", 0.5, 3, 0.1).onChange(buildContent);
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
    updateLineResolutions();
});
