import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

const colors = {
    background: 0x232A2E,
    background_dim: 0x232A2E,
    grey: 0x7A8478,
    red: 0xE67E80,
    yellow: 0xDBBC7F,
    green: 0xA7C080,
    blue: 0x7FBBB3,
    purple: 0xD699B6,
    fg: 0xD3C6AA,
    statusline: 0xA7C080
};

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(4.5, 1.5, 2);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(colors.background);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

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

/* ---------------- GRIDS ---------------- */
// 
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
    div.style.color = "#" + color.toString(16).padStart(6, "0");
    div.style.fontSize = size;
    div.style.fontWeight = "bold";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.userSelect = "none";
    div.style.pointerEvents = "none";
    div.style.textShadow = "0 0 4px rgba(0, 0, 0, 0.8)";

    return new CSS2DObject(div);
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
const a = 1

const cubeGeometry = new THREE.BoxGeometry(
	a,a,a
);

const cubeMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
});

const cube = new THREE.Mesh(
	cubeGeometry,
	cubeMaterial,
);

cube.position.set(
	a/2, a/2, a/2
);

scene.add(cube);

/* ---------------- CUBE EDGES ---------------- */
const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);

const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
});

const edges = new THREE.LineSegments(
    edgesGeometry,
    edgesMaterial
);

edges.position.copy(cube.position);

scene.add(edges);


/* ---------------- POINT ---------------- */

const LABEL_OFFSET = new THREE.Vector3(0.12, 0.12, 0.12);

function createLabeledPoint(
    position: THREE.Vector3,
    label: string,
    color = colors.purple,
    radius = 0.03,
    labelOffset = LABEL_OFFSET,
): THREE.Group {
    const group = new THREE.Group();

    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const point = new THREE.Mesh(geometry, material);
    group.add(point);

    const labelObj = makeLabel(label, color);
    labelObj.position.copy(labelOffset);
    group.add(labelObj);

    group.position.copy(position);
    scene.add(group);

    return group;
}

const A = new THREE.Vector3(a, 0, 0);
const B = new THREE.Vector3(0, a, 0);
const C = new THREE.Vector3(0, 0, a);
const M = new THREE.Vector3(a, a, a);

createLabeledPoint(A, "A", colors.green);
createLabeledPoint(B, "B", colors.blue);
createLabeledPoint(C, "C", colors.red);
createLabeledPoint(M, "M", colors.purple);

/* ---------------- PLANE HIGHLIGHTS ---------------- */

function createGridPlaneTexture(color: number): THREE.CanvasTexture {
    const resolution = 256;
    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = resolution;

    const ctx = canvas.getContext("2d")!;
    const hex = "#" + color.toString(16).padStart(6, "0");
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
    color: number,
    size = 2.5,
): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
        map: createGridPlaneTexture(color),
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.visible = false;
    plane.renderOrder = 1;

    const epsilon = 1e-6;
    if (Math.abs(p1.x - p2.x) < epsilon) {
        plane.rotation.y = Math.PI / 2;
        plane.position.set(p1.x, a / 2, a / 2);
    } else if (Math.abs(p1.y - p2.y) < epsilon) {
        plane.rotation.x = Math.PI / 2;
        plane.position.set(a / 2, p1.y, a / 2);
    } else if (Math.abs(p1.z - p2.z) < epsilon) {
        plane.position.set(a / 2, a / 2, p1.z);
    }

    const borderGeometry = new THREE.EdgesGeometry(geometry);
    const border = new THREE.LineSegments(
        borderGeometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
    );
    plane.add(border);

    scene.add(plane);
    return plane;
}

const planeToggles: Record<string, THREE.Mesh> = {
    a: createPlaneThroughPoints(A, M, colors.green),
    b: createPlaneThroughPoints(B, M, colors.blue),
    c: createPlaneThroughPoints(C, M, colors.red),
};

window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    const key = e.key.toLowerCase();

    if (key === "g") {
        const visible = !grids[0].visible;
        for (const grid of grids) {
            grid.visible = visible;
        }
        return;
    }

    const plane = planeToggles[key];
    if (plane) {
        plane.visible = !plane.visible;
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

const VECTOR_LENGTH = 0.7;

function createFieldVector(
    point: THREE.Vector3,
    origin: THREE.Vector3,
    color: THREE.ColorRepresentation,
    length = VECTOR_LENGTH,
): THREE.ArrowHelper {
    const direction = new THREE.Vector3()
        .subVectors(origin, point)
        .normalize();

    return new THREE.ArrowHelper(direction, origin, length, color);
}

const pairs: [THREE.Vector3, THREE.Vector3, number][] = [
    [A, M, colors.green],
    [B, M, colors.blue],
    [C, M, colors.red],
];

const unitVectors: THREE.Vector3[] = [];

for (const [point, origin, color] of pairs) {
    scene.add(createDashedLine(point, origin, color));

    const direction = new THREE.Vector3()
        .subVectors(origin, point)
        .normalize();
    unitVectors.push(direction.clone());

    scene.add(createFieldVector(point, origin, color));
}

// const sumVector = new THREE.Vector3();
// for (const v of unitVectors) {
//     sumVector.add(v);
// }
//
// scene.add(
//     new THREE.ArrowHelper(
//         sumVector.clone().normalize(),
//         M,
//         sumVector.length(),
//         colors.yellow,
//     ),
// );



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
