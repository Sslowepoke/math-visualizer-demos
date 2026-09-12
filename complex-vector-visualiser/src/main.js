import "./style.css";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

const currentColors = colors;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(4, 4, 4);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(colors.background);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

/* ---------------- AXES ---------------- */

const axes = new THREE.AxesHelper(3);
scene.add(axes);

function makeLabel(text, color) {

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 140);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({ map: texture });

    const sprite = new THREE.Sprite(material);

    sprite.scale.set(0.5, 0.5, 0.5);

    return sprite;

}

const labelX = makeLabel("Ex", colors.red);
labelX.position.set(3.2, 0, 0);
scene.add(labelX);

const labelY = makeLabel("Ey", colors.green);
labelY.position.set(0, 3.2, 0);
scene.add(labelY);

const labelZ = makeLabel("Ez", colors.blue);
labelZ.position.set(0, 0, 3.2);
scene.add(labelZ);

/* ---------------- GRIDS ---------------- */
// 
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

const params = {

    Ex: "-1+0j",
    Ey: "0+1j",
    Ez: "1+0j",

    omega: 2,

    showAxes: true,

		showGrid: true,

    showPolarPlane: false,

    showProjection: false,
    projectionPlane: "xOy",

    cameraPreset: "default"

};

/* ---------------- COMPLEX PARSER ---------------- */

function parseComplex(s) {
    s = String(s).replace(/\s/g, "").toLowerCase();

    if (!s) return { re: 0, im: 0 };
    if (s === "j" || s === "+j") return { re: 0, im: 1 };
    if (s === "-j") return { re: 0, im: -1 };

    const both = s.match(/^([+-]?(?:\d*\.?\d+)?)([+-](?:\d*\.?\d+)?)j$/);
    if (both) {
        const rePart = both[1];
        const imPart = both[2];
        const re = rePart === "" || rePart === "+" || rePart === "-"
            ? Number(`${rePart}1`) || 0
            : parseFloat(rePart);
        const im = imPart === "+" || imPart === "-"
            ? Number(`${imPart}1`)
            : parseFloat(imPart);
        return { re, im };
    }

    const imagOnly = s.match(/^([+-]?(?:\d*\.?\d+))j$/);
    if (imagOnly) return { re: 0, im: parseFloat(imagOnly[1]) };

    const real = parseFloat(s);
    if (!Number.isNaN(real)) return { re: real, im: 0 };

    return { re: 0, im: 0 };
}

/* ---------------- FIELD ---------------- */

function computeField(t) {

    const w = params.omega;

    const Ex = parseComplex(params.Ex);
    const Ey = parseComplex(params.Ey);
    const Ez = parseComplex(params.Ez);

    const x =
        Ex.re * Math.cos(w * t) -
        Ex.im * Math.sin(w * t);

    const y =
        Ey.re * Math.cos(w * t) -
        Ey.im * Math.sin(w * t);

    const z =
        Ez.re * Math.cos(w * t) -
        Ez.im * Math.sin(w * t);

    return new THREE.Vector3(x, y, z);

}

/* ---------------- MAIN VECTOR ---------------- */

const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    colors.green
);

scene.add(arrow);

function updateArrow(v) {

    const len = v.length();

    if (len < 1e-6) return;

    arrow.setDirection(v.clone().normalize());
    arrow.setLength(len);

}

/* ---------------- POLARIZATION PATH ---------------- */

let pathLine;

function rebuildPath() {

    if (pathLine) {
        scene.remove(pathLine);
        pathLine.geometry.dispose();
        pathLine.material.dispose();
        pathLine = null;
    }

    const points = [];
    const samples = 400;
    const omega = params.omega || 1e-8;
    const T = (2 * Math.PI) / omega;

    let maxR = 0;

    for (let i = 0; i <= samples; i++) {

        const t = i / samples * T;

        const p = computeField(t);

        maxR = Math.max(maxR, p.length());

        points.push(p);

    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({ color: colors.fg });

    pathLine = new THREE.Line(geometry, material);

    scene.add(pathLine);

    rebuildPolarPlane(points, maxR);

}

/* ---------------- POLARIZATION PLANE ---------------- */

let polarPlane;

function rebuildPolarPlane(points, scale) {

    if (polarPlane) {
        scene.remove(polarPlane);
        polarPlane.geometry.dispose();
        polarPlane.material.dispose();
        polarPlane = null;
    }

    if (!params.showPolarPlane) return;

    const v1 = points[50];
    const v2 = points[150];
    const normal = v1.clone().cross(v2);

    if (normal.lengthSq() < 1e-12) {
        return;
    }

    normal.normalize();

    const geom = new THREE.PlaneGeometry(scale * 3, scale * 3);

    const mat = new THREE.MeshBasicMaterial({
        color: colors.green,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });

    polarPlane = new THREE.Mesh(geom, mat);

    const q = new THREE.Quaternion();

    q.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal
    );

    polarPlane.setRotationFromQuaternion(q);

    scene.add(polarPlane);

}

