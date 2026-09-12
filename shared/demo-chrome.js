export function isTypingTarget(event) {
  const tag = event.target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function createDemoTitle(text) {
  const title = document.createElement("h1");
  title.className = "demo-title";
  title.textContent = text;
  document.body.appendChild(title);
  document.title = text;
  return title;
}

export function bindViewControls(camera, controls) {
  const defaultUp = {
    x: camera.up.x,
    y: camera.up.y,
    z: camera.up.z,
  };
  controls.saveState();

  const defaultDistance = Math.hypot(
    camera.position.x - controls.target.x,
    camera.position.y - controls.target.y,
    camera.position.z - controls.target.z,
  );

  function restoreDefault() {
    // OrbitControls.reset() restores position/target/zoom, but not camera.up.
    camera.up.set(defaultUp.x, defaultUp.y, defaultUp.z);
    controls.reset();
    camera.up.set(defaultUp.x, defaultUp.y, defaultUp.z);
    controls.update();
  }

  function lookFrom(axis) {
    const distance = defaultDistance || 6;
    const target = controls.target;

    if (axis === "x") {
      camera.position.set(target.x + distance, target.y, target.z);
      camera.up.set(0, 0, 1);
    } else if (axis === "y") {
      camera.position.set(target.x, target.y + distance, target.z);
      camera.up.set(0, 0, 1);
    } else {
      camera.position.set(target.x, target.y, target.z + distance);
      camera.up.set(0, 1, 0);
    }

    camera.lookAt(target);
    controls.update();
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat || isTypingTarget(event)) return;

    if (event.code === "Space") {
      event.preventDefault();
      restoreDefault();
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "x") lookFrom("x");
    if (key === "y") lookFrom("y");
    if (key === "z") lookFrom("z");
  });
}
