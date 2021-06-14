import { Mesh, OrthographicCamera, PlaneGeometry, RawShaderMaterial, WebGLRenderer, Scene, WebGLRenderTarget } from "three";


export const renderPixelShaderToTexture = 
    (
        renderer: WebGLRenderer,
        width: number,
        height: number,
        renderTarget: WebGLRenderTarget,
        vertexShader: string,
        fragmentShader: string,
        uniforms: any = {}
    ) => {

    renderer.setSize(width, height);
    const scene2 = new Scene();
    const camera2 = new OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 20);

    const geometry = new PlaneGeometry(width, height, 1, 1);
    const uniforms2 = {
        textureWidth: { value: width },
        textureHeight: { value: height },
        ...uniforms,
    };
    const material2 = new RawShaderMaterial({
        uniforms: uniforms2,
        vertexShader,
        fragmentShader,
    });
    const cube = new Mesh(geometry, material2);
    scene2.add(cube);

    camera2.position.z = 5;

    renderer.setRenderTarget(renderTarget);
    renderer.render(scene2, camera2);

    renderer.setRenderTarget(null);
    renderer.render(scene2, camera2);

};