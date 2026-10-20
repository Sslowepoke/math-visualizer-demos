import "./style.css";
import "../../shared/theme-toggle.css";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
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
createDemoTitle("Electrostatic Field — Strip");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);

camera.position.set(6, -6, 5);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0.75);
bindViewControls(camera, controls);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

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

const STRIP_HALF_X = 5;
const LINE_HALF_X = 4;
const D_E_TAIL = 0.8;

const params = {
    a: -1,
    b: 2,
    z: 0.825,
    dz: 0.15,
    m: 2.5,
    lineSamplesX: 1,
    lineSamplesZ: 4,
    showAxes: true,
    showGrid: false,
    showSectionLines: true,
};

const stripGroup = new THREE.Group();
scene.add(stripGroup);

const stripMaterial = new THREE.MeshBasicMaterial({
    color: colors.blue,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const highlightMaterial = new THREE.MeshBasicMaterial({
    color: colors.yellow,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const stripEdgeMat = makeLineMat(colors.blue, 2);
const highlightEdgeMat = makeLineMat(colors.yellow, 2);
const lineToMMat = makeLineMat(colors.yellow, 2, 0.6);
const edgeToMMat = makeLineMat(colors.purple, 3);
const radialMat = makeLineMat(colors.grey, 2.5, 0.7);
const arcMat1 = makeLineMat(colors.red, 3);
const arcMat2 = makeLineMat(colors.green, 3);
const dEMat = makeLineMat(colors.fg, 3.5);
const pointMaterial = new THREE.MeshBasicMaterial({ color: colors.fg });
const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: colors.fg });

const pointM = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 24, 24),
    pointMaterial,
);
scene.add(pointM);

const labelM = makeLabel("M", colors.fg);
scene.add(labelM);

const labelA = makeLabel("a", colors.blue, 0.5);
scene.add(labelA);

const labelB = makeLabel("b", colors.blue, 0.5);
scene.add(labelB);

const labelSectionZ = makeLabel("z", colors.yellow, 0.5);
scene.add(labelSectionZ);

const labelTheta1 = makeLabel("θ₁", colors.red, 0.55);
scene.add(labelTheta1);

const labelTheta2 = makeLabel("θ₂", colors.green, 0.55);
scene.add(labelTheta2);

const labelDE = makeLabel("dE", colors.fg, 0.55);
scene.add(labelDE);

const dEGroup = new THREE.Group();
scene.add(dEGroup);

function planeMesh(width, depth, material) {
    const geometry = new THREE.PlaneGeometry(width, depth);
    geometry.rotateX(Math.PI / 2);
    return new THREE.Mesh(geometry, material);
}

function thickLine(points, material) {
    const geometry = new LineGeometry();
    geometry.setPositions(points.flatMap((p) => [p.x, p.y, p.z]));
    return new Line2(geometry, material);
}

function edgeLoop(width, depth, material, lift) {
    const halfW = width / 2;
    const halfD = depth / 2;
    const points = [
        new THREE.Vector3(-halfW, lift, -halfD),
        new THREE.Vector3(halfW, lift, -halfD),
        new THREE.Vector3(halfW, lift, halfD),
        new THREE.Vector3(-halfW, lift, halfD),
        new THREE.Vector3(-halfW, lift, -halfD),
    ];
    return thickLine(points, material);
}

function arcLine(center, radius, alphaStart, alphaEnd, material) {
    const segments = 48;
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const alpha = alphaStart + ((alphaEnd - alphaStart) * i) / segments;
        points.push(
            new THREE.Vector3(
                0,
                center.y + radius * Math.cos(alpha),
                center.z + radius * Math.sin(alpha),
            ),
        );
    }
    return thickLine(points, material);
}

function buildDE(P, M) {
    dEGroup.clear();

    const dir = new THREE.Vector3().subVectors(M, P).normalize();
    const beyond = new THREE.Vector3()
        .copy(M)
        .addScaledVector(dir, D_E_TAIL);
    dEGroup.add(thickLine([P, M, beyond], dEMat));

    const headLength = 0.22;
    const headRadius = 0.09;
    const head = new THREE.Mesh(
        new THREE.ConeGeometry(headRadius, headLength, 24),
        arrowHeadMaterial,
    );
    head.position.copy(beyond).addScaledVector(dir, headLength / 2);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    dEGroup.add(head);

    labelDE.position.copy(beyond).addScaledVector(dir, 0.4);
    labelDE.position.y += 0.15;
}