/* ---------------- PROJECTION ---------------- */

const projectionArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    colors.red
);

scene.add(projectionArrow);

const projectionPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshBasicMaterial({
        color: colors.green,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    })
);

scene.add(projectionPlane);

const connectorLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3()
    ]),
    new THREE.LineBasicMaterial({
        color: colors.grey,
        transparent: true
    })
);

scene.add(connectorLine);

function updateProjection(v) {

    if (!params.showProjection) {

        projectionArrow.visible = false;
        projectionPlane.visible = false;
        connectorLine.visible = false;

        return;

    }

    projectionArrow.visible = true;
    projectionPlane.visible = true;
    connectorLine.visible = true;

    let p = v.clone();

    let planeColor, arrowColor;
    if (params.projectionPlane === "xOy") {
        p.z = 0;
        projectionPlane.rotation.set(0, 0, 0);
        planeColor = colors.blue;
        arrowColor = colors.blue;
    }
    if (params.projectionPlane === "xOz") {
        p.y = 0;
        projectionPlane.rotation.set(Math.PI / 2, 0, 0);
        planeColor = colors.purple;
        arrowColor = colors.purple;
    }
    if (params.projectionPlane === "yOz") {
        p.x = 0;
        projectionPlane.rotation.set(0, Math.PI / 2, 0);
        planeColor = colors.yellow;
        arrowColor = colors.yellow;
    }

    projectionPlane.material.color.set(planeColor);
    projectionArrow.setColor(arrowColor);

    const len = p.length();

    if (len > 1e-6) {

        projectionArrow.setDirection(p.clone().normalize());
        projectionArrow.setLength(len);

    }

    const pos = connectorLine.geometry.attributes.position;
    pos.setXYZ(0, v.x, v.y, v.z);
    pos.setXYZ(1, p.x, p.y, p.z);
    pos.needsUpdate = true;

}

/* ---------------- CAMERA PRESETS ---------------- */

function updateCamera() {

    if (params.cameraPreset === "xOy") {

        camera.position.set(0, 0, 6);
        camera.up.set(0, 0, 1);

    }

    else if (params.cameraPreset === "yOz") {

        camera.position.set(6, 0, 0);
        camera.up.set(0, 0, 1);

    }

    else if (params.cameraPreset === "xOz") {

        camera.position.set(0, 6, 0);
        camera.up.set(0, 0, 1);

    }

    else {

        camera.position.set(4, 4, 4);
        camera.up.set(0, 0, 1);

    }

    controls.update();

}

/* ---------------- GUI ---------------- */

const gui = new GUI();

gui.domElement.style.backgroundColor = '#' + currentColors.background_dim.toString(16).padStart(6, '0');

gui.add(params, "Ex").onFinishChange(rebuildPath);
gui.add(params, "Ey").onFinishChange(rebuildPath);
gui.add(params, "Ez").onFinishChange(rebuildPath);

gui.add(params, "omega", 0, 10).onFinishChange(rebuildPath);

gui.add(params, "showAxes").onChange(v => {

    axes.visible = v;
    labelX.visible = v;
    labelY.visible = v;
    labelZ.visible = v;

});

gui.add(params, "showGrid").onChange(v => {

		gridXYBack.visible = v;
		gridYZBack.visible = v;
		gridXZBack.visible = v;
});

gui.add(params, "showPolarPlane").onChange(rebuildPath);

gui.add(params, "showProjection");

gui.add(params, "projectionPlane", ["xOy", "xOz", "yOz"]);

gui.add(params, "cameraPreset", ["default", "xOy", "yOz", "xOz"])
    .onChange(updateCamera);

/* ---------------- START ---------------- */

rebuildPath();

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    const E = computeField(t);

    updateArrow(E);
    updateProjection(E);

    renderer.render(scene, camera);

}

animate();

window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

});
