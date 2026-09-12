import "./style.css";
import "../../shared/theme-toggle.css";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
    bindViewControls,
    createDemoTitle,
    isTypingTarget,
} from "../../shared/demo-chrome.js";
import {
    createThemeToggle,
    getTheme,
    hexColor,
    palette,
} from "../../shared/theme.js";

createThemeToggle();
createDemoTitle("Electric Field — Cube");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);

camera.position.set(4.5, 2, 2.5);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
bindViewControls(camera, controls);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "fixed";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

function tintGrid(grid: THREE.GridHelper, color: number) {
    const attr = grid.geometry.getAttribute("color");
    if (!attr) return;

    const c = new THREE.Color(color);
    for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
}

function setLabelColor(label: CSS2DObject, color: number) {
    const theme = getTheme();
    label.element.style.color = hexColor(color);
    label.element.style.textShadow =
        theme === "light"
            ? "0 0 4px rgba(253, 246, 227, 0.9)"
            : "0 0 4px rgba(0, 0, 0, 0.8)";
}

/* ---------------- GRIDS ---------------- */

const colors = palette();

const gridXYBack = new THREE.GridHelper(2, 10, colors.grey, colors.grey);
gridXYBack.position.set(1, 0, 1);
scene.add(gridXYBack);

const gridXZBack = new THREE.GridHelper(2, 10, colors.grey, colors.grey);
gridXZBack.position.set(1, 1, 0);
gridXZBack.rotateX(Math.PI / 2);
scene.add(gridXZBack);

const gridYZBack = new THREE.GridHelper(2, 10, colors.grey, colors.grey);
gridYZBack.position.set(0, 1, 1);
gridYZBack.rotateZ(Math.PI / 2);
scene.add(gridYZBack);

const grids = [gridXYBack, gridXZBack, gridYZBack];

/* ---------------- AXES ---------------- */

const axes = new THREE.AxesHelper(2.2);
scene.add(axes);

function makeLabel(
    text: string,
    color: number,
    size = "16px",
): CSS2DObject {
    const div = document.createElement("div");
    div.textContent = text;
    div.style.fontSize = size;
    div.style.fontWeight = "bold";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.userSelect = "none";
    div.style.pointerEvents = "none";

    const label = new CSS2DObject(div);
    setLabelColor(label, color);
    return label;
}

const labelX = makeLabel("x", colors.red, "18px");
labelX.position.set(2.4, 0, 0);
scene.add(labelX);

const labelY = makeLabel("y", colors.green, "18px");
labelY.position.set(0, 2.4, 0);
scene.add(labelY);

const labelZ = makeLabel("z", colors.blue, "18px");
labelZ.position.set(0, 0, 2.4);
scene.add(labelZ);

/* ---------------- CUBE ---------------- */
const a = 1;

const cubeGeometry = new THREE.BoxGeometry(a, a, a);

const cubeMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
});

const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(a / 2, a / 2, a / 2);
scene.add(cube);

/* ---------------- CUBE EDGES ---------------- */
const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);

const edgesMaterial = new THREE.LineBasicMaterial({
    color: colors.edge,
});

const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
edges.position.copy(cube.position);
scene.add(edges);

/* ---------------- POINT ---------------- */

const LABEL_OFFSET = new THREE.Vector3(0.12, 0.12, 0.12);

function createLabeledPoint(
    position: THREE.Vector3,
    label: string,
    colorKey: "red" | "green" | "blue" | "purple",
    radius = 0.03,
    labelOffset = LABEL_OFFSET,
): THREE.Group {
    const group = new THREE.Group();
    const color = palette()[colorKey];

    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const point = new THREE.Mesh(geometry, material);
    group.add(point);

    const labelObj = makeLabel(label, color);
    labelObj.position.copy(labelOffset);
    group.add(labelObj);

    group.position.copy(position);
    group.userData.colorKey = colorKey;
    group.userData.pointMaterial = material;
    group.userData.label = labelObj;
    scene.add(group);

    return group;
}

const A = new THREE.Vector3(a, 0, 0);
const B = new THREE.Vector3(0, a, 0);
const C = new THREE.Vector3(0, 0, a);
const M = new THREE.Vector3(a, a, a);

const labeledPoints = [
    createLabeledPoint(A, "A", "green"),
    createLabeledPoint(B, "B", "blue"),
    createLabeledPoint(C, "C", "red"),
    createLabeledPoint(M, "M", "purple"),
];

/* ---------------- PLANE HIGHLIGHTS ---------------- */

function createGridPlaneTexture(color: number): THREE.CanvasTexture {
    const resolution = 256;
    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = resolution;

    const ctx = canvas.getContext("2d")!;
    const hex = hexColor(color);
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    ctx.fillRect(0, 0, resolution, resolution);

    const cells = 8;
    const step = resolution / cells;

    ctx.strokeStyle = hex;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;

    for (let i = 0; i <= cells; i++) {
        const pos = i * step;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, resolution);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(resolution, pos);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    return texture;
}