function buildStrip() {
    stripGroup.clear();

    const a = Math.min(params.a, params.b);
    const b = Math.max(params.a, params.b);
    const sectionZ = Math.max(a, Math.min(b, params.z));
    let z1 = sectionZ - params.dz / 2;
    let z2 = sectionZ + params.dz / 2;
    z1 = Math.max(a, Math.min(b, z1));
    z2 = Math.max(a, Math.min(b, z2));
    const m = params.m;

    const stripDepth = b - a;
    const strip = planeMesh(2 * STRIP_HALF_X, stripDepth, stripMaterial);
    strip.position.set(0, 0, (a + b) / 2);
    stripGroup.add(strip);

    const stripEdge = edgeLoop(2 * STRIP_HALF_X, stripDepth, stripEdgeMat, 0.002);
    stripEdge.position.set(0, 0, (a + b) / 2);
    stripGroup.add(stripEdge);

    const sectionDepth = z2 - z1;
    const highlight = planeMesh(2 * STRIP_HALF_X, sectionDepth, highlightMaterial);
    highlight.position.set(0, 0.001, (z1 + z2) / 2);
    stripGroup.add(highlight);

    const highlightEdge = edgeLoop(
        2 * STRIP_HALF_X,
        sectionDepth,
        highlightEdgeMat,
        0.003,
    );
    highlightEdge.position.set(0, 0, (z1 + z2) / 2);
    stripGroup.add(highlightEdge);

    const M = new THREE.Vector3(0, m, 0);
    const A = new THREE.Vector3(0, 0, a);
    const B = new THREE.Vector3(0, 0, b);
    const O = new THREE.Vector3(0, 0, 0);
    const P = new THREE.Vector3(0, 0, sectionZ);

    pointM.position.copy(M);
    labelM.position.set(0, m + 0.3, 0);
    labelA.position.set(0.3, -0.3, a);
    labelB.position.set(0.3, -0.3, b);
    labelSectionZ.position.set(0.3, -0.3, sectionZ);

    stripGroup.add(thickLine([A, M], edgeToMMat));
    stripGroup.add(thickLine([B, M], edgeToMMat));
    stripGroup.add(thickLine([O, M], radialMat));

    if (params.showSectionLines && sectionDepth > 1e-6) {
        const positions = [];
        const nx = Math.max(1, Math.floor(params.lineSamplesX));
        const nz = Math.max(1, Math.floor(params.lineSamplesZ));
        for (let i = 0; i < nx; i++) {
            const x = nx === 1
                ? 0
                : -LINE_HALF_X + (2 * LINE_HALF_X * i) / (nx - 1);
            for (let j = 0; j <= nz; j++) {
                const z = z1 + (sectionDepth * j) / nz;
                positions.push(x, 0, z, M.x, M.y, M.z);
            }
        }
        const geometry = new LineSegmentsGeometry();
        geometry.setPositions(positions);
        stripGroup.add(new LineSegments2(geometry, lineToMMat));
    }

    const betaA = Math.atan2(a, m);
    const betaB = Math.atan2(b, m);

    const arcRadius = 0.45 * Math.min(1, m);
    stripGroup.add(arcLine(M, arcRadius, Math.PI, Math.PI - betaA, arcMat1));
    stripGroup.add(arcLine(M, arcRadius, Math.PI, Math.PI - betaB, arcMat2));

    const mid1 = betaA / 2;
    const mid2 = betaB / 2;
    const labelOffset = arcRadius + 0.25;
    labelTheta1.position.set(
        0,
        M.y - labelOffset * Math.cos(mid1),
        M.z + labelOffset * Math.sin(mid1),
    );
    labelTheta2.position.set(
        0,
        M.y - labelOffset * Math.cos(mid2),
        M.z + labelOffset * Math.sin(mid2),
    );

    const toDeg = (rad) => `${((rad * 180) / Math.PI).toFixed(1)}°`;
    readout.theta1 = toDeg(betaA);
    readout.theta2 = toDeg(betaB);

    buildDE(P, M);
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
    paintLabel(labelA, "a", next.blue);
    paintLabel(labelB, "b", next.blue);
    paintLabel(labelSectionZ, "z", next.yellow);
    paintLabel(labelTheta1, "θ₁", next.red);
    paintLabel(labelTheta2, "θ₂", next.green);
    paintLabel(labelDE, "dE", next.fg);
    for (const grid of grids) {
        tintGrid(grid, next.grey);
    }
    stripMaterial.color.setHex(next.blue);
    stripEdgeMat.color.setHex(next.blue);
    highlightMaterial.color.setHex(next.yellow);
    highlightEdgeMat.color.setHex(next.yellow);
    lineToMMat.color.setHex(next.yellow);
    edgeToMMat.color.setHex(next.purple);
    radialMat.color.setHex(next.grey);
    arcMat1.color.setHex(next.red);
    arcMat2.color.setHex(next.green);
    dEMat.color.setHex(next.fg);
    pointMaterial.color.setHex(next.fg);
    arrowHeadMaterial.color.setHex(next.fg);
    buildStrip();
}

const readout = { theta1: "", theta2: "" };

const gui = new GUI();
const stripFolder = gui.addFolder("strip");
stripFolder.add(params, "a", -3, 3, 0.1).onChange(buildStrip);
stripFolder.add(params, "b", -3, 3, 0.1).onChange(buildStrip);
const sectionFolder = gui.addFolder("section");
sectionFolder.add(params, "z", -3, 3, 0.05).onChange(buildStrip);
sectionFolder.add(params, "dz", 0.01, 1, 0.01).onChange(buildStrip);
sectionFolder.add(params, "m", 0.5, 6, 0.1).onChange(buildStrip);
sectionFolder.add(params, "lineSamplesX", 1, 9, 1).onChange(buildStrip);
sectionFolder.add(params, "lineSamplesZ", 1, 12, 1).onChange(buildStrip);
sectionFolder.add(params, "showSectionLines").onChange(buildStrip);
const anglesFolder = gui.addFolder("angles");
anglesFolder.add(readout, "theta1").name("θ₁").listen().disable();
anglesFolder.add(readout, "theta2").name("θ₂").listen().disable();
gui.add(params, "showAxes").name("axes").onChange(setAxesVisible);
const gridController = gui.add(params, "showGrid").name("grid").onChange(setGridsVisible);

setGridsVisible(params.showGrid);

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
