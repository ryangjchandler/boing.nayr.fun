import vs from './glsl/main.vert'
import fs from './glsl/main.frag'

// Constants
const numSegments = 360;
const baseRadius = 0.2;
const springConstant = 0.15;
const damping = 0.1;
const spread = 0.3;
const devicePixelRatioValue = devicePixelRatio || 1;
const colorVariants = [
  "#3fa9f5", // Original blue
  "#ff0000", // Red
  "#dc143c", // Crimson
  "#00ff00", // Lime
  "#32cd32", // LimeGreen
  "#ffa500", // Orange
  "#ff4500", // OrangeRed
  "#800080", // Purple
  "#9932cc", // DarkOrchid
  "#ff69b4", // HotPink
  "#00ffff", // Cyan
  "#ffff00"  // Yellow
];

// Global variables
let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let program: WebGLProgram;
let radii: Float32Array;
let velocities: Float32Array;
let vertices: Float32Array;
let vertexBuffer: WebGLBuffer;
let attributePosition: number;
let isDragging = false;
let dragIndex = -1;
let uniformTime: WebGLUniformLocation;
let uniformResolution: WebGLUniformLocation;
let uniformBaseColor: WebGLUniformLocation;
let startTime: number;

// Utility functions
function createShader(source: string, type: number): WebGLShader {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    console.error(gl.getShaderInfoLog(shader));
  return shader;
}

function createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(vertexSource, gl.VERTEX_SHADER));
  gl.attachShader(program, createShader(fragmentSource, gl.FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.error(gl.getProgramInfoLog(program));
  return program;
}

function hexToRgbNormalized(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

// Initialization functions
function initializeCanvas() {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  gl = canvas.getContext("webgl");
  if (!gl) alert("WebGL not supported");
}

function resize() {
  canvas.width = innerWidth * devicePixelRatioValue;
  canvas.height = innerHeight * devicePixelRatioValue;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

function initializeShaders() {
  program = createProgram(vs, fs);
  gl.useProgram(program);
}

function initializeGeometry() {
  radii = new Float32Array(numSegments + 1);
  velocities = new Float32Array(numSegments + 1);
  for (let i = 0; i <= numSegments; i++) radii[i] = baseRadius;
  vertices = new Float32Array((numSegments + 2) * 2);

  vertexBuffer = gl.createBuffer();
  attributePosition = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.enableVertexAttribArray(attributePosition);
  gl.vertexAttribPointer(attributePosition, 2, gl.FLOAT, false, 0, 0);
}

function pickIndex(event: MouseEvent | Touch): number {
  const rect = canvas.getBoundingClientRect();
  const x = (((event.clientX - rect.left) * devicePixelRatioValue) / canvas.width) * 2 - 1;
  const y =
    ((canvas.height - (event.clientY - rect.top) * devicePixelRatioValue) / canvas.height) * 2 - 1;
  const angle = Math.atan2(y, x);
  const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
  return Math.round((normalizedAngle / (2 * Math.PI)) * numSegments);
}

function setupEventListeners() {
  addEventListener("resize", resize);
  resize();

  canvas.addEventListener("mousedown", (event: MouseEvent) => {
    isDragging = true;
    canvas.classList.add("dragging");
    dragIndex = pickIndex(event);
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    canvas.classList.remove("dragging");
    dragIndex = -1;
  });

  canvas.addEventListener("mousemove", (event: MouseEvent) => {
    if (isDragging && dragIndex >= 0) {
      const rect = canvas.getBoundingClientRect();
      const x = (((event.clientX - rect.left) * devicePixelRatioValue) / canvas.width) * 2 - 1;
      const y =
        ((canvas.height - (event.clientY - rect.top) * devicePixelRatioValue) / canvas.height) * 2 - 1;
      const targetRadius = Math.min(0.3, Math.hypot(x, y));
      const radiusBoost = Math.max(baseRadius, targetRadius);
      const range = 8;
      for (let offset = -range; offset <= range; offset++) {
        const index = (dragIndex + offset + numSegments + 1) % (numSegments + 1);
        const falloff = 0.5 * (1 + Math.cos(Math.PI * offset / range));
        radii[index] = baseRadius + (radiusBoost - baseRadius) * falloff;
      }
    }
  });

  canvas.addEventListener("touchstart", (event: TouchEvent) => {
    isDragging = true;
    dragIndex = pickIndex(event.touches[0]);
  });

  canvas.addEventListener("touchend", () => {
    isDragging = false;
    dragIndex = -1;
  });

  canvas.addEventListener(
    "touchmove",
    (event: TouchEvent) => {
      if (isDragging && dragIndex >= 0) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (((touch.clientX - rect.left) * devicePixelRatioValue) / canvas.width) * 2 - 1;
        const y =
          ((canvas.height - (touch.clientY - rect.top) * devicePixelRatioValue) / canvas.height) * 2 - 1;
        const targetRadius = Math.min(0.3, Math.hypot(x, y));
        const radiusBoost = Math.max(baseRadius, targetRadius);
        const range = 8;
        for (let offset = -range; offset <= range; offset++) {
          const index = (dragIndex + offset + numSegments + 1) % (numSegments + 1);
          const falloff = 0.5 * (1 + Math.cos(Math.PI * offset / range));
          radii[index] = baseRadius + (radiusBoost - baseRadius) * falloff;
        }
      }
      event.preventDefault();
    },
    { passive: false }
  );
}

function setupUniforms() {
  uniformTime = gl.getUniformLocation(program, "uTime");
  uniformResolution = gl.getUniformLocation(program, "uResolution");
  uniformBaseColor = gl.getUniformLocation(program, "uBaseColor");
  const randomColor = colorVariants[Math.floor(Math.random() * colorVariants.length)];
  gl.uniform3fv(uniformBaseColor, new Float32Array(hexToRgbNormalized(randomColor)));
}

// Physics and geometry update functions
function updatePhysics() {
  if (!isDragging) {
    for (let i = 0; i <= numSegments; i++) {
      const displacement = radii[i] - baseRadius;
      const acceleration = -springConstant * displacement - damping * velocities[i];
      velocities[i] += acceleration;
      radii[i] += velocities[i];
    }
  }
  // Always apply spread and smoothing for ripple
  const spreaded = radii.slice();
  for (let i = 0; i <= numSegments; i++) {
    const leftIndex = i === 0 ? numSegments : i - 1;
    const rightIndex = i === numSegments ? 0 : i + 1;
    spreaded[i] += spread * (radii[leftIndex] - radii[i] + (radii[rightIndex] - radii[i]));
  }
  radii.set(spreaded);

  // Smooth with neighbor averaging
  const smoothed = radii.slice();
  for (let i = 0; i <= numSegments; i++) {
    const leftIndex = i === 0 ? numSegments : i - 1;
    const rightIndex = i === numSegments ? 0 : i + 1;
    smoothed[i] = 0.25 * radii[leftIndex] + 0.5 * radii[i] + 0.25 * radii[rightIndex];
  }
  radii.set(smoothed);
  // Clamp radii to prevent negative values
  for (let i = 0; i <= numSegments; i++) {
    radii[i] = Math.max(0, radii[i]);
  }
}

function updateVertices() {
  vertices[0] = 0;
  vertices[1] = 0;
  for (let i = 0; i <= numSegments; i++) {
    const angle = (i / numSegments) * 2 * Math.PI;
    vertices[(i + 1) * 2] = Math.cos(angle) * radii[i];
    vertices[(i + 1) * 2 + 1] = Math.sin(angle) * radii[i];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
}

// Main render loop
function renderLoop(currentTime: number) {
  const elapsedTime = (currentTime - startTime) * 0.001;
  updatePhysics();
  updateVertices();
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(uniformTime, elapsedTime);
  gl.uniform2f(uniformResolution, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
  requestAnimationFrame(renderLoop);
}

// Initialization
initializeCanvas();
initializeShaders();
initializeGeometry();
setupEventListeners();
setupUniforms();
startTime = performance.now();
renderLoop(performance.now());
