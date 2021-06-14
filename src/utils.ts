export const parseShader = (shader: string) => shader.substr(16, shader.length-20).replace(/\\n/g, "\n").replace(/\\r/g, "\n");