function createPlaneThroughPoints(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    colorKey: "red" | "green" | "blue",
    size = 2.5,
): THREE.Mesh {
    const color = palette()[colorKey];
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
        map: createGridPlaneTexture(color),
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const delta = 0.0001;
    const plane = new THREE.Mesh(geometry, material);
    plane.visible = false;
    plane.renderOrder = 1;

    const epsilon = 1e-6;
    if (Math.abs(p1.x - p2.x) < epsilon) {
        plane.rotation.y = Math.PI / 2;
        plane.position.set(p1.x + delta, a / 2, a / 2);
    } else if (Math.abs(p1.y - p2.y) < epsilon) {
        plane.rotation.x = Math.PI / 2;
        plane.position.set(a / 2, p1.y + delta, a / 2);
    } else if (Math.abs(p1.z - p2.z) < epsilon) {
        plane.position.set(a / 2, a / 2, p1.z + delta);
    }

    const borderGeometry = new THREE.EdgesGeometry(geometry);
    const border = new THREE.LineSegments(
        borderGeometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
    );
    plane.add(border);
    plane.userData.colorKey = colorKey;
    plane.userData.border = border;

    scene.add(plane);
    return plane;
}

const planeToggles: Record<string, THREE.Mesh> = {
    a: createPlaneThroughPoints(A, M, "green"),
    b: createPlaneThroughPoints(B, M, "blue"),
    c: createPlaneThroughPoints(C, M, "red"),
};

const params = {
    showAxes: true,
    showGrid: true,
    planeA: false,
    planeB: false,
    planeC: false,
};

function setAxesVisible(visible: boolean) {
    params.showAxes = visible;
    axes.visible = visible;
    labelX.visible = visible;
    labelY.visible = visible;
    labelZ.visible = visible;
}

function setGridsVisible(visible: boolean) {
    params.showGrid = visible;
    for (const grid of grids) {
        grid.visible = visible;
    }
}

function setPlaneVisible(key: "a" | "b" | "c", visible: boolean) {
    if (key === "a") params.planeA = visible;
    if (key === "b") params.planeB = visible;
    if (key === "c") params.planeC = visible;
    planeToggles[key].visible = visible;
}

const gui = new GUI();
gui.add(params, "showAxes").name("axes").onChange(setAxesVisible);
const gridController = gui.add(params, "showGrid").name("grid").onChange(setGridsVisible);
const planeAController = gui.add(params, "planeA").name("plane A").onChange((v: boolean) => setPlaneVisible("a", v));
const planeBController = gui.add(params, "planeB").name("plane B").onChange((v: boolean) => setPlaneVisible("b", v));
const planeCController = gui.add(params, "planeC").name("plane C").onChange((v: boolean) => setPlaneVisible("c", v));

window.addEventListener("keydown", (e) => {
    if (e.repeat || isTypingTarget(e)) return;

    const key = e.key.toLowerCase();

    if (key === "g") {
        setGridsVisible(!params.showGrid);
        gridController.updateDisplay();
        return;
    }

    if (key === "a" || key === "b" || key === "c") {
        const visible = !planeToggles[key].visible;
        setPlaneVisible(key, visible);
        if (key === "a") planeAController.updateDisplay();
        if (key === "b") planeBController.updateDisplay();
        if (key === "c") planeCController.updateDisplay();
    }
});

/* ---------------- DASHED LINES & VECTORS ---------------- */

function createDashedLine(
    pointA: THREE.Vector3,
    pointB: THREE.Vector3,
    color: THREE.ColorRepresentation,
): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        pointA,
        pointB,
    ]);

    const material = new THREE.LineDashedMaterial({
        color,
        dashSize: 0.05,
        gapSize: 0.05,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line;
}

const VECTOR_LENGTH = 0.6;

function createFieldVector(
    point: THREE.Vector3,
    origin: THREE.Vector3,
    color: THREE.ColorRepresentation,
    length = VECTOR_LENGTH,
): THREE.ArrowHelper {
    const direction = new THREE.Vector3()
        .subVectors(origin, point)
        .normalize();

    return new THREE.ArrowHelper(
        direction,
        origin,
        length,
        color,
        length * 0.2,
        length * 0.07,
    );
}

const pairs: [THREE.Vector3, THREE.Vector3, "red" | "green" | "blue"][] = [
    [A, M, "green"],
    [B, M, "blue"],
    [C, M, "red"],
];

const fieldVisuals = pairs.map(([point, origin, colorKey]) => {
    const color = palette()[colorKey];
    const line = createDashedLine(point, origin, color);
    const arrow = createFieldVector(point, origin, color);
    scene.add(line);
    scene.add(arrow);
    return { line, arrow, colorKey };
});

function applyTheme() {
    const next = palette();

    renderer.setClearColor(next.background);
    cubeMaterial.color.setHex(next.fg);
    edgesMaterial.color.setHex(next.edge);

    for (const grid of grids) {
        tintGrid(grid, next.grey);
    }

    setLabelColor(labelX, next.red);
    setLabelColor(labelY, next.green);
    setLabelColor(labelZ, next.blue);

    for (const group of labeledPoints) {
        const color = next[group.userData.colorKey as "red" | "green" | "blue" | "purple"];
        group.userData.pointMaterial.color.setHex(color);
        setLabelColor(group.userData.label, color);
    }

    for (const plane of Object.values(planeToggles)) {
        const color = next[plane.userData.colorKey as "red" | "green" | "blue"];
        const material = plane.material as THREE.MeshBasicMaterial;
        material.map?.dispose();
        material.map = createGridPlaneTexture(color);
        material.needsUpdate = true;
        (plane.userData.border.material as THREE.LineBasicMaterial).color.setHex(color);
    }

    for (const visual of fieldVisuals) {
        const color = next[visual.colorKey];
        (visual.line.material as THREE.LineDashedMaterial).color.setHex(color);
        visual.arrow.setColor(color);
    }
}

applyTheme();
window.addEventListener("themechange", applyTheme);

/* ---------------- START ---------------- */

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
