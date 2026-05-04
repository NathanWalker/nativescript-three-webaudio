import { Component, inject, NO_ERRORS_SCHEMA } from "@angular/core";
import {
  NativeScriptCommonModule,
  NativeScriptRouterModule,
} from "@nativescript/angular";
import { Canvas } from "@nativescript/canvas";
// import { Canvas } from "@nativescript/canvas";

import {
  Scene,
  PerspectiveCamera,
  CubeTextureLoader,
  Color,
  Fog,
  DirectionalLight,
  PlaneGeometry,
  HemisphereLight,
  MeshPhongMaterial,
  GridHelper,
  Mesh,
  AudioListener,
  PositionalAudio,
  BoxGeometry,
  MeshBasicMaterial,
  WebGLRenderer,
} from "three";
//@ts-ignore
import { PositionalAudioHelper } from "three/addons/helpers/PositionalAudioHelper";
//@ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { WebGPURenderer } from "three/webgpu";
import { GridLayout, Page } from "@nativescript/core";

@Component({
  selector: "Home",
  templateUrl: "./home.component.html",
  imports: [NativeScriptCommonModule, NativeScriptRouterModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HomeComponent {
  scene: Scene | undefined;
  camera: PerspectiveCamera | undefined;
  renderer: WebGPURenderer | WebGLRenderer | undefined;
  canvas: Canvas | undefined;
  animationLoopStarted = false;
  root = "~/app/assets";
  page = inject(Page);

  ngOnInit(): void {
    this.page.backgroundColor = 'black';
    this.page.androidOverflowEdge = "top,bottom";
  }

  onLoaded(event: any) {
    const grid = event.object as GridLayout;
    const canvas = new Canvas();
    canvas.on("ready", this.onReady.bind(this));
    grid.addChild(canvas);
  }

  onReady(event: any) {
    this.canvas = event.object as Canvas;
    this.audioOrientation(this.canvas);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer || !this.canvas) return;
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      false,
    );
  }

  animate() {
    try {
      if (!this.renderer || !this.scene || !this.camera) return;
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      this.logOrientationError("render", error);
      this.stopAnimationLoop();
    }
  }

  logOrientationError(scope: string, error: unknown) {
    console.error(`webgl_orientation ${scope} error:`, error);
  }

  startAnimationLoop() {
    if (!this.renderer || this.animationLoopStarted) return;
    this.animationLoopStarted = true;
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  stopAnimationLoop() {
    if (!this.renderer || !this.animationLoopStarted) return;
    this.animationLoopStarted = false;
    this.renderer.setAnimationLoop(null);
  }

  audioOrientation(canvas: Canvas) {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    // const startButton = document.getElementById( 'startButton' );
    // startButton.addEventListener( 'click', init );

    // const overlay = document.getElementById( 'overlay' );
    // overlay.remove();

    // const container = document.getElementById( 'container' );

    //

    this.camera = new PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(3, 2, 3);

    const reflectionCube = new CubeTextureLoader()
      .setPath(`${this.root}/textures/cube/SwedishRoyalCastle/`)
      .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);

    this.scene = new Scene();
    this.scene.background = new Color(0xa0a0a0);
    this.scene.fog = new Fog(0xa0a0a0, 2, 20);

    //

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.position.set(5, 5, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 1;
    dirLight.shadow.camera.bottom = -1;
    dirLight.shadow.camera.left = -1;
    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 20;
    this.scene.add(dirLight);

    // this.scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

    //

    const mesh = new Mesh(
      new PlaneGeometry(50, 50),
      new MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const grid = new GridHelper(50, 50, 0xc1c1c1, 0xc1c1c1);
    this.scene.add(grid);

    //

    const listener = new AudioListener();
    this.camera.add(listener);

    const audioElement = document.createElement("audio");
    audioElement.src = `${this.root}/sounds/376737_Skullbeatz___Bad_Cat_Maste.${__ANDROID__ ? "ogg" : "mp3"}`;

    const positionalAudio = new PositionalAudio(listener);
    let mediaSourceAttached = false;
    try {
      positionalAudio.setMediaElementSource(audioElement);
      mediaSourceAttached = true;
    } catch (error) {
      this.logOrientationError("setMediaElementSource", error);
    }
    positionalAudio.setRefDistance(1);

    if (mediaSourceAttached) {
      try {
        const context = listener.context;
        const resumeResult =
          context?.state !== "running" && typeof context?.resume === "function"
            ? context.resume()
            : null;
        if (resumeResult && typeof (resumeResult as any).catch === "function") {
          (resumeResult as Promise<void>).catch((error) => {
            this.logOrientationError("audioContext.resume", error);
          });
        }
      } catch (error) {
        this.logOrientationError("audioContext.resume", error);
      }
    }

    try {
      const playResult = audioElement.play();
      if (playResult && typeof (playResult as any).catch === "function") {
        (playResult as Promise<void>).catch((error) => {
          this.logOrientationError("audioElement.play", error);
        });
      }
    } catch (error) {
      this.logOrientationError("audioElement.play", error);
    }

    // Always enable directional cone for positional occlusion
    positionalAudio.setDirectionalCone(180, 230, 0.1);

    const helper = new PositionalAudioHelper(positionalAudio, 0.1);
    positionalAudio.add(helper);

    //

    if (__APPLE__) {
      this.renderer = new WebGPURenderer({
        canvas: canvas as any,
        antialias: true,
      });
    }

    if (__ANDROID__) {
      this.renderer = new WebGLRenderer({
        canvas: canvas as any,
        antialias: true,
      });
    }

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    //container.appendChild( renderer.domElement );

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      `${this.root}/models/gltf/BoomBox.glb`,
      (gltf) => {
        try {
          const boomBox = gltf.scene;
          boomBox.position.set(0, 0.2, 0);
          boomBox.scale.set(20, 20, 20);

          boomBox.traverse(function (object) {
            if (object.isMesh) {
              object.material.envMap = reflectionCube;
              object.geometry.rotateY(-Math.PI);
              object.castShadow = true;
            }
          });

          boomBox.add(positionalAudio);
          this.scene.add(boomBox);
        } catch (error) {
          this.logOrientationError("gltf onLoad", error);
        } finally {
          this.startAnimationLoop();
        }
      },
      undefined,
      (error) => {
        this.logOrientationError("gltf load", error);
        this.startAnimationLoop();
      },
    );

    // sound is damped behind this wall

    const wallGeometry = new BoxGeometry(2, 1, 0.1);
    const wallMaterial = new MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
    });

    const wall = new Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 0.5, -0.5);
    this.scene.add(wall);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.update();
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = 0.5 * Math.PI;

    //		controls.target.set(0, 0, -0.2);

    //

    window.addEventListener("resize", this.onWindowResize.bind(this));
    this.startAnimationLoop();
  }
}
