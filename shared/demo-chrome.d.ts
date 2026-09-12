export function isTypingTarget(event: Event): boolean;
export function createDemoTitle(text: string): HTMLHeadingElement;
export function bindViewControls(
  camera: {
    position: { x: number; y: number; z: number; set(x: number, y: number, z: number): unknown };
    up: { x: number; y: number; z: number; set(x: number, y: number, z: number): unknown };
    lookAt(target: unknown): unknown;
  },
  controls: {
    target: { x: number; y: number; z: number };
    saveState(): void;
    reset(): void;
    update(): void;
  },
): void;
