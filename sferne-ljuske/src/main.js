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
createDemoTitle("Sferne ljuske");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);

camera.position.set(3, 3, 3);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
bindViewControls(camera, controls);

scene.add(new THREE.AmbientLight(0xffffff, 0.75));

const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(5, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
fillLight.position.set(-4, -3, 2);
scene.add(fillLight);

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
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
    }));
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

const axes = new THREE.AxesHelper(2);
scene.add(axes);

const labelX = makeLabel("x", colors.red);
labelX.position.set(2.2, 0, 0);
scene.add(labelX);

const labelY = makeLabel("y", colors.green);
labelY.position.set(0, 2.2, 0);
scene.add(labelY);

const labelZ = makeLabel("z", colors.blue);
labelZ.position.set(0, 0, 2.2);
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
    r: 0.5,
    dr: 0.05,
    x0: 0.3,
    showAxes: true,
    showGrid: true,
};

const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), params.x0);
const clipPlanes = [clipPlane];

const SPHERE_SEG_W = 64;
const SPHERE_SEG_H = 48;
const CAP_SEGMENTS = 96;

const unitSphereMat = new THREE.MeshPhongMaterial({
    color: colors.blue,
    transparent: true,
    opacity: 0.3,
    shininess: 12,
    specular: 0x222222,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: clipPlanes,
});

const huskMat = new THREE.MeshPhongMaterial({
    color: colors.yellow,
    emissive: colors.yellow,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.4,
    shininess: 12,
    specular: 0x222222,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: clipPlanes,
});

const sphereCapMat = new THREE.MeshBasicMaterial({
    color: colors.blue,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const huskCapMat = new THREE.MeshBasicMaterial({
    color: colors.yellow,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const sphereRimMat = new THREE.LineBasicMaterial({ color: colors.blue });
const huskRimMat = new THREE.LineBasicMaterial({ color: colors.yellow });

const unitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, SPHERE_SEG_W, SPHERE_SEG_H),
    unitSphereMat,
);
scene.add(unitSphere);

const huskGroup = new THREE.Group();
scene.add(huskGroup);

const capsGroup = new THREE.Group();
scene.add(capsGroup);

function huskRadii() {
    const inner = Math.max(0, params.r);
    const outer = Math.min(1, params.r + Math.max(params.dr, 0));
    return { inner, outer };
}

function crossRadius(radius, x0) {
    const d = radius * radius - x0 * x0;
    return d > 1e-8 ? Math.sqrt(d) : 0;
}

function disposeObject(object) {
    object.geometry?.dispose();
}

function clearGroup(group) {
    while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        disposeObject(child);
    }
}

function rebuildHusk() {
    clearGroup(huskGroup);

    const { inner, outer } = huskRadii();
    if (outer <= 1e-4) return;

    const outerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(outer, SPHERE_SEG_W, SPHERE_SEG_H),
        huskMat,
    );
    huskGroup.add(outerMesh);

    if (inner > 1e-4) {
        const innerMesh = new THREE.Mesh(
            new THREE.SphereGeometry(inner, SPHERE_SEG_W, SPHERE_SEG_H),
            huskMat,
        );
        huskGroup.add(innerMesh);
    }
}

function makeCapCircle(radius, material) {
    const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, CAP_SEGMENTS),
        material,
    );
    mesh.rotation.y = Math.PI / 2;
    return mesh;
}

function makeCapRing(innerRadius, outerRadius, material) {
    const mesh = new THREE.Mesh(
        new THREE.RingGeometry(innerRadius, outerRadius, CAP_SEGMENTS),
        material,
    );
    mesh.rotation.y = Math.PI / 2;
    return mesh;
}

function makeRim(radius, x, material) {
    const points = [];
    for (let i = 0; i <= CAP_SEGMENTS; i++) {
        const t = (i / CAP_SEGMENTS) * Math.PI * 2;
        points.push(new THREE.Vector3(
            x,
            radius * Math.cos(t),
            radius * Math.sin(t),
        ));
    }
    return new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        material,
    );
}

function rebuildSlice() {
    clearGroup(capsGroup);
    clipPlane.constant = params.x0;

    const x0 = params.x0;
    const capX = x0 - 1e-3;
    const { inner, outer } = huskRadii();

    const sphereR = crossRadius(1, x0);
    const huskOuterR = crossRadius(outer, x0);
    const huskInnerR = crossRadius(inner, x0);

    if (sphereR > 1e-4) {
        const disk = makeCapCircle(sphereR, sphereCapMat);
        disk.position.x = capX;
        capsGroup.add(disk);
        capsGroup.add(makeRim(sphereR, capX, sphereRimMat));
    }

    if (huskOuterR > 1e-4) {
        if (huskInnerR > 1e-4 && huskInnerR < huskOuterR - 1e-5) {
            const ring = makeCapRing(huskInnerR, huskOuterR, huskCapMat);
            ring.position.x = capX;
            capsGroup.add(ring);
            capsGroup.add(makeRim(huskInnerR, capX, huskRimMat));
        } else {
            const disk = makeCapCircle(huskOuterR, huskCapMat);
            disk.position.x = capX;
            capsGroup.add(disk);
        }
        capsGroup.add(makeRim(huskOuterR, capX, huskRimMat));
    }
}

function rebuildHuskAndSlice() {
    rebuildHusk();
    rebuildSlice();
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
    for (const grid of grids) {
        tintGrid(grid, next.grey);
    }

    unitSphereMat.color.setHex(next.blue);
    huskMat.color.setHex(next.yellow);
    huskMat.emissive.setHex(next.yellow);
    sphereCapMat.color.setHex(next.blue);
    huskCapMat.color.setHex(next.yellow);
    sphereRimMat.color.setHex(next.blue);
    huskRimMat.color.setHex(next.yellow);
}

const gui = new GUI();

const huskFolder = gui.addFolder("Husk");
huskFolder.add(params, "r", 0, 0.95, 0.01).onChange(rebuildHuskAndSlice);
huskFolder.add(params, "dr", 0.01, 0.5, 0.01).name("dr").onChange(rebuildHuskAndSlice);
huskFolder.open();

const sliceFolder = gui.addFolder("Slice");
sliceFolder.add(params, "x0", -1, 1, 0.01).name("x0").onChange(rebuildSlice);
sliceFolder.open();

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
rebuildHuskAndSlice();
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
