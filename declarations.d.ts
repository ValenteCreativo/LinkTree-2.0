declare module "@microlink/react" {
  import { ComponentType } from "react";
  interface MicrolinkProps {
    url: string;
    size?: "small" | "normal" | "large";
    style?: React.CSSProperties;
    media?: string[];
    [key: string]: any;
  }
  const Microlink: ComponentType<MicrolinkProps>;
  export default Microlink;
}

declare module "three/examples/jsm/postprocessing/EffectComposer" {
    import { WebGLRenderer, Scene, Camera, WebGLRenderTarget } from "three";
    export class EffectComposer {
      constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
      renderToScreen: boolean;
      renderTarget1: WebGLRenderTarget;
      renderTarget2: WebGLRenderTarget;
      addPass(pass: any): void;
      render(delta?: number): void;
      setSize(width: number, height: number): void;
      setPixelRatio(ratio: number): void;
    }
  }
  
  declare module "three/examples/jsm/postprocessing/RenderPass" {
    import { Scene, Camera } from "three";
    export class RenderPass {
      constructor(scene: Scene, camera: Camera);
    }
  }
  
  declare module "three/examples/jsm/postprocessing/UnrealBloomPass" {
    import { Vector2 } from "three";
    export class UnrealBloomPass {
      constructor(
        resolution: Vector2,
        strength: number,
        radius: number,
        threshold: number
      );
      threshold: number;
      strength: number;
      radius: number;
    }
  }
  
  declare module "three/examples/jsm/postprocessing/FilmPass" {
    import { WebGLRenderer, Scene, Camera, WebGLRenderTarget } from "three";
    
    export class FilmPass {
      constructor(
        noiseIntensity?: number,
        scanlinesIntensity?: number,
        scanlinesCount?: number,
        grayscale?: boolean
      );
      render(
        renderer: WebGLRenderer,
        scene: Scene,
        camera: Camera,
        renderTarget?: WebGLRenderTarget,
        delta?: number
      ): void;
    }
  }
  
  declare module "three/examples/jsm/postprocessing/ShaderPass" {
    import { Material, WebGLRenderer, Scene, Camera, WebGLRenderTarget } from "three";
    
    export class ShaderPass {
      constructor(shader: any);
      uniforms: any;
      material: Material;
      render(
        renderer: WebGLRenderer,
        scene: Scene,
        camera: Camera,
        renderTarget?: WebGLRenderTarget,
        delta?: number
      ): void;
      setSize(width: number, height: number): void;
    }
  }
  
  declare module "three/examples/jsm/shaders/FXAAShader" {
    export const FXAAShader: {
      uniforms: {
        tDiffuse: { value: any };
        resolution: { value: any };
      };
      vertexShader: string;
      fragmentShader: string;
    };
  }
  

declare module "three/examples/jsm/shaders/GammaCorrectionShader" {
  export const GammaCorrectionShader: {
    uniforms: Record<string, { value: any }>;
    vertexShader: string;
    fragmentShader: string;
  };
}

declare module "three/examples/jsm/shaders/CopyShader" {
  export const CopyShader: {
    uniforms: Record<string, { value: any }>;
    vertexShader: string;
    fragmentShader: string;
  };
}
